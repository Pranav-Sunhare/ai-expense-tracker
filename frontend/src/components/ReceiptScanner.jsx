// src/components/ReceiptScanner.jsx
import React, { useState } from 'react';
import API from '../api/client';

export default function ReceiptScanner({ onExpenseSaved }) {
  const [file, setFile] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [extractedPayload, setExtractedPayload] = useState(null);
  const [error, setError] = useState('');

  // 1. File select handle karna
  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setExtractedPayload(null);
      setError('');
    }
  };

  // 2. Gemini AI scan endpoint call karna
  const handleScan = async () => {
    if (!file) return;
    setScanning(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await API.post('/scan-receipt', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const d = res.data.data;
      setExtractedPayload({
        merchant_name: d.merchant_name || 'Unknown Vendor',
        date: d.date || new Date().toISOString().split('T')[0],
        category: d.category || 'General',
        subtotal: Number(d.subtotal) || 0,
        tax_amount: Number(d.tax_amount) || 0,
        total_amount: Number(d.total_amount) || 0,
        receipt_image_url: res.data.receipt_image_url,
        items: d.items || [],
        is_doubtful: Boolean(d.is_doubtful),
      });
    } catch (err) {
      // Fake / Non-receipt image ko yahan block karke error render karna
      setError(
        err.response?.data?.detail || 'Receipt scan failed. Please upload a valid bill/receipt.'
      );
    } finally {
      setScanning(false);
    }
  };

  // 3. Real-time Math Mismatch Check (Items Sum vs Grand Total)
  const itemsSum =
    extractedPayload?.items?.reduce((acc, curr) => acc + (parseFloat(curr.price) || 0), 0) || 0;
  const expectedTotal = itemsSum + (parseFloat(extractedPayload?.tax_amount) || 0);
  
  // Agar items ka jod aur grand total me ₹1.5 se zyada ka difference ho toh mismatch flag true hoga
  const isMathMismatch = extractedPayload
    ? Math.abs(expectedTotal - (parseFloat(extractedPayload.total_amount) || 0)) > 1.5
    : false;

  // 4. Manual Line Item Editing
  const handleItemChange = (index, field, value) => {
    const updated = [...extractedPayload.items];
    updated[index][field] = field === 'price' ? parseFloat(value) || 0 : value;
    setExtractedPayload({ ...extractedPayload, items: updated });
  };

  const addItemRow = () => {
    setExtractedPayload({
      ...extractedPayload,
      items: [...extractedPayload.items, { item_name: 'New Item', price: 0 }],
    });
  };

  const removeItemRow = (index) => {
    const updated = extractedPayload.items.filter((_, i) => i !== index);
    setExtractedPayload({ ...extractedPayload, items: updated });
  };

  // 5. Database Save Function ("Confirm & Save" OR "Save Anyway")
  const handleSaveToDatabase = async (forceReviewFlag = false) => {
    setSaving(true);
    setError('');

    // Agar mismatch hai ya user ne "Save Anyway" dabaya hai toh needs_review true set hoga
    const finalReviewStatus = isMathMismatch || extractedPayload.is_doubtful || forceReviewFlag;

    const finalPayload = {
      merchant_name: extractedPayload.merchant_name,
      date: extractedPayload.date,
      subtotal: extractedPayload.subtotal,
      tax_amount: extractedPayload.tax_amount,
      total_amount: extractedPayload.total_amount,
      category: extractedPayload.category,
      needs_review: finalReviewStatus,
      receipt_image_url: extractedPayload.receipt_image_url,
      items: extractedPayload.items,
    };

    try {
      await API.post('/expenses', finalPayload);
      setExtractedPayload(null);
      setFile(null);
      onExpenseSaved(); // Table refresh callback
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save expense record.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card shadow-sm border-0 mb-4">
      <div className="card-header bg-dark text-white fw-bold py-3 d-flex align-items-center">
        <i className="bi bi-shield-check text-warning me-2 fs-5"></i>
        AI Receipt Scanner & Validator
      </div>

      <div className="card-body">
        {/* Error Alert (e.g. Non-receipt / Corrupt image) */}
        {error && <div className="alert alert-danger py-2">{error}</div>}

        {/* Upload Row */}
        <div className="row g-3 align-items-center">
          <div className="col-md-8">
            <input
              type="file"
              accept="image/*"
              className="form-control"
              onChange={handleFileChange}
              disabled={scanning}
            />
            <small className="text-muted">Upload any valid bill, receipt, or invoice photo.</small>
          </div>
          <div className="col-md-4">
            <button
              className="btn btn-warning w-100 fw-bold"
              disabled={!file || scanning}
              onClick={handleScan}
            >
              {scanning ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Validating with Gemini...
                </>
              ) : (
                <>
                  <i className="bi bi-magic me-1"></i>Scan Receipt
                </>
              )}
            </button>
          </div>
        </div>

        {/* Extracted Data Form & Validation Area */}
        {extractedPayload && (
          <div className="mt-4 p-3 border rounded bg-light">
            
            {/* Visual Math Banner */}
            {isMathMismatch ? (
              <div className="alert alert-warning d-flex align-items-center justify-content-between py-2 mb-3">
                <div>
                  <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
                  <strong>Calculation Inconsistency:</strong> Items sum (₹{itemsSum.toFixed(2)}) + Tax (₹{extractedPayload.tax_amount}) does not match Grand Total (₹{extractedPayload.total_amount}).
                </div>
                <span className="badge bg-danger">Needs Review</span>
              </div>
            ) : (
              <div className="alert alert-success d-flex align-items-center py-2 mb-3">
                <i className="bi bi-check-circle-fill me-2 fs-5"></i>
                <strong>Verified:</strong> Bill math is accurate and consistent.
              </div>
            )}

            {/* General Bill Header Fields */}
            <div className="row g-3 mb-3">
              <div className="col-md-4">
                <label className="form-label small text-muted">Merchant</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={extractedPayload.merchant_name}
                  onChange={(e) =>
                    setExtractedPayload({ ...extractedPayload, merchant_name: e.target.value })
                  }
                />
              </div>
              <div className="col-md-3">
                <label className="form-label small text-muted">Date</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={extractedPayload.date || ''}
                  onChange={(e) =>
                    setExtractedPayload({ ...extractedPayload, date: e.target.value })
                  }
                />
              </div>
              <div className="col-md-3">
                <label className="form-label small text-muted">Category</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={extractedPayload.category}
                  onChange={(e) =>
                    setExtractedPayload({ ...extractedPayload, category: e.target.value })
                  }
                />
              </div>
              <div className="col-md-2">
                <label className="form-label small text-muted">Grand Total (₹)</label>
                <input
                  type="number"
                  step="any"
                  className="form-control form-control-sm fw-bold text-success"
                  value={extractedPayload.total_amount}
                  onChange={(e) =>
                    setExtractedPayload({
                      ...extractedPayload,
                      total_amount: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>

            {/* Line Items Section */}
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="small fw-bold text-secondary mb-0">Line Items Breakdown</h6>
              <button className="btn btn-sm btn-outline-secondary py-0" onClick={addItemRow}>
                <i className="bi bi-plus me-1"></i>Add Item
              </button>
            </div>

            {extractedPayload.items.map((item, idx) => (
              <div className="row g-2 mb-2 align-items-center" key={idx}>
                <div className="col-7">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={item.item_name}
                    onChange={(e) => handleItemChange(idx, 'item_name', e.target.value)}
                  />
                </div>
                <div className="col-4">
                  <input
                    type="number"
                    step="any"
                    className="form-control form-control-sm"
                    value={item.price}
                    onChange={(e) => handleItemChange(idx, 'price', e.target.value)}
                  />
                </div>
                <div className="col-1 text-end">
                  <button
                    className="btn btn-sm btn-outline-danger py-0 px-2"
                    onClick={() => removeItemRow(idx)}
                  >
                    &times;
                  </button>
                </div>
              </div>
            ))}

            {/* Action Buttons: Conditional Switching */}
            <div className="d-flex justify-content-end gap-2 mt-4">
              {isMathMismatch ? (
                /* Agar calculation match nahi karega toh yeh button database me needs_review: true ke saath save karega */
                <button
                  className="btn btn-warning"
                  disabled={saving}
                  onClick={() => handleSaveToDatabase(true)}
                >
                  {saving ? (
                    'Saving...'
                  ) : (
                    <>
                      <i className="bi bi-exclamation-triangle me-1"></i>
                      Save Anyway (Mark as Needs Review)
                    </>
                  )}
                </button>
              ) : (
                /* Agar calculation sahi hai toh direct green verified save hoga */
                <button
                  className="btn btn-success px-4"
                  disabled={saving}
                  onClick={() => handleSaveToDatabase(false)}
                >
                  {saving ? (
                    'Saving...'
                  ) : (
                    <>
                      <i className="bi bi-check2-circle me-1"></i>
                      Confirm & Save Bill
                    </>
                  )}
                </button>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}