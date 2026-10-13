// src/components/ExpenseList.jsx
import React, { useState } from 'react';
import API from '../api/client';
import ExpenseDetailsModal from './ExpenseDetailsModal';

export default function ExpenseList({ expenses, onRefresh }) {
  const [selectedId, setSelectedId] = useState(null);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      await API.delete(`/expenses/${id}`);
      onRefresh();
    } catch {
      alert('Failed to delete expense.');
    }
  };

  return (
    <div className="card shadow-sm border-0">
      <div className="card-header bg-white fw-bold py-3 d-flex justify-content-between align-items-center">
        <span>
          <i className="bi bi-table text-primary me-2"></i>Recorded Bills History
        </span>
        <button className="btn btn-outline-secondary btn-sm" onClick={onRefresh}>
          <i className="bi bi-arrow-clockwise me-1"></i>Refresh
        </button>
      </div>

      <div className="card-body p-0">
        {expenses.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-inbox fs-1 d-block mb-2"></i>
            No expenses found. Scan your first bill above!
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ width: '70px' }}>S.No.</th>
                  <th>ID</th>
                  <th>Date</th>
                  <th>Merchant</th>
                  <th>Category</th>
                  <th>Total (₹)</th>
                  <th>Review Status</th>
                  <th>Details & Bill</th>
                  <th className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp, index) => (
                  <tr key={exp.id}>
                    {/* Continuous Serial Number (1, 2, 3...) */}
                    <td className="fw-bold text-muted">{index + 1}</td>
                    
                    {/* Database Primary Key ID */}
                    <td className="text-secondary">#{exp.id}</td>

                    <td>{exp.date || '-'}</td>
                    <td className="fw-semibold">{exp.merchant_name}</td>
                    <td>
                      <span className="badge bg-secondary-subtle text-secondary border">
                        {exp.category || 'General'}
                      </span>
                    </td>
                    <td className="fw-bold text-success">
                      ₹{Number(exp.total_amount).toFixed(2)}
                    </td>
                    <td>
                      {exp.needs_review ? (
                        <span className="badge bg-warning text-dark">
                          <i className="bi bi-exclamation-circle me-1"></i>Needs Review
                        </span>
                      ) : (
                        <span className="badge bg-success">
                          <i className="bi bi-check-circle me-1"></i>Verified
                        </span>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => setSelectedId(exp.id)}
                      >
                        <i className="bi bi-eye me-1"></i>View Bill & Items
                      </button>
                    </td>
                    <td className="text-end">
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(exp.id)}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ExpenseDetailsModal expenseId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}