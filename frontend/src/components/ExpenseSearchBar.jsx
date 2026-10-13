// src/components/ExpenseSearchBar.jsx
import React, { useState } from 'react';
import API from '../api/client';

export default function ExpenseSearchBar({ onSelectExpense }) {
  const [searchId, setSearchId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    const cleanId = searchId.trim();

    if (!cleanId) {
      setError('Please enter a valid Bill ID');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Backend GET /expenses/{id} endpoint call
      const res = await API.get(`/expenses/${cleanId}`);
      if (res.data && res.data.id) {
        onSelectExpense(res.data.id); // Modal open karne ke liye parent ko ID pass karein
        setSearchId('');
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setError(`Bill with ID #${cleanId} not found.`);
      } else {
        setError(err.response?.data?.detail || 'Failed to fetch bill details.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card shadow-sm border-0 mb-4">
      <div className="card-body p-3">
        <form onSubmit={handleSearch}>
          <div className="row g-2 align-items-center">
            <div className="col-auto">
              <label className="fw-semibold text-secondary small d-flex align-items-center">
                <i className="bi bi-search me-1 text-primary"></i> Find Bill by ID:
              </label>
            </div>
            <div className="col-md-4 col-sm-6">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-light text-muted">#</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  className="form-control"
                  placeholder="Enter Bill ID (e.g. 3)"
                  value={searchId}
                  onChange={(e) => {
                    setSearchId(e.target.value);
                    if (error) setError('');
                  }}
                  disabled={loading}
                />
                <button
                  type="submit"
                  className="btn btn-primary px-3"
                  disabled={!searchId || loading}
                >
                  {loading ? (
                    <span className="spinner-border spinner-border-sm"></span>
                  ) : (
                    'Search'
                  )}
                </button>
              </div>
            </div>
            {error && (
              <div className="col-12 mt-2">
                <span className="text-danger small fw-semibold">
                  <i className="bi bi-exclamation-circle me-1"></i>
                  {error}
                </span>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}