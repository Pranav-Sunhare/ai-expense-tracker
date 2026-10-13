import os
import uuid
from typing import List
import schemas

from fastapi import FastAPI, Depends, UploadFile, File, HTTPException, status
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

import models
from database import engine, get_db
import auth
from auth import get_current_user
from ai_service import extract_receipt_with_gemini, validate_math_consistency
from schemas import ExpenseCreate, ExpenseResponse

# 1. Automatically create all MySQL tables defined in models.py
models.Base.metadata.create_all(bind=engine)




app = FastAPI(
    title="AI Expense Scanner API",
    description="Backend API for processing receipts with Gemini and MySQL.",
    version="1.0.0"
)


from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Production me specific URL de sakte hain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# 2. Setup Uploads Directory & Static Files Serving
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# 3. Connect Auth Router
app.include_router(auth.router)

# ==========================================
# GENERAL ROUTES
# ==========================================

@app.get("/")
def root():
    return {
        "message": "Welcome to the AI Expense Scanner API!",
        "docs_url": "http://localhost:8000/docs"
    }

@app.get("/me")
def read_current_user(current_user: models.User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username
    }

# ==========================================
# EXPENSE SCANNING & MANAGEMENT ROUTES
# ==========================================

@app.post("/scan-receipt", tags=["Expenses"])
async def scan_receipt(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user)
):
    # Image file validation
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File provided must be an image (JPEG, PNG, WEBP)."
        )

    # In-memory image bytes read karo
    image_bytes = await file.read()

    # Image ko local 'uploads/' folder me unique naam se save karo
    file_extension = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    with open(file_path, "wb") as buffer:
        buffer.write(image_bytes)

    # Public static URL generate karo
    receipt_image_url = f"/uploads/{unique_filename}"

    # Gemini AI Extraction & Math check
    try:
        extracted_data = extract_receipt_with_gemini(image_bytes, file.content_type)

        if extracted_data.total_amount <= 0 and not extracted_data.items:
            if os.path.exists(file_path):
                os.remove(file_path)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid Receipt: Ye valid bill ya receipt nahi hai."
            )
        
        verification_status = validate_math_consistency(extracted_data)

        return {
            "status": verification_status,
            "receipt_image_url": receipt_image_url,
            "data": extracted_data.model_dump()
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI Vision extraction error: {str(e)}"
        )

@app.post("/expenses", response_model=ExpenseResponse, tags=["Expenses"])
def create_expense(
    expense_in: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Saves the reviewed/confirmed expense and its line items into MySQL."""
    # Master expense row create karo
    db_expense = models.Expense(
        user_id=current_user.id,
        merchant_name=expense_in.merchant_name,
        date=expense_in.date,
        tax_amount=expense_in.tax_amount,
        total_amount=expense_in.total_amount,
        category=expense_in.category,
        needs_review=expense_in.needs_review,
        receipt_image_url=getattr(expense_in, "receipt_image_url", None)
    )
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)

    # Line items save karo (agar models.py me ExpenseItem exist karta hai)
    if hasattr(models, "ExpenseItem") and expense_in.items:
        for item in expense_in.items:
            db_item = models.ExpenseItem(
                expense_id=db_expense.id,
                item_name=item.item_name,
                price=item.price
            )
            db.add(db_item)
        db.commit()
        db.refresh(db_expense)

    return db_expense

@app.get("/expenses", response_model=List[ExpenseResponse], tags=["Expenses"])
def get_user_expenses(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Fetches all expenses belonging to the currently logged-in user."""
    return db.query(models.Expense).filter(models.Expense.user_id == current_user.id).all()

@app.get("/expenses/{expense_id}", response_model=schemas.ExpenseResponse)
def get_expense_by_id(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Logged-in user ka specific expense dhoondo
    expense = (
        db.query(models.Expense)
        .filter(models.Expense.id == expense_id, models.Expense.user_id == current_user.id)
        .first()
    )

    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Expense with id {expense_id} not found"
        )

    return expense


@app.delete("/expenses/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Sirf logged-in user ka expense dhoondein
    expense = (
        db.query(models.Expense)
        .filter(models.Expense.id == expense_id, models.Expense.user_id == current_user.id)
        .first()
    )

    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Expense with id {expense_id} not found"
        )

    # SQLAlchemy cascade rule expense_items ko bhi automatically delete kar dega
    db.delete(expense)
    db.commit()
    return None