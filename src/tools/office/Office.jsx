import { useState } from 'react'
import {
  Building2, Briefcase, Plus, Pencil, Trash2, X, MapPin, User, Hash, CalendarDays,
  Users, Phone, Mail,
} from 'lucide-react'
import { shops, jobs, customers, JOB_STATUSES } from '../../data/collections.js'

const TAB_SHOPS = 'shops'
const TAB_JOBS = 'jobs'
const TAB_CUSTOMERS = 'customers'

const statusMeta = (key) =>
  ({
    active: { label: 'Active', cls: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10' },
    on_hold: { label: 'On Hold', cls: 'text-caution border-caution/40 bg-caution/10' },
    complete: { label: 'Complete', cls: 'text-steel-400 border-steel-600 bg-steel-800' },
  }[key] || { label: key, cls: 'text-steel-400 border-steel-600 bg-steel-800' })

export default function Office() {
  const [tab, setTab] = useState(TAB_SHOPS)

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      {/* Page header */}
      <div className="mb-8">
        <div className="font-stencil text-xs uppercase tracking-[0.25em] text-safety mb-1">
          Tool · The Office
        </div>
        <h1 className="font-stencil text-4xl uppercase text-steel-100 mb-2">
          The Office
        </h1>
        <p className="text-steel-400 text-sm max-w-xl">
          The central directory of shops and jobs. Every other tool in the yard
          reads from here — add a job once, pick it from anywhere.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b-2 border-steel-700 mb-6 flex-wrap">
        <TabButton
          active={tab === TAB_SHOPS}
          onClick={() => setTab(TAB_SHOPS)}
          Icon={Building2}
          label="Shops"
          count={shops.useAll().length}
        />
        <TabButton
          active={tab === TAB_JOBS}
          onClick={() => setTab(TAB_JOBS)}
          Icon={Briefcase}
          label="Jobs"
          count={jobs.useAll().length}
        />
        <TabButton
          active={tab === TAB_CUSTOMERS}
          onClick={() => setTab(TAB_CUSTOMERS)}
          Icon={Users}
          label="Customers"
          count={customers.useAll().length}
        />
      </div>

      {tab === TAB_SHOPS && <ShopsPanel />}
      {tab === TAB_JOBS && <JobsPanel />}
      {tab === TAB_CUSTOMERS && <CustomersPanel />}
    </div>
  )
}

function TabButton({ active, onClick, Icon, label, count }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-3 font-stencil uppercase tracking-wider text-sm border-b-4 -mb-[2px] transition-colors ${
        active
          ? 'border-safety text-safety'
          : 'border-transparent text-steel-400 hover:text-steel-200'
      }`}
    >
      <Icon className="w-4 h-4" strokeWidth={2.5} />
      {label}
      <span
        className={`text-[10px] px-1.5 py-0.5 ${
          active ? 'bg-safety text-steel-900' : 'bg-steel-800 text-steel-400'
        }`}
      >
        {count}
      </span>
    </button>
  )
}

// ---------- Shops ----------

function ShopsPanel() {
  const allShops = shops.useAll()
  const [editing, setEditing] = useState(null)

  return (
    <>
      <div className="flex justify-end mb-4">
        <button className="ty-btn-safety" onClick={() => setEditing('new')}>
          <Plus className="w-4 h-4" strokeWidth={3} />
          Add Shop
        </button>
      </div>

      {allShops.length === 0 ? (
        <EmptyState
          Icon={Building2}
          title="No shops yet"
          body="Add your first shop or office — most outfits only need one."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allShops.map((s) => (
            <div key={s.id} className="ty-card p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="min-w-0">
                  <div className="font-stencil text-lg uppercase tracking-wide text-steel-100 truncate">
                    {s.name}
                  </div>
                  {s.address && (
                    <div className="flex items-center gap-1.5 text-sm text-steel-400 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-steel-500" />
                      <span className="truncate">{s.address}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <IconButton onClick={() => setEditing(s)} title="Edit">
                    <Pencil className="w-4 h-4" />
                  </IconButton>
                  <IconButton
                    onClick={() => {
                      if (confirm(`Delete shop "${s.name}"?`)) shops.remove(s.id)
                    }}
                    title="Delete"
                    danger
                  >
                    <Trash2 className="w-4 h-4" />
                  </IconButton>
                </div>
              </div>
              {s.notes && (
                <p className="text-xs text-steel-500 italic border-l-2 border-steel-700 pl-3">
                  {s.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {editing && (
        <ShopModal
          shop={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSave={(data) => {
            shops.upsert(editing === 'new' ? data : { ...editing, ...data })
            setEditing(null)
          }}
        />
      )}
    </>
  )
}

function ShopModal({ shop, onClose, onSave }) {
  const [form, setForm] = useState(
    shop || { name: '', address: '', notes: '' }
  )
  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const submit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    onSave(form)
  }
  return (
    <Modal title={shop ? 'Edit Shop' : 'Add Shop'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Shop name *">
          <input
            required
            autoFocus
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            placeholder="Main Shop"
            className="ty-input"
          />
        </Field>
        <Field label="Address">
          <input
            value={form.address}
            onChange={(e) => setField('address', e.target.value)}
            placeholder="123 Industrial Dr"
            className="ty-input"
          />
        </Field>
        <Field label="Notes">
          <textarea
            rows="3"
            value={form.notes}
            onChange={(e) => setField('notes', e.target.value)}
            className="ty-input resize-none"
          />
        </Field>
        <ModalFooter onClose={onClose} submitLabel={shop ? 'Save changes' : 'Add shop'} />
      </form>
    </Modal>
  )
}

// ---------- Jobs ----------

function JobsPanel() {
  const allJobs = jobs.useAll()
  const [editing, setEditing] = useState(null)
  const [filter, setFilter] = useState('all')

  const filtered =
    filter === 'all' ? allJobs : allJobs.filter((j) => j.status === filter)

  return (
    <>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div className="flex gap-2">
          <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>
            All · {allJobs.length}
          </FilterChip>
          {JOB_STATUSES.map((s) => (
            <FilterChip
              key={s.key}
              active={filter === s.key}
              onClick={() => setFilter(s.key)}
            >
              {s.label} · {allJobs.filter((j) => j.status === s.key).length}
            </FilterChip>
          ))}
        </div>
        <button className="ty-btn-safety" onClick={() => setEditing('new')}>
          <Plus className="w-4 h-4" strokeWidth={3} />
          Add Job
        </button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          Icon={Briefcase}
          title={allJobs.length === 0 ? 'No jobs yet' : 'No jobs match that filter'}
          body={
            allJobs.length === 0
              ? 'Add your first job. Other tools in the yard will be able to bill against it.'
              : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((j) => (
            <JobCard key={j.id} job={j} onEdit={() => setEditing(j)} />
          ))}
        </div>
      )}

      {editing && (
        <JobModal
          job={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSave={(data) => {
            jobs.upsert(editing === 'new' ? data : { ...editing, ...data })
            setEditing(null)
          }}
        />
      )}
    </>
  )
}

function JobCard({ job, onEdit }) {
  const meta = statusMeta(job.status)
  return (
    <div className="ty-card p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="font-stencil text-lg uppercase tracking-wide text-steel-100 truncate">
            {job.name}
          </div>
          {job.client && (
            <div className="text-xs text-safety mt-0.5">{job.client}</div>
          )}
        </div>
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-stencil uppercase tracking-widest px-2 py-1 border ${meta.cls} shrink-0`}
        >
          {meta.label}
        </span>
      </div>

      <div className="space-y-1.5 text-sm text-steel-300 mb-4">
        {job.address && (
          <div className="flex items-center gap-2 min-w-0">
            <MapPin className="w-3.5 h-3.5 text-steel-500 shrink-0" />
            <span className="truncate">{job.address}</span>
          </div>
        )}
        {job.poNumber && (
          <div className="flex items-center gap-2">
            <Hash className="w-3.5 h-3.5 text-steel-500" />
            <span className="font-mono text-xs">{job.poNumber}</span>
          </div>
        )}
        {job.startDate && (
          <div className="flex items-center gap-2">
            <CalendarDays className="w-3.5 h-3.5 text-steel-500" />
            <span>Started {job.startDate}</span>
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-steel-700 flex items-center justify-end gap-2">
        <IconButton onClick={onEdit} title="Edit">
          <Pencil className="w-4 h-4" />
        </IconButton>
        <IconButton
          onClick={() => {
            if (confirm(`Delete job "${job.name}"? (pulls and equipment tagged to it will keep a snapshot of the name.)`)) {
              jobs.remove(job.id)
            }
          }}
          title="Delete"
          danger
        >
          <Trash2 className="w-4 h-4" />
        </IconButton>
      </div>
    </div>
  )
}

function JobModal({ job, onClose, onSave }) {
  const [form, setForm] = useState(
    job || {
      name: '',
      address: '',
      client: '',
      poNumber: '',
      status: 'active',
      startDate: '',
    }
  )
  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const submit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    onSave(form)
  }
  return (
    <Modal title={job ? 'Edit Job' : 'Add Job'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Job name *">
          <input
            required
            autoFocus
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            placeholder="Maple Ave Residence"
            className="ty-input"
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Client">
            <input
              value={form.client}
              onChange={(e) => setField('client', e.target.value)}
              placeholder="The Whitlocks"
              className="ty-input"
            />
          </Field>
          <Field label="PO / Reference #">
            <input
              value={form.poNumber}
              onChange={(e) => setField('poNumber', e.target.value)}
              placeholder="PO-2026-041"
              className="ty-input"
            />
          </Field>
        </div>
        <Field label="Address">
          <input
            value={form.address}
            onChange={(e) => setField('address', e.target.value)}
            placeholder="1124 Maple Ave"
            className="ty-input"
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Status">
            <select
              value={form.status}
              onChange={(e) => setField('status', e.target.value)}
              className="ty-input"
            >
              {JOB_STATUSES.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Start date">
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => setField('startDate', e.target.value)}
              className="ty-input"
            />
          </Field>
        </div>
        <ModalFooter onClose={onClose} submitLabel={job ? 'Save changes' : 'Add job'} />
      </form>
    </Modal>
  )
}

// ---------- Customers ----------

function CustomersPanel() {
  const allCustomers = customers.useAll()
  const [editing, setEditing] = useState(null)

  return (
    <>
      <div className="flex justify-end mb-4">
        <button className="ty-btn-safety" onClick={() => setEditing('new')}>
          <Plus className="w-4 h-4" strokeWidth={3} />
          Add Customer
        </button>
      </div>

      {allCustomers.length === 0 ? (
        <EmptyState
          Icon={Users}
          title="No customers yet"
          body="Add the people and companies you bill — quotes and change orders pull from this list."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allCustomers.map((c) => (
            <div key={c.id} className="ty-card p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="min-w-0">
                  <div className="font-stencil text-lg uppercase tracking-wide text-steel-100 truncate">
                    {c.name}
                  </div>
                  {c.contactName && (
                    <div className="text-xs text-safety mt-0.5 truncate">
                      {c.contactName}
                    </div>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <IconButton onClick={() => setEditing(c)} title="Edit">
                    <Pencil className="w-4 h-4" />
                  </IconButton>
                  <IconButton
                    onClick={() => {
                      if (confirm(`Delete customer "${c.name}"? Past quotes keep their snapshot.`)) {
                        customers.remove(c.id)
                      }
                    }}
                    title="Delete"
                    danger
                  >
                    <Trash2 className="w-4 h-4" />
                  </IconButton>
                </div>
              </div>

              <div className="space-y-1.5 text-sm text-steel-300">
                {c.email && (
                  <div className="flex items-center gap-2 min-w-0">
                    <Mail className="w-3.5 h-3.5 text-steel-500 shrink-0" />
                    <a
                      href={`mailto:${c.email}`}
                      className="truncate hover:text-safety"
                    >
                      {c.email}
                    </a>
                  </div>
                )}
                {c.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-steel-500" />
                    <span>{c.phone}</span>
                  </div>
                )}
                {c.address && (
                  <div className="flex items-center gap-2 min-w-0">
                    <MapPin className="w-3.5 h-3.5 text-steel-500 shrink-0" />
                    <span className="truncate">{c.address}</span>
                  </div>
                )}
              </div>

              {c.notes && (
                <p className="text-xs text-steel-500 italic border-l-2 border-steel-700 pl-3 mt-3">
                  {c.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {editing && (
        <CustomerModal
          customer={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSave={(data) => {
            customers.upsert(editing === 'new' ? data : { ...editing, ...data })
            setEditing(null)
          }}
        />
      )}
    </>
  )
}

function CustomerModal({ customer, onClose, onSave }) {
  const [form, setForm] = useState(
    customer || {
      name: '',
      contactName: '',
      email: '',
      phone: '',
      address: '',
      notes: '',
    }
  )
  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const submit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    onSave(form)
  }
  return (
    <Modal title={customer ? 'Edit Customer' : 'Add Customer'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Customer name *">
          <input
            required
            autoFocus
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            placeholder="The Whitlocks"
            className="ty-input"
          />
        </Field>
        <Field label="Contact person">
          <input
            value={form.contactName}
            onChange={(e) => setField('contactName', e.target.value)}
            placeholder="Sarah Whitlock"
            className="ty-input"
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Email">
            <input
              type="email"
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
              placeholder="sarah@example.com"
              className="ty-input"
            />
          </Field>
          <Field label="Phone">
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setField('phone', e.target.value)}
              placeholder="(555) 555-0142"
              className="ty-input"
            />
          </Field>
        </div>
        <Field label="Billing address">
          <input
            value={form.address}
            onChange={(e) => setField('address', e.target.value)}
            placeholder="1124 Maple Ave"
            className="ty-input"
          />
        </Field>
        <Field label="Notes">
          <textarea
            rows="3"
            value={form.notes}
            onChange={(e) => setField('notes', e.target.value)}
            className="ty-input resize-none"
          />
        </Field>
        <ModalFooter
          onClose={onClose}
          submitLabel={customer ? 'Save changes' : 'Add customer'}
        />
      </form>
    </Modal>
  )
}

// ---------- Shared primitives ----------

function Modal({ title, onClose, children }) {
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
            {title}
          </h3>
          <button onClick={onClose} className="p-1 text-steel-400 hover:text-steel-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
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
          .ty-input:focus { border-color: #FF6B1A; }
        `}</style>
      </div>
    </div>
  )
}

function ModalFooter({ onClose, submitLabel }) {
  return (
    <div className="flex items-center justify-end gap-3 pt-4 border-t border-steel-700">
      <button type="button" onClick={onClose} className="ty-btn">
        Cancel
      </button>
      <button type="submit" className="ty-btn-safety">
        {submitLabel}
      </button>
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

function FilterChip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-3 py-1.5 font-stencil text-[10px] uppercase tracking-widest border-2 transition-colors ${
        active
          ? 'bg-safety border-safety text-steel-900'
          : 'bg-steel-800 border-steel-700 text-steel-300 hover:border-safety hover:text-safety'
      }`}
    >
      {children}
    </button>
  )
}

function IconButton({ onClick, title, danger, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-2 text-steel-400 hover:bg-steel-900 border border-steel-700 transition-colors ${
        danger ? 'hover:text-red-400' : 'hover:text-safety'
      }`}
    >
      {children}
    </button>
  )
}

function EmptyState({ Icon, title, body }) {
  return (
    <div className="ty-card p-12 text-center">
      <Icon className="w-10 h-10 text-steel-600 mx-auto mb-3" />
      <p className="font-stencil text-lg uppercase text-steel-300 mb-1">{title}</p>
      {body && <p className="text-steel-400 text-sm max-w-md mx-auto">{body}</p>}
    </div>
  )
}
