import React, { useState, useEffect, useMemo } from 'react';
import { API_BASE } from '../utils/api';

export function ManualEntry({ onAdd, currentMode }) {
  // ─── MAIN EXPENSE FORM STATE ──────────────────────────────────────
  const [items, setItems] = useState([{ name: '', price: '', quantity: 1 }]);
  const [submitting, setSubmitting] = useState(false);

  // ─── OFFICE DUE PAYMENT MECHANISMS ─────────────────────────────────
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [officeSubView, setOfficeSubView] = useState('import'); // 'import' or 'payment'

  // Back-and-forth mode reset bounds
  useEffect(() => {
    setOfficeSubView('import');
    setPaymentAmount('');
    setPaymentNote('');
  }, [currentMode]);

  // ─── PERSISTENT MONGO-CONNECTED PRESET STATE ──────────────────────
  const [presetProducts, setPresetProducts] = useState([]);
  const [presetsLoading, setPresetsLoading] = useState(true);

  // Preset Creator Input Fields
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetPrice, setNewPresetPrice] = useState('');
  const [newPresetQuantity, setNewPresetQuantity] = useState(1);

  // Filter Presets to show only those associated with the current active mode.
  const filteredPresets = useMemo(() => {
    return presetProducts.filter((product) => {
      if (currentMode === 'office') {
        return product.category === 'office';
      } else {
        return product.category !== 'office';
      }
    });
  }, [presetProducts, currentMode]);

  // ─── MAIN EXPENSE BUILDER ACTIONS ─────────────────────────────────
  const handleItemLineChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const appendNewLineItem = () => {
    setItems([...items, { name: '', price: '', quantity: 1 }]);
  };

  const removeLineItem = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const injectPresetToForm = (preset) => {
    if (items.length === 1 && items[0].name === '') {
      setItems([
        {
          name: preset.name,
          price: String(preset.price),
          quantity: 1,
        },
      ]);
    } else {
      setItems([
        ...items,
        {
          name: preset.name,
          price: String(preset.price),
          quantity: 1,
        },
      ]);
    }
  };

  const grandTotalAmount = useMemo(() => {
    return items.reduce((sum, item) => {
      const p = parseFloat(item.price) || 0;
      const q = Number(item.quantity) || 1;
      return sum + p * q;
    }, 0);
  }, [items]);

  // ─── DATABASE PRESET CRUD ACTIONS ─────────────────────────────────
  // Fetch Presets from DB
  const fetchPresets = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/presets`);
      if (res.ok) {
        const data = await res.json();
        setPresetProducts(data);
      }
    } catch (err) {
      console.error('Error hitting preset endpoints:', err);
    } finally {
      setPresetsLoading(false);
    }
  };

  useEffect(() => {
    fetchPresets();
  }, []);

  const handleAddPreset = async (e) => {
    e.preventDefault();
    if (!newPresetName.trim() || !newPresetPrice) return;

    try {
      const res = await fetch(`${API_BASE}/api/presets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPresetName.trim(),
          price: parseFloat(newPresetPrice),
          quantity: Number(newPresetQuantity) || 1,
          category: currentMode, // Persist on database matching active mode
        }),
      });

      if (res.ok) {
        const savedPreset = await res.json();
        setPresetProducts([savedPreset, ...presetProducts]);

        // Reset builder fields
        setNewPresetName('');
        setNewPresetPrice('');
        setNewPresetQuantity(1);
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to save preset to DB');
      }
    } catch (err) {
      console.error('Failed to create new preset entry:', err);
    }
  };

  const handleDeletePreset = async (id, e) => {
    e.stopPropagation(); // Avoid firing injectPresetToForm triggers

    if (!window.confirm('Are you sure you want to permanently delete this quick preset?')) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/presets/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setPresetProducts(presetProducts.filter((p) => p._id !== id));
      }
    } catch (err) {
      console.error('Failed to delete preset item:', err);
    }
  };

  // ─── SUBMIT ENTRY TO BACKEND ──────────────────────────────────────
  const handleSubmitExpense = async (e) => {
    e.preventDefault();
    if (grandTotalAmount <= 0 || submitting) return;

    setSubmitting(true);

    const finalizedSubItems = items.map((item) => ({
      name: item.name.trim(),
      price: parseFloat(item.price) || 0,
      quantity: Number(item.quantity) || 1,
      total: (parseFloat(item.price) || 0) * (Number(item.quantity) || 1),
    }));

    const autoDescription = finalizedSubItems.map((item) => item.name).join(', ') || 'Misc Expense';

    try {
      await onAdd({
        description: autoDescription,
        amount: grandTotalAmount,
        category: currentMode, // Save database entry filtered by Home or Office mode
        items: finalizedSubItems,
      });

      setItems([{ name: '', price: '', quantity: 1 }]);
    } catch (err) {
      // Handled globally
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    const parsedAmount = parseFloat(paymentAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0 || submitting) return;

    setSubmitting(true);
    const note = paymentNote.trim() || 'installment';
    const finalDescription = `💸 Repayment to Brother (${note})`;

    try {
      await onAdd({
        description: finalDescription,
        amount: parsedAmount,
        category: 'office',
        items: [],
      });
      setPaymentAmount('');
      setPaymentNote('');
    } catch (err) {
      console.error('Failed to log repayment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="manual-entry-block">
      {/* Segment Selector for Office Dues/Imports */}
      {currentMode === 'office' && (
        <div className="office-sub-tab" style={{
          display: 'flex',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: 'var(--radius-md)',
          padding: '3px',
          border: '1px solid var(--border-subtle)',
          marginBottom: 'var(--space-md)',
          gap: '4px',
        }}>
          <button
            type="button"
            onClick={() => setOfficeSubView('import')}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              background: officeSubView === 'import' ? 'rgba(0, 206, 201, 0.15)' : 'transparent',
              color: officeSubView === 'import' ? '#00cec9' : 'var(--text-secondary)',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            📦 Log Product Import
          </button>
          <button
            type="button"
            onClick={() => setOfficeSubView('payment')}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              background: officeSubView === 'payment' ? 'rgba(0, 184, 148, 0.15)' : 'transparent',
              color: officeSubView === 'payment' ? '#00b894' : 'var(--text-secondary)',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            💸 Pay Due (Cut-by-Cut)
          </button>
        </div>
      )}

      {currentMode === 'office' && officeSubView === 'payment' ? (
        /* REPAY BROTHER / PAY DUE CASH INSTALLMENTS FORM */
        <form className="manual-entry" onSubmit={handleSubmitPayment} id="manual-payment-form">
          <h2 className="manual-entry__title" style={{ color: 'var(--accent-green)' }}>
            💸 Repay Brother (Installment)
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px', fontWeight: 600 }}>
                Payment Amount (Installment)
              </label>
              <input
                type="number"
                placeholder="₹ Enter amount paid to brother"
                className="manual-entry__input manual-entry__input--amount"
                style={{ fontSize: '1.25rem', padding: '12px', border: '1px solid rgba(0, 184, 148, 0.3)' }}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                min="1"
                required
              />
            </div>

            {/* Quick preset amount buttons for cut-by-cut */}
            <div>
              <label style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px', fontWeight: 600 }}>
                ⚡ Quick Cut installment Presets
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-xs)' }}>
                {[2000, 5000, 10000, 15000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setPaymentAmount(String(amt))}
                    style={{
                      padding: '8px 4px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid rgba(0, 184, 148, 0.2)',
                      background: 'rgba(0, 184, 148, 0.05)',
                      color: '#00b894',
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    ₹{(amt / 1000)}k
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px', fontWeight: 600 }}>
                Remarks / Note (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Cash payment, GPay, retail offset"
                className="manual-entry__input"
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
              />
            </div>

            <button
              className="manual-entry__btn"
              type="submit"
              disabled={submitting || !paymentAmount}
              style={{
                background: 'var(--gradient-green)',
                marginTop: 'var(--space-sm)',
                boxShadow: '0 4px 12px rgba(0, 184, 148, 0.2)',
              }}
            >
              {submitting ? 'Logging Payment...' : 'Confirm Cash Repayment'}
            </button>
          </div>
        </form>
      ) : (
        /* STANDARD PRODUCT IMPORTS / DETAILED EXPENSE FORM */
        <>
          {/* QUICK PRESET BUTTONS */}
          {!presetsLoading && filteredPresets.length > 0 && (
            <div style={{ marginBottom: 'var(--space-md)' }}>
              <h3 className="entries-section__title" style={{ fontSize: '0.75rem', marginBottom: '8px' }}>
                ⚡ Quick Add Presets ({currentMode === 'office' ? 'Office' : 'Personal'})
              </h3>
              <div className="preset-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}>
                {filteredPresets.map((product) => (
                  <button
                    key={product._id}
                    type="button"
                    className="preset-chip"
                    onClick={() => injectPresetToForm(product)}
                    style={{
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      width: '100%',
                      padding: '8px',
                      alignItems: 'stretch',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'flex-start', gap: '4px' }}>
                      <span className="preset-chip__name">
                        {product.name}
                      </span>
                    </div>
                    <div className="preset-chip__meta" style={{ width: '100%', marginTop: '4px', justifyContent: 'flex-start' }}>
                      <span className="preset-chip__price">₹{product.price}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* MAIN DETAILED EXPENSE FORM */}
          <form className="manual-entry" onSubmit={handleSubmitExpense} id="manual-entry-form">
            <h2 className="manual-entry__title">Add Detailed Expense ({currentMode === 'office' ? 'Office' : 'Personal'})</h2>

            <div className="item-builder">
              {items.map((item, index) => {
                const calculatedRowTotal = (parseFloat(item.price) || 0) * (Number(item.quantity) || 1);
                return (
                  <div key={index} className="item-row">
                    <input
                      type="text"
                      placeholder="Item Name"
                      className="manual-entry__input"
                      style={{ width: '100%' }}
                      value={item.name}
                      onChange={(e) => handleItemLineChange(index, 'name', e.target.value)}
                      required
                    />
                    <input
                      type="number"
                      placeholder="₹ Price"
                      className="manual-entry__input manual-entry__input--amount"
                      style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
                      value={item.price}
                      onChange={(e) => handleItemLineChange(index, 'price', e.target.value)}
                      min="0"
                      step="any"
                      required
                    />
                    <div 
                      className="qty-picker"
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '2px',
                        height: '36px',
                        justifyContent: 'space-between'
                      }}
                    >
                      <button
                        type="button"
                        className="qty-picker__btn"
                        onClick={() => {
                          const currentVal = parseInt(item.quantity) || 1;
                          if (currentVal > 1) {
                            handleItemLineChange(index, 'quantity', currentVal - 1);
                          }
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-secondary)',
                          width: '24px',
                          height: '30px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.9rem',
                          fontWeight: 'bold',
                          userSelect: 'none',
                        }}
                      >
                        −
                      </button>
                      <input
                        type="number"
                        placeholder="Qty"
                        className="qty-picker__input"
                        style={{ 
                          width: '32px', 
                          textAlign: 'center', 
                          border: 'none', 
                          background: 'transparent', 
                          color: 'var(--text-primary)',
                          fontFamily: 'var(--font-sans)',
                          fontSize: '0.82rem',
                          fontWeight: '600',
                          outline: 'none',
                          padding: '0',
                        }}
                        value={item.quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          handleItemLineChange(index, 'quantity', isNaN(val) ? '' : Math.max(1, val));
                        }}
                        min="1"
                        required
                      />
                      <button
                        type="button"
                        className="qty-picker__btn"
                        onClick={() => {
                          const currentVal = parseInt(item.quantity) || 0;
                          handleItemLineChange(index, 'quantity', currentVal + 1);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-secondary)',
                          width: '24px',
                          height: '30px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.9rem',
                          fontWeight: 'bold',
                          userSelect: 'none',
                        }}
                      >
                        ＋
                      </button>
                    </div>
                    <span className="item-row__total">₹{calculatedRowTotal}</span>

                    {items.length > 1 ? (
                      <button
                        type="button"
                        className="item-row__remove"
                        onClick={() => removeLineItem(index)}
                        title="Remove item"
                      >
                        ✕
                      </button>
                    ) : (
                      <div style={{ width: '32px' }} />
                    )}
                  </div>
                );
              })}
            </div>

            <button type="button" className="btn-secondary-subtle" onClick={appendNewLineItem}>
              ➕ Add Next Item Row
            </button>

            <div className="form-summary-footer">
              <span className="form-summary-footer__label">Calculated Grand Total:</span>
              <span className="form-summary-footer__value">₹{grandTotalAmount}</span>
            </div>

            <button
              className={`manual-entry__btn ${currentMode === 'office' ? 'manual-entry__btn--office' : ''}`}
              type="submit"
              disabled={submitting || grandTotalAmount <= 0}
            >
              {submitting ? 'Logging...' : '＋ Save Ledger Entry'}
            </button>
          </form>
        </>
      )}

      {/* PERSISTED DATABASE PRESET CREATOR */}
      <section className="manual-entry" style={{ padding: 'var(--space-md)' }}>
        <h3 className="entries-section__title" style={{ marginBottom: 'var(--space-sm)' }}>
          🛠️ Predefine Recurring Items
        </h3>

        <form onSubmit={handleAddPreset} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: 'var(--space-md)' }}>
          <div className="preset-creator-row">
            <input
              type="text"
              placeholder="Item Name (e.g., Petrol)"
              className="manual-entry__input"
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              required
            />

            <input
              type="number"
              placeholder="₹ Price"
              className="manual-entry__input manual-entry__input--amount"
              value={newPresetPrice}
              onChange={(e) => setNewPresetPrice(e.target.value)}
              min="0"
              step="any"
              required
            />
          </div>
          <button
            type="submit"
            className="btn-secondary-subtle"
            style={{ padding: '12px', borderStyle: 'solid', background: 'var(--bg-glass-strong)' }}
          >
            💾 Save Quick Preset to DB
          </button>
        </form>

        <h3 className="entries-section__title" style={{ fontSize: '0.68rem', opacity: '0.7', marginTop: 'var(--space-md)' }}>
          📋 Saved {currentMode === 'office' ? 'Office' : 'Personal'} Presets
        </h3>

        {presetsLoading ? (
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '12px' }}>
            Syncing presets with MongoDB...
          </div>
        ) : filteredPresets.length === 0 ? (
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '12px' }}>
            No predefined presets saved for this mode yet.
          </div>
        ) : (
          <div className="preset-grid">
            {filteredPresets.map((product) => (
              <div
                key={product._id}
                className="preset-chip"
                style={{ position: 'relative', display: 'flex', flexDirection: 'column', width: '100%', cursor: 'default' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'flex-start', gap: '4px' }}>
                  <span className="preset-chip__name">
                    {product.name}
                  </span>
                  <span
                    onClick={(e) => handleDeletePreset(product._id, e)}
                    style={{ color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer', padding: '2px 4px', lineHeight: '1.2' }}
                    onMouseOver={(e) => (e.target.style.color = 'var(--accent-red)')}
                    onMouseOut={(e) => (e.target.style.color = 'var(--text-muted)')}
                    title="Delete preset permanently"
                  >
                    ✕
                  </span>
                </div>
                <div className="preset-chip__meta" style={{ width: '100%', marginTop: '4px', justifyContent: 'flex-start' }}>
                  <span className="preset-chip__price">₹{product.price}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default ManualEntry;
