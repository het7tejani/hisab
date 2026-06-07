import React, { useState, useEffect, useMemo } from 'react';
import { API_BASE } from '../utils/api';

export function ManualEntry({ onAdd }) {
  // ─── MAIN EXPENSE FORM STATE ──────────────────────────────────────
  const [items, setItems] = useState([{ name: '', price: '', quantity: 1 }]);
  const [submitting, setSubmitting] = useState(false);

  // ─── PERSISTENT MONGO-CONNECTED PRESET STATE ──────────────────────
  const [presetProducts, setPresetProducts] = useState([]);
  const [presetsLoading, setPresetsLoading] = useState(true);

  // Preset Creator Input Fields
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetPrice, setNewPresetPrice] = useState('');
  const [newPresetQuantity, setNewPresetQuantity] = useState(1);

  // 1. Fetch Presets on Mount from Database
  useEffect(() => {
    fetchPresets();
  }, []);

  const fetchPresets = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/presets`); // Ensure port matches backend
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
    price: preset.price,
    quantity: 1
  }
]);
    } else {
      setItems([...items, {
  name: preset.name,
  price: preset.price,
  quantity: 1
}]);
    }
  };

  const grandTotalAmount = useMemo(() => {
    return items.reduce((sum, item) => {
      const p = parseFloat(item.price) || 0;
      const q = parseInt(item.quantity) || 1;
      return sum + (p * q);
    }, 0);
  }, [items]);

  // ─── DATABASE PRESET CRUD ACTIONS ─────────────────────────────────
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
          quantity: parseInt(newPresetQuantity) || 1
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
        method: 'DELETE'
      });

      if (res.ok) {
        setPresetProducts(presetProducts.filter(p => p._id !== id)); // Mongoose uses _id
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

    const finalizedSubItems = items.map(item => ({
      name: item.name.trim(),
      price: parseFloat(item.price) || 0,
      quantity: parseInt(item.quantity) || 1,
      total: (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 1),
    }));

    const autoDescription = finalizedSubItems.map(item => item.name).join(', ') || 'Misc Expense';

    try {
      await onAdd({
        description: autoDescription,
        amount: grandTotalAmount,
        category: 'misc',
        items: finalizedSubItems,
      });

      setItems([{ name: '', price: '', quantity: 1 }]);
    } catch (err) {
      // Handled globally
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="manual-entry-block">
      
      {/* 0. QUICK PRESET BUTTONS */}
      {!presetsLoading && presetProducts.length > 0 && (
        <div style={{ marginBottom: 'var(--space-md)' }}>
          <h3 className="entries-section__title" style={{ fontSize: '0.75rem', marginBottom: '8px' }}>⚡ Quick Add Presets</h3>
          <div className="preset-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}>
            {presetProducts.map((product) => (
              <button
                key={product._id}
                type="button"
                className="preset-chip"
                onClick={() => injectPresetToForm(product)}
                style={{ position: 'relative', display: 'flex', flexDirection: 'column', width: '100%', padding: '8px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                  <span className="preset-chip__name" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '85%' }}>
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

      {/* 1. MAIN DETAILED EXPENSE FORM */}
      <form className="manual-entry" onSubmit={handleSubmitExpense} id="manual-entry-form">
        <h2 className="manual-entry__title">Add Detailed Expense</h2>

        <div className="item-builder">
          {items.map((item, index) => {
            const calculatedRowTotal = (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 1);
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
                <input
                  type="number"
                  placeholder="Qty"
                  className="manual-entry__input"
                  style={{ width: '100%', textAlign: 'center', paddingLeft: '4px', paddingRight: '4px' }}
                  value={item.quantity}
                  onChange={(e) => handleItemLineChange(index, 'quantity', parseInt(e.target.value) || '')}
                  min="1"
                  required
                />
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
          className="manual-entry__btn"
          type="submit"
          disabled={submitting || grandTotalAmount <= 0}
        >
          {submitting ? 'Logging...' : '＋ Save Ledger Entry'}
        </button>
      </form>

      {/* 2. PERSISTED DATABASE PRESET CREATOR */}
      <section className="manual-entry" style={{ padding: 'var(--space-md)' }}>
        <h3 className="entries-section__title" style={{ marginBottom: 'var(--space-sm)' }}>🛠️ Predefine Recurring Items</h3>
        
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

        <h3 className="entries-section__title" style={{ fontSize: '0.68rem', opacity: '0.7', marginTop: 'var(--space-md)' }}>📋 Saved Database Presets</h3>
        
        {presetsLoading ? (
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '12px' }}>
            Syncing presets with MongoDB...
          </div>
        ) : presetProducts.length === 0 ? (
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '12px' }}>
            No predefined presets saved to database yet.
          </div>
        ) : (
          <div className="preset-grid">
            {presetProducts.map((product) => (
              <div
                key={product._id}
                className="preset-chip"
                style={{ position: 'relative', display: 'flex', flexDirection: 'column', width: '100%', cursor: 'default' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                  <span className="preset-chip__name" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '85%' }}>
                    {product.name}
                  </span>
                  <span 
                    onClick={(e) => handleDeletePreset(product._id, e)}
                    style={{ color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer', padding: '2px 4px' }}
                    onMouseOver={(e) => e.target.style.color = 'var(--accent-red)'}
                    onMouseOut={(e) => e.target.style.color = 'var(--text-muted)'}
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