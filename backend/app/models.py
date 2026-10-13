from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    
    # User -> Expenses (1 to Many)
    expenses = relationship("Expense", back_populates="owner")

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    merchant_name = Column(String(100), index=True)
    date = Column(String(20), nullable=True)
    total_amount = Column(Float, nullable=False)
    tax_amount = Column(Float, default=0.0)
    category = Column(String(50), default="Uncategorized")
    needs_review = Column(Boolean, default=False)
    receipt_image_url = Column(String(255), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Expense -> User
    owner = relationship("User", back_populates="expenses")

    # Expense -> ExpenseItem (YEH LINE MISSING THI)
   # ✅ Sahi:
    items = relationship("ExpenseItem", back_populates="expense", cascade="all, delete-orphan", lazy="joined")

class ExpenseItem(Base):
    __tablename__ = "expense_items"

    id = Column(Integer, primary_key=True, index=True)
    expense_id = Column(Integer, ForeignKey("expenses.id"), nullable=False)
    item_name = Column(String(255), nullable=False)
    price = Column(Float, nullable=False)

    # ExpenseItem -> Expense
    expense = relationship("Expense", back_populates="items")