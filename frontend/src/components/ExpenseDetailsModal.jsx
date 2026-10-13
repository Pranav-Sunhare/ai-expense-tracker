// src/components/ExpenseDetailsModal.jsx
import React, { useEffect, useState } from 'react';
import API, { BASE_URL } from '../api/client';

export default function ExpenseDetailsModal({ expenseId, onClose }) {
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!expenseId) return;
    setLoading(true);
    API.get(`/expenses/${expenseId}`)
      .then((res) => setExpense(res.data))
      .catch((err) => console.error('Error loading bill details:', err))
      .finally(() => setLoading(false));
  }, [expenseId]);

  if (!expenseId) return null;

  // Backend image URL resolve karein (http://127.0.0.1:8000/uploads/...)
  const imageUrl = expense?.receipt_image_url
    ? expense.receipt_image_url.startsWith('http')
      ? expense.receipt_image_url
      : `${BASE_URL}${expense.receipt_image_url}`
    : null;

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(2px)' }}>
      <div className="modal-dialog modal-xl modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg">
          <div className="modal-header bg-dark text-white py-3">
            <h5 className="modal-title d-flex align-items-center">
              <i className="bi bi-receipt-cutoff text-warning me-2 fs-5"></i>
              <span>Bill Details #{expenseId}</span>
              {expense && (
                <span className={`badge ms-3 ${expense.needs_review ? 'bg-warning text-dark' : 'bg-success'}`}>
                  {expense.needs_review ? 'Needs Review' : 'Verified'}
                </span>
              )}
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          <div className="modal-body p-4">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="mt-2 text-muted">Loading bill information...</p>
              </div>
            ) : expense ? (
              <div className="row g-4 align-items-start">
                {/* LEFT SIDE: BILL PHOTO */}
                <div className="col-lg-6 border-end">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="fw-bold text-secondary mb-0">
                      <i className="bi bi-image me-1"></i> Original Bill Image
                    </h6>
                    {imageUrl && (
                      <a
                        href={imageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-sm btn-outline-primary"
                      >
                        <i className="bi bi-box-arrow-up-right me-1"></i> Full Resolution
                      </a>
                    )}
                  </div>

                  {imageUrl ? (
                    <div className="card bg-light border p-2 text-center shadow-sm">
                      <a href={imageUrl} target="_blank" rel="noreferrer">
                        <img
                          src={imageUrl}
                          alt="Bill Scan"
                          className="img-fluid rounded border"
                          style={{
                            maxHeight: '430px',
                            width: '100%',
                            objectFit: 'contain',
                            backgroundColor: '#fff',
                          }}
                        />
                      </a>
                      <small className="text-muted mt-2 d-block">
                        <i className="bi bi-zoom-in me-1"></i> Click photo to inspect in new tab
                      </small>
                    </div>
                  ) : (
                    <div className="text-center py-5 bg-light rounded border border-dashed">
                      <i className="bi bi-file-earmark-x text-muted display-4 d-block mb-2"></i>
                      <p className="text-muted mb-0">No physical receipt photo attached for this record.</p>
                    </div>
                  )}
                </div>

                {/* RIGHT SIDE: EXTRACTED DETAILS & ITEM BREAKDOWN */}
                <div className="col-lg-6">
                  <div className="d-flex justify-content-between align-items-start pb-2 border-bottom">
                    <div>
                      <h4 className="fw-bold text-dark mb-1">{expense.merchant_name}</h4>
                      <span className="badge bg-secondary-subtle text-secondary border">
                        {expense.category || 'General'}
                      </span>
                    </div>
                    <div className="text-end">
                      <small className="text-muted d-block">Date of Bill</small>
                      <strong className="text-dark">{expense.date || 'N/A'}</strong>
                    </div>
                  </div>

                  <h6 className="fw-bold text-secondary mt-3 mb-2">
                    <i className="bi bi-list-check me-1"></i> Line Items Breakdown
                  </h6>
                  <div className="table-responsive border rounded" style={{ maxHeight: '220px' }}>
                    <table className="table table-striped table-hover mb-0">
                      <thead className="table-light sticky-top">
                        <tr>
                          <th>Item Description</th>
                          <th className="text-end">Price (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {expense.items && expense.items.length > 0 ? (
                          expense.items.map((it, idx) => (
                            <tr key={idx}>
                              <td>{it.item_name}</td>
                              <td className="text-end fw-semibold">₹{Number(it.price).toFixed(2)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="2" className="text-center text-muted py-3">
                              No individual line items recorded.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* SUMMARY FINANCIAL BOX */}
                  <div className="bg-light p-3 rounded mt-3 border">
                    <div className="d-flex justify-content-between text-muted mb-1 small">
                      <span>Subtotal:</span>
                      <span>₹{Number(expense.subtotal || 0).toFixed(2)}</span>
                    </div>
                    <div className="d-flex justify-content-between text-muted mb-2 small">
                      <span>Tax / GST:</span>
                      <span>₹{Number(expense.tax_amount || 0).toFixed(2)}</span>
                    </div>
                    <hr className="my-2" />
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="fw-bold text-dark">Total Amount:</span>
                      <span className="fw-bold fs-4 text-success">
                        ₹{Number(expense.total_amount || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="alert alert-danger mb-0">Failed to load expense details.</div>
            )}
          </div>

          <div className="modal-footer bg-light py-2">
            <button className="btn btn-secondary btn-sm px-3" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}