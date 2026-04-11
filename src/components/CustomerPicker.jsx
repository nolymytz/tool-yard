import { useState } from 'react'
import { customers as customersCollection } from '../data/collections.js'
import { Link } from 'react-router-dom'
import { User, AlertCircle, Plus, X } from 'lucide-react'

/**
 * Shared customer selector used by Quotes and Change Orders.
 *
 * Props:
 *   value         — selected customer id, or '' for none
 *   onChange(id)  — called with the new id
 *   includeNone   — show a "— No customer —" option (default true)
 *   noneLabel     — label for the none option
 *   disabled      — disable the select
 *   allowAdd      — show a "+" button next to the picker for quick-add
 *                   without leaving the current screen. On save, the new
 *                   customer becomes the selected value.
 */
export default function CustomerPicker({
  value = '',
  onChange,
  includeNone = true,
  noneLabel = '— Pick a customer —',
  disabled = false,
  allowAdd = false,
}) {
  const all = customersCollection.useAll()
  const [adding, setAdding] = useState(false)

  const addedInline = (saved) => {
    setAdding(false)
    if (saved && saved.id && onChange) onChange(saved.id)
  }

  if (all.length === 0 && !allowAdd) {
    return (
      <div className="flex items-center gap-2 p-3 bg-steel-900 border-2 border-steel-700 text-sm">
        <AlertCircle className="w-4 h-4 text-caution shrink-0" />
        <span className="text-steel-400">
          No customers yet.{' '}
          <Link
            to="/tools/office"
            className="text-safety underline underline-offset-2 hover:text-safety-400"
          >
            Add one in The Office
          </Link>
          .
        </span>
      </div>
    )
  }

  // Empty-state variant when allowAdd is on: still show the picker (disabled)
  // next to a primary "Add customer" button so the user never has to leave.
  if (all.length === 0 && allowAdd) {
    return (
      <>
        <div className="flex gap-2">
          <div className="relative flex-1 opacity-60">
            <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-steel-500 pointer-events-none" />
            <select
              disabled
              className="w-full pl-10 pr-4 py-2.5 bg-steel-900 border-2 border-steel-700 text-steel-100 appearance-none cursor-not-allowed"
            >
              <option>No customers yet</option>
            </select>
          </div>
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="ty-btn-safety shrink-0"
          >
            <Plus className="w-4 h-4" strokeWidth={3} />
            Add customer
          </button>
        </div>
        {adding && (
          <InlineCustomerModal
            onClose={() => setAdding(false)}
            onSave={addedInline}
          />
        )}
      </>
    )
  }

  return (
    <>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-steel-500 pointer-events-none" />
          <select
            value={value}
            disabled={disabled}
            onChange={(e) => onChange && onChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-steel-900 border-2 border-steel-700 text-steel-100 focus:outline-none focus:border-safety disabled:opacity-50 appearance-none cursor-pointer"
          >
            {includeNone && <option value="">{noneLabel}</option>}
            {all.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.contactName ? ` — ${c.contactName}` : ''}
              </option>
            ))}
          </select>
        </div>
        {allowAdd && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            disabled={disabled}
            title="Add new customer"
            className="shrink-0 px-3 py-2.5 bg-steel-900 border-2 border-steel-700 text-steel-300 hover:border-safety hover:text-safety transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4" strokeWidth={3} />
          </button>
        )}
      </div>
      {adding && (
        <InlineCustomerModal
          onClose={() => setAdding(false)}
          onSave={addedInline}
        />
      )}
    </>
  )
}

/** Read-only display for a customer id. Resolves via the live customers collection. */
export function CustomerLabel({ id, fallback = '—' }) {
  const customer = customersCollection.useOne(id)
  if (!customer) return <span className="text-steel-500">{fallback}</span>
  return (
    <span className="inline-flex items-center gap-1.5">
      <User className="w-3.5 h-3.5 text-steel-500" />
      <span>{customer.name}</span>
    </span>
  )
}

// ---------- Inline quick-add modal ----------
//
// Kept local to CustomerPicker so any component that opts into `allowAdd`
// gets the feature for free without importing anything else.

function InlineCustomerModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    name: '',
    contactName: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
  })
  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const submit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    const saved = customersCollection.add(form)
    onSave && onSave(saved)
  }

  return (
    <div
      className="fixed inset-0 bg-steel-950/80 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-steel-800 border-2 border-safety shadow-hard-safety w-full max-w-lg my-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-steel-700">
          <h3 className="font-stencil text-2xl uppercase tracking-wide text-steel-100">
            Add Customer
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-steel-400 hover:text-steel-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          <label className="block">
            <span className="block text-xs font-stencil uppercase tracking-widest text-steel-400 mb-1.5">
              Customer name *
            </span>
            <input
              required
              autoFocus
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              placeholder="The Whitlocks"
              className="ip-inline"
            />
          </label>
          <label className="block">
            <span className="block text-xs font-stencil uppercase tracking-widest text-steel-400 mb-1.5">
              Contact person
            </span>
            <input
              value={form.contactName}
              onChange={(e) => setField('contactName', e.target.value)}
              placeholder="Sarah Whitlock"
              className="ip-inline"
            />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="block text-xs font-stencil uppercase tracking-widest text-steel-400 mb-1.5">
                Email
              </span>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setField('email', e.target.value)}
                placeholder="sarah@example.com"
                className="ip-inline"
              />
            </label>
            <label className="block">
              <span className="block text-xs font-stencil uppercase tracking-widest text-steel-400 mb-1.5">
                Phone
              </span>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setField('phone', e.target.value)}
                placeholder="(555) 555-0142"
                className="ip-inline"
              />
            </label>
          </div>
          <label className="block">
            <span className="block text-xs font-stencil uppercase tracking-widest text-steel-400 mb-1.5">
              Billing address
            </span>
            <input
              value={form.address}
              onChange={(e) => setField('address', e.target.value)}
              placeholder="1124 Maple Ave"
              className="ip-inline"
            />
          </label>
          <label className="block">
            <span className="block text-xs font-stencil uppercase tracking-widest text-steel-400 mb-1.5">
              Notes
            </span>
            <textarea
              rows="2"
              value={form.notes}
              onChange={(e) => setField('notes', e.target.value)}
              className="ip-inline resize-none"
            />
          </label>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-steel-700">
            <button type="button" onClick={onClose} className="ty-btn">
              Cancel
            </button>
            <button type="submit" className="ty-btn-safety">
              <Plus className="w-4 h-4" strokeWidth={3} />
              Add & select
            </button>
          </div>
        </form>

        <style>{`
          .ip-inline {
            width: 100%;
            background-color: #0d1014;
            border: 2px solid #363c44;
            color: #e4e6e9;
            padding: 0.625rem 0.75rem;
            font-size: 0.875rem;
            outline: none;
          }
          .ip-inline:focus { border-color: #FF6B1A; }
        `}</style>
      </div>
    </div>
  )
}
