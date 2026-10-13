from pydantic import BaseModel, Field
from typing import Optional, List

# ==========================================
# 1. USER SCHEMAS (Authentication)
# ==========================================

class UserCreate(BaseModel):
    """Used when registering a new user via POST /auth/signup"""
    username: str
    password: str

class UserResponse(BaseModel):
    """Returned to the client without exposing password hash"""
    id: int
    username: str

    class Config:
        from_attributes = True

# ==========================================
# 2. TOKEN SCHEMA (JWT Auth)
# ==========================================

class Token(BaseModel):
    """Returned upon successful login via POST /auth/login"""
    access_token: str
    token_type: str

# ==========================================
# 3. RECEIPT ITEM SCHEMA
# ==========================================

class ExpenseItemExtract(BaseModel):
    """Represents an individual line item on a bill"""
    item_name: str = Field(description="Name or description of the purchased item")
    price: float = Field(description="Total price for this line item")

# ==========================================
# 4. EXPENSE DATABASE SCHEMAS
# ==========================================

class ExpenseBase(BaseModel):
    """Base schema holding common fields for an expense"""
    merchant_name: str
    date: Optional[str] = None
    subtotal: Optional[float] = 0.0
    tax_amount: Optional[float] = 0.0
    total_amount: float
    category: Optional[str] = "General"
    needs_review: bool = False
    receipt_image_url: Optional[str] = None

class ExpenseCreate(ExpenseBase):
    """Used when the user saves or confirms an expense into the DB"""
    items: List[ExpenseItemExtract] = []

class ExpenseResponse(ExpenseBase):
    """Returned to the user when fetching expense history via GET /expenses"""
    id: int
    user_id: int
    receipt_image_url: Optional[str] = None
    items: List[ExpenseItemExtract] = []

    class Config:
        from_attributes = True

# ==========================================
# 5. GEMINI AI VISION EXTRACTION SCHEMA
# ==========================================

class ReceiptExtractResponse(BaseModel):
    """Strict schema passed to Gemini Vision to enforce structured JSON output"""
    merchant_name: Optional[str] = Field("Unknown Vendor", description="Store, merchant, or company name")
    date: Optional[str] = Field(None, description="Date on receipt (YYYY-MM-DD or raw text)")
    items: List[ExpenseItemExtract] = Field(default_factory=list, description="List of itemized products")
    subtotal: Optional[float] = Field(0.0, description="Subtotal before taxes")
    tax_amount: Optional[float] = Field(0.0, description="Taxes, GST, or VAT amount")
    total_amount: float = Field(description="Final total payable amount")
    category: str = Field("General", description="Category: Food, Groceries, Travel, Shopping, Utilities, Medical, etc.")
    is_doubtful: bool = Field(False, description="Set True if receipt is blurry, values contradict, or handwriting is unclear")