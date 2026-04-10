import { useEffect, useMemo, useState } from 'react'
import {
  Plus, Search, Pencil, Trash2, X, MapPin, User, Wrench,
  CheckCircle2, AlertTriangle, Clock, Ban
} from 'lucide-react'

const STORAGE_KEY = 'toolyard.equiptrack.v1'

const STATUSES = [
  { key: 'available',  label: 'Available',    Icon: CheckCircle2, cls: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10' },
  { key: 'in_use',     label: 'In Use',       Icon: Clock,        cls: 'text-sky-400 border-sky-500/40 bg-sky-500/10' },
  { key: 'maintenance',label: 'Maintenance',  Icon: Wrench,       cls: 'text-caution border-caution/40 bg-caution/10' },
  { key: 'down',       label: 'Out of Service', Icon: Ban,        cls: 'text-red-400 border-red-500/40 bg-red-500/10' },
]

const statusMeta = (k) => STATUSES.find((s) => s.key === k) || STATUSES[0]

const TYPES = [
  'Excavator', 'Skid Steer', 'Loader', 'Dozer', 'Dump Truck',
  'Crane', 'Forklift', 'Compactor', 'Generator', 'Light Tower', 'Other',
]

const SEED = [
  {
    id: crypto.randomUUID(),
    name: 'CAT 320 — #A12',
    type: 'Excavator',
    status: 'in_use',
    location: 'Maple Ave Jobsite',
    operator: 'Luis R.',
    lastService: '2026-03-14',
    notes: 'Hydraulic hose replaced. Monitor for leaks.',
  },
  {
    id: crypto.randomUUID(),
    name: 'Bobcat S650 — #B04',
    type: 'Skid Steer',
    status: 'available',
    location: 'Yard',
    operator: '',
    lastService: '2026-02-20',
    notes: '',
  },
  {
    id: crypto.randomUUID(),
    name: 'Genie GS-1930',
    type: 'Other',
    status: 'maintenance',
    location: 'Shop',
    operator: '',
    lastService: '2026-04-02',
    notes: 'Battery replacement scheduled this week.',
  },
]

function loadItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return SEED
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : SEED
  } catch {
    return SEED
  }
}

export default function EquipTrack() {
  const [items, setItems] = useState(loadItems)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [editing, setEditing] = useState(null) // equipment object or 'new' or null

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const filtered = useMemo(() => {
    return items.filter((it) => {
      if (filter !== 'all' && it.status !== filter) return false
      if (!query) return true
      const q = query.toLowerCase()
      return (
        it.name.toLowerCase().includes(q) ||
        it.type.toLowerCase().includes(q) ||
        (it.location || '').toLowerCase().includes(q) ||
        (it.operator || '').toLowerCase().includes(q)
      )
    })
  }, [items, query, filter])

  const counts = useMemo(() => {
    const base = { all: items.length }
    for (const s of STATUSES) base[s.key] = 0
    for (const it of items) base[it.status] = (base[it.status] || 0) + 1
    return base
  }, [items])

  const handleSave = (equipment) => {
    if (equipment.id && items.some((it) => it.id === equipment.id)) {
      setItems((prev) => prev.map((it) => (it.id === equipment.id ? equipment : it)))
    } else {
      setItems((prev) => [{ ...equipment, id: crypto.randomUUID() }, ...prev])
    }
    setEditing(null)
  }

  const handleDelete = (id) => {
    if (!confirm('Delete this piece of equipment?')) return
    setItems((prev) => prev.filter((it) => it.id !== id))
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* Page header */}
      <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="font-stencil text-xs uppercase tracking-[0.25em] text-safety mb-1">
            Tool · EquipTrack
          </div>
          <h1 className="font-stencil text-4xl uppercase text-steel-100 mb-2">
            Equipment Tracker
          </h1>
          <p className="text-steel-400 text-sm max-w-xl">
            Every machine in your fleet — status, location, operator, and
            service history. Changes are saved to this browser automatically.
          </p>
        </div>
        <button className="ty-btn-safety" onClick={() => setEditing('new')}>
          <Plus className="w-4 h-4" strokeWidth={3} />
          Add Equipment
        </button>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        <FilterChip
          active={filter === 'all'}
          onClick={() => setFilter('all')}
          label="All"
          count={counts.all}
        />
        {STATUSES.map((s) => (
          <FilterChip
            key={s.key}
            active={filter === s.key}
            onClick={() => setFilter(s.key)}
            label={s.label}
            count={counts[s.key] || 0}
            Icon={s.Icon}
          />
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-steel-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, type, location, operator…"
          className="w-full pl-10 pr-4 py-3 bg-steel-800 border-2 border-steel-700 text-steel-100 placeholder-steel-500 focus:outline-none focus:border-safety"
        />
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="ty-card p-12 text-center">
          <AlertTriangle className="w-10 h-10 text-steel-600 mx-auto mb-3" />
          <p className="text-steel-400">
            {items.length === 0
              ? "No equipment yet. Click \"Add Equipment\" to put something in the yard."
              : 'No equipment matches your search or filter.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((it) => (
            <EquipmentRow
              key={it.id}
              item={it}
              onEdit={() => setEditing(it)}
              onDelete={() => handleDelete(it.id)}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {editing && (
        <EditorModal
          equipment={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}

function FilterChip({ active, onClick, label, count, Icon }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-3 py-2 font-stencil text-xs uppercase tracking-wider border-2 transition-colors ${
        active
          ? 'bg-safety border-safety text-steel-900'
          : 'bg-steel-800 border-steel-700 text-steel-300 hover:border-safety hover:text-safety'
      }`}
    >
      {Icon && <Icon className="w-3.5 h-3.5" strokeWidth={2.5} />}
      {label}
      <span
        className={`text-[10px] px-1.5 py-0.5 ${
          active ? 'bg-steel-900 text-safety' : 'bg-steel-900 text-steel-400'
        }`}
      >
        {count}
      </span>
    </button>
  )
}

function EquipmentRow({ item, onEdit, onDelete }) {
  const meta = statusMeta(item.status)
  const Icon = meta.Icon
  return (
    <div className="ty-card p-5">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="min-w-0">
          <div className="font-stencil text-lg uppercase tracking-wide text-steel-100 truncate">
            {item.name}
          </div>
          <div className="text-xs text-steel-500 uppercase tracking-wider">
            {item.type}
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-stencil uppercase tracking-widest px-2 py-1 border ${meta.cls}`}
        >
          <Icon className="w-3 h-3" strokeWidth={2.5} />
          {meta.label}
        </span>
      </div>

      <div className="space-y-1.5 text-sm text-steel-300">
        {item.location && (
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-steel-500" />
            <span className="truncate">{item.location}</span>
          </div>
        )}
        {item.operator && (
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-steel-500" />
            <span className="truncate">{item.operator}</span>
          </div>
        )}
        {item.lastService && (
          <div className="flex items-center gap-2">
            <Wrench className="w-3.5 h-3.5 text-steel-500" />
            <span>Last service {item.lastService}</span>
          </div>
        )}
      </div>

      {item.notes && (
        <p className="text-xs text-steel-500 mt-3 italic border-l-2 border-steel-700 pl-3">
          {item.notes}
        </p>
      )}

      <div className="mt-4 pt-4 border-t border-steel-700 flex items-center justify-end gap-2">
        <button
          onClick={onEdit}
          className="p-2 text-steel-400 hover:text-safety hover:bg-steel-900 transition-colors border border-steel-700"
          title="Edit"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-2 text-steel-400 hover:text-red-400 hover:bg-steel-900 transition-colors border border-steel-700"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

function EditorModal({ equipment, onClose, onSave }) {
  const [form, setForm] = useState(
    equipment || {
      name: '',
      type: 'Excavator',
      status: 'available',
      location: '',
      operator: '',
      lastService: '',
      notes: '',
    }
  )

  const setField = (k, v) => setForm((prev) => ({ ...prev, [k]: v }))

  const submit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    onSave(form)
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
            {equipment ? 'Edit Equipment' : 'Add Equipment'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-steel-400 hover:text-steel-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          <Field label="Name / ID *">
            <input
              required
              autoFocus
              type="text"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              placeholder="CAT 320 — #A12"
              className="ty-input"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Type">
              <select
                value={form.type}
                onChange={(e) => setField('type', e.target.value)}
                className="ty-input"
              >
                {TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select
                value={form.status}
                onChange={(e) => setField('status', e.target.value)}
                className="ty-input"
              >
                {STATUSES.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Location">
              <input
                type="text"
                value={form.location}
                onChange={(e) => setField('location', e.target.value)}
                placeholder="Maple Ave Jobsite"
                className="ty-input"
              />
            </Field>
            <Field label="Operator">
              <input
                type="text"
                value={form.operator}
                onChange={(e) => setField('operator', e.target.value)}
                placeholder="Luis R."
                className="ty-input"
              />
            </Field>
          </div>

          <Field label="Last Service">
            <input
              type="date"
              value={form.lastService}
              onChange={(e) => setField('lastService', e.target.value)}
              className="ty-input"
            />
          </Field>

          <Field label="Notes">
            <textarea
              rows="3"
              value={form.notes}
              onChange={(e) => setField('notes', e.target.value)}
              placeholder="Anything the next operator should know…"
              className="ty-input resize-none"
            />
          </Field>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-steel-700">
            <button type="button" onClick={onClose} className="ty-btn">
              Cancel
            </button>
            <button type="submit" className="ty-btn-safety">
              {equipment ? 'Save changes' : 'Add to yard'}
            </button>
          </div>
        </form>

        <style>{`
          .ty-input {
            width: 100%;
            background-color: #0d1014;
            border: 2px solid #363c44;
            color: #e4e6e9;
            padding: 0.625rem 0.75rem;
            font-size: 0.875rem;
            outline: none;
          }
          .ty-input:focus {
            border-color: #FF6B1A;
          }
        `}</style>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-stencil uppercase tracking-widest text-steel-400 mb-1.5">
        {label}
      </span>
      {children}
    </label>
  )
}
