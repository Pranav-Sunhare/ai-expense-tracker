// src/App.jsx
import React, { useState, useEffect } from 'react';
import API from './api/client';
import AuthModal from './components/AuthModal';
import ReceiptScanner from './components/ReceiptScanner';
import ExpenseList from './components/ExpenseList';
import ExpenseSearchBar from './components/ExpenseSearchBar';
import ExpenseDetailsModal from './components/ExpenseDetailsModal';
import ExpenseAnalytics from './components/ExpenseAnalytics';

export default function App() {
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [activeModalExpenseId, setActiveModalExpenseId] = useState(null);

  // Initial user authentication check
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      API.get('/me')
        .then((res) => {
          setUser(res.data);
          fetchExpenses();
        })
        .catch(() => handleLogout());
    }
  }, []);

  // Fetch all user expenses from backend
  const fetchExpenses = async () => {
    try {
      const res = await API.get('/expenses');
      setExpenses(res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        handleLogout();
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setExpenses([]);
  };

  const totalSpent = expenses.reduce((acc, curr) => acc + (Number(curr.total_amount) || 0), 0);

  return (
    <div className="min-vh-100 bg-light">
      {/* Top Navbar */}
      <nav className="navbar navbar-dark bg-dark px-3 shadow-sm">
        <div className="container-fluid">
          <span className="navbar-brand fw-bold text-warning">
            <i className="bi bi-receipt-cutoff me-2"></i>AI Expense Scanner
          </span>
          <div>
            {user ? (
              <div className="d-flex align-items-center">
                <span className="text-white me-3">
                  <i className="bi bi-person-circle me-1"></i>
                  {user.username}
                </span>
                <button className="btn btn-outline-danger btn-sm" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            ) : (
              <button className="btn btn-primary btn-sm" onClick={() => setShowAuthModal(true)}>
                Login / Sign Up
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <div className="container py-4">
        {!user ? (
          <div className="text-center py-5 bg-white rounded shadow-sm p-5 mt-4">
            <i className="bi bi-shield-lock display-1 text-primary mb-3"></i>
            <h2>AI-Powered Expense Tracker</h2>
            <p className="text-muted">
              Scan receipts using Gemini AI, verify line items, and store them securely in MySQL.
            </p>
            <button className="btn btn-primary px-4" onClick={() => setShowAuthModal(true)}>
              Login / Sign Up
            </button>
          </div>
        ) : (
          <>
            {/* Summary Statistics Cards */}
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <div className="card border-0 shadow-sm bg-success text-white">
                  <div className="card-body py-3">
                    <span className="text-white-50 small">Total Spent</span>
                    <h3 className="fw-bold mb-0">₹{totalSpent.toFixed(2)}</h3>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="card border-0 shadow-sm bg-dark text-white">
                  <div className="card-body py-3">
                    <span className="text-white-50 small">Total Bills Scanned</span>
                    <h3 className="fw-bold mb-0">{expenses.length}</h3>
                  </div>
                </div>
              </div>
            </div>

            {/* 1. Analytics & Visual Charts (Pie + Bar + Top Vendors) */}
            <ExpenseAnalytics expenses={expenses} />

            {/* 2. Find Bill by ID Search Bar */}
            <ExpenseSearchBar onSelectExpense={(id) => setActiveModalExpenseId(id)} />

            {/* 3. AI Receipt Scanner & Validator */}
            <ReceiptScanner onExpenseSaved={fetchExpenses} />

            {/* 4. Recorded Expenses Table with S.No. */}
            <ExpenseList expenses={expenses} onRefresh={fetchExpenses} />

            {/* 5. Bill Details Modal triggered via Search */}
            <ExpenseDetailsModal
              expenseId={activeModalExpenseId}
              onClose={() => setActiveModalExpenseId(null)}
            />
          </>
        )}
      </div>

      {/* Auth Modal for Login/Signup */}
      <AuthModal
        show={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={(u) => {
          setUser(u);
          fetchExpenses();
        }}
      />
    </div>
  );
}