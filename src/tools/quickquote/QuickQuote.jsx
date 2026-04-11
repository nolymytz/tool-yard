import { useMemo, useState } from 'react'
import {
  FileText, Plus, Pencil, Trash2, X, Search, Send, Printer,
  Mail, Copy, ArrowLeft, Package, Calculator, ListChecks,
  DollarSign, CalendarDays, User, Briefcase, AlertTriangle, CheckCircle2,
} from 'lucide-react'
import {
  quotes,
  customers,
  services as servicesCollection,
  jobs,
  SERVICE_UNITS,
  QUOTE_STATUSES,
} from '../../data/collections.js'
import CustomerPicker, { CustomerLabel } from '../../components/CustomerPicker.jsx'
import JobPicker, { JobLabel } from '../../components/JobPicker.jsx'
import {
  money,
  todayIso,
  addDaysIso,
  lineTotal,
  computeTotals,
  nextDocNumber,
  blankLineItem,
  printNow,
  buildMailtoUrl,
} from './quoteUtils.js'

const TAB_QUOTES = 'quotes'
const TAB_SERVICES = 'services'

const statusMeta = (key) =>
  ({
    draft:    { label: 'Draft',    cls: 'text-steel-400 border-steel-600 bg-steel-800' },
    sent:     { label: 'Sent',     cls: 'text-sky-400 border-sky-500/40 bg-sky-500/10' },
    accepted: { label: 'Accepted', cls: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10' },
    declined: { label: 'Declined', cls: 'text-red-400 border-red-500/40 bg-red-500/10' },
  }[key] || { label: key, cls: 'text-steel-400 border-steel-600 bg-steel-800' })

export default function QuickQuote() {
  const [tab, setTab] = useState(TAB_QUOTES)
  const [editing, setEditing] = useState(null) // quote object, 'new', or null
  const [printing, setPrinting] = useState(null) // quote object or null

  // IMPORTANT: call all hooks unconditionally at the top of the component,
  // before any early return. Calling useAll() inline inside JSX that only
  // renders on some branches violates the Rules of Hooks.
  const quotesCount = quotes.useAll().length
  const servicesCount = servicesCollection.useAll().length

  if (editing) {
    return (
      <QuoteEditor
        quote={editing === 'new' ? null : editing}
        onClose={() => setEditing(null)}
        onPreview={(q) => {
          setEditing(null)
          setPrinting(q)
        }}
      />
    )
  }

  if (printing) {
    return <QuotePrintView quote={printing} onClose={() => setPrinting(null)} />
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* Page header */}
      <div className="mb-8">
        <div className="font-stencil text-xs uppercase tracking-[0.25em] text-safety mb-1">
          Tool · QuickQuote
        </div>
        <h1 className="font-stencil text-4xl uppercase text-steel-100 mb-2">
          QuickQuote
        </h1>
        <p className="text-steel-400 text-sm max-w-xl">
          Simple quotes for small projects. Pick a customer, drop in services
          from the catalog or type them free-form, and print or email the
          finished quote.
        </p>
      </div>

      <div className="flex border-b-2 border-steel-700 mb-6 flex-wrap">
        <TabButton
          active={tab === TAB_QUOTES}
          onClick={() => setTab(TAB_QUOTES)}
          Icon={FileText}
          label="Quotes"
          count={quotesCount}
        />
        <TabButton
          active={tab === TAB_SERVICES}
          onClick={() => setTab(TAB_SERVICES)}
          Icon={Package}
          label="Service Catalog"
          count={servicesCount}
        />
      </div>

      {tab === TAB_QUOTES && (
        <QuotesPanel
          onNew={() => setEditing('new')}
          onEdit={(q) => setEditing(q)}
          onPreview={(q) => setPrinting(q)}
        />
      )}
      {tab === TAB_SERVICES && <ServicesPanel />}
    </div>
  )
}

// ---------- Quotes list ----------

function QuotesPanel({ onNew, onEdit, onPreview }) {
  const all = quotes.useAll()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')

  const filtered = useMemo(() => {
    return all.filter((q) => {
      if (filter !== 'all' && q.status !== filter) return false
      if (!query) return true
      const needle = query.toLowerCase()
      return (
        (q.number || '').toLowerCase().includes(needle) ||
        (q.customerName || '').toLowerCase().includes(needle) ||
        (q.jobName || '').toLowerCase().includes(needle) ||
        (q.projectTitle || '').toLowerCase().includes(needle)
      )
    })
  }, [all, query, filter])

  const sorted = [...filtered].sort(
    (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
  )

  return (
    <>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div className="flex gap-2 flex-wrap">
          <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>
            All · {all.length}
          </FilterChip>
          {QUOTE_STATUSES.map((s) => (
            <FilterChip
              key={s.key}
              active={filter === s.key}
              onClick={() => setFilter(s.key)}
            >
              {s.label} · {all.filter((q) => q.status === s.key).length}
            </FilterChip>
          ))}
        </div>
        <button className="ty-btn-safety" onClick={onNew}>
          <Plus className="w-4 h-4" strokeWidth={3} />
          New Quote
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-steel-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by number, customer, job, or project title…"
          className="w-full pl-10 pr-4 py-3 bg-steel-800 border-2 border-steel-700 text-steel-100 placeholder-steel-500 focus:outline-none focus:border-safety"
        />
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          Icon={FileText}
          title={all.length === 0 ? 'No quotes yet' : 'No quotes match that filter'}
          body={
            all.length === 0
              ? 'Click "New Quote" to build your first one.'
              : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sorted.map((q) => (
            <QuoteCard
              key={q.id}
              quote={q}
              onEdit={() => onEdit(q)}
              onPreview={() => onPreview(q)}
              onDelete={() => {
                if (confirm(`Delete quote ${q.number}?`)) quotes.remove(q.id)
              }}
              onDuplicate={() => {
                const copy = {
                  ...q,
                  id: undefined,
                  createdAt: undefined,
                  number: nextDocNumber('Q', quotes.getAll()),
                  status: 'draft',
                  issueDate: todayIso(),
                  expiresDate: addDaysIso(todayIso(), 30),
                }
                delete copy.id
                delete copy.createdAt
                quotes.add(copy)
              }}
            />
          ))}
        </div>
      )}
    </>
  )
}

function QuoteCard({ quote, onEdit, onPreview, onDelete, onDuplicate }) {
  const meta = statusMeta(quote.status)
  const { total } = computeTotals(quote.lineItems || [], quote.taxRate)
  return (
    <div className="ty-card p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="font-mono text-xs text-steel-500 mb-1">{quote.number}</div>
          <div className="font-stencil text-lg uppercase tracking-wide text-steel-100 truncate">
            {quote.projectTitle || 'Untitled project'}
          </div>
          <div className="text-xs text-safety mt-0.5 truncate">
            {quote.customerName || '— No customer —'}
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-stencil uppercase tracking-widest px-2 py-1 border ${meta.cls} shrink-0`}
        >
          {meta.label}
        </span>
      </div>

      <div className="space-y-1 text-xs text-steel-400 mb-4">
        {quote.jobName && (
          <div className="flex items-center gap-2 truncate">
            <Briefcase className="w-3 h-3 text-steel-500 shrink-0" />
            <span className="truncate">{quote.jobName}</span>
          </div>
        )}
        {quote.issueDate && (
          <div className="flex items-center gap-2">
            <CalendarDays className="w-3 h-3 text-steel-500" />
            <span>
              Issued {quote.issueDate}
              {quote.expiresDate ? ` · valid to ${quote.expiresDate}` : ''}
            </span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <ListChecks className="w-3 h-3 text-steel-500" />
          <span>
            {(quote.lineItems || []).length} line item
            {(quote.lineItems || []).length === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      <div className="flex items-baseline justify-between pt-4 border-t border-steel-700">
        <span className="text-[10px] font-stencil uppercase tracking-widest text-steel-500">
          Total
        </span>
        <span className="font-stencil text-2xl text-safety">{money(total)}</span>
      </div>

      <div className="mt-4 pt-4 border-t border-steel-700 flex items-center justify-end gap-2">
        <IconButton onClick={onPreview} title="Preview / print">
          <Printer className="w-4 h-4" />
        </IconButton>
        <IconButton onClick={onDuplicate} title="Duplicate">
          <Copy className="w-4 h-4" />
        </IconButton>
        <IconButton onClick={onEdit} title="Edit">
          <Pencil className="w-4 h-4" />
        </IconButton>
        <IconButton onClick={onDelete} title="Delete" danger>
          <Trash2 className="w-4 h-4" />
        </IconButton>
      </div>
    </div>
  )
}

// ---------- Quote editor ----------

function QuoteEditor({ quote, onClose, onPreview }) {
  const allCustomers = customers.useAll()
  const allServices = servicesCollection.useAll()

  const [form, setForm] = useState(() => {
    if (quote) return { ...quote, lineItems: quote.lineItems || [] }
    const today = todayIso()
    return {
      number: nextDocNumber('Q', quotes.getAll()),
      status: 'draft',
      customerId: '',
      customerName: '',
      jobId: '',
      jobName: '',
      projectTitle: '',
      issueDate: today,
      expiresDate: addDaysIso(today, 30),
      lineItems: [blankLineItem()],
      taxRate: 0,
      notes: '',
      terms:
        '50% deposit due on acceptance, balance due on completion. This quote is valid for 30 days from the issue date.',
    }
  })

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const totals = computeTotals(form.lineItems, form.taxRate)

  const updateLine = (id, patch) => {
    setForm((f) => ({
      ...f,
      lineItems: f.lineItems.map((li) => (li.id === id ? { ...li, ...patch } : li)),
    }))
  }

  const addBlankLine = () => {
    setForm((f) => ({ ...f, lineItems: [...f.lineItems, blankLineItem()] }))
  }

  const addServiceLine = (serviceId) => {
    const svc = allServices.find((s) => s.id === serviceId)
    if (!svc) return
    setForm((f) => ({
      ...f,
      lineItems: [
        ...f.lineItems,
        {
          ...blankLineItem(),
          description: svc.description
            ? `${svc.name} — ${svc.description}`
            : svc.name,
          unit: svc.unit,
          rate: Number(svc.rate) || 0,
          quantity: 1,
        },
      ],
    }))
  }

  const removeLine = (id) => {
    setForm((f) => ({ ...f, lineItems: f.lineItems.filter((li) => li.id !== id) }))
  }

  const save = (alsoPreview = false) => {
    // Snapshot customer and job names at save time so later renames don't
    // silently edit historical quotes.
    const customer = allCustomers.find((c) => c.id === form.customerId)
    const job = jobs.getAll().find((j) => j.id === form.jobId)

    const cleaned = {
      ...form,
      customerName: customer ? customer.name : form.customerName || '',
      customerEmail: customer ? customer.email : form.customerEmail || '',
      customerAddress: customer ? customer.address : form.customerAddress || '',
      customerContact: customer ? customer.contactName : form.customerContact || '',
      jobName: job ? job.name : '',
      taxRate: Number(form.taxRate) || 0,
      lineItems: form.lineItems.map((li) => ({
        ...li,
        quantity: Number(li.quantity) || 0,
        rate: Number(li.rate) || 0,
      })),
    }

    const saved = quotes.upsert(quote ? { ...quote, ...cleaned } : cleaned)
    if (alsoPreview) onPreview(saved)
    else onClose()
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <button
        onClick={onClose}
        className="inline-flex items-center gap-2 text-xs font-stencil uppercase tracking-widest text-steel-400 hover:text-safety mb-4"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to quotes
      </button>

      <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="font-mono text-xs text-steel-500 mb-1">{form.number}</div>
          <h1 className="font-stencil text-3xl uppercase text-steel-100">
            {quote ? 'Edit Quote' : 'New Quote'}
          </h1>
        </div>
        <div className="flex gap-2 items-center">
          <select
            value={form.status}
            onChange={(e) => setField('status', e.target.value)}
            className="ty-input-sm"
          >
            {QUOTE_STATUSES.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Header fields */}
      <div className="ty-card p-6 mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Customer *">
            <CustomerPicker
              value={form.customerId}
              onChange={(id) => setField('customerId', id)}
              allowAdd
            />
          </Field>
          <Field label="Link to job (optional)">
            <JobPicker
              value={form.jobId}
              onChange={(id) => setField('jobId', id)}
              noneLabel="— Not linked to a job —"
            />
          </Field>
        </div>
        <Field label="Project title *">
          <input
            value={form.projectTitle}
            onChange={(e) => setField('projectTitle', e.target.value)}
            placeholder="Kitchen remodel, garage demo, etc."
            className="ty-input"
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Issue date">
            <input
              type="date"
              value={form.issueDate}
              onChange={(e) => setField('issueDate', e.target.value)}
              className="ty-input"
            />
          </Field>
          <Field label="Valid through">
            <input
              type="date"
              value={form.expiresDate}
              onChange={(e) => setField('expiresDate', e.target.value)}
              className="ty-input"
            />
          </Field>
        </div>
      </div>

      {/* Line items */}
      <div className="ty-card p-6 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <h2 className="font-stencil text-lg uppercase tracking-wide text-steel-100">
            Line Items
          </h2>
          <div className="flex gap-2 items-center flex-wrap">
            {allServices.length > 0 && (
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) addServiceLine(e.target.value)
                }}
                className="ty-input-sm"
              >
                <option value="">+ Add from catalog</option>
                {allServices.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — {money(s.rate)}/{s.unit}
                  </option>
                ))}
              </select>
            )}
            <button className="ty-btn" onClick={addBlankLine} type="button">
              <Plus className="w-3.5 h-3.5" strokeWidth={3} />
              Manual line
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {form.lineItems.length === 0 ? (
            <p className="text-sm text-steel-500 italic py-6 text-center">
              No line items yet. Add one from the catalog or type your own.
            </p>
          ) : (
            form.lineItems.map((li) => (
              <LineItemRow
                key={li.id}
                item={li}
                onChange={(patch) => updateLine(li.id, patch)}
                onRemove={() => removeLine(li.id)}
              />
            ))
          )}
        </div>

        {/* Totals */}
        <div className="mt-6 pt-6 border-t-2 border-steel-700">
          <div className="ml-auto max-w-xs space-y-2 text-sm">
            <div className="flex items-baseline justify-between text-steel-300">
              <span>Subtotal</span>
              <span className="font-stencil text-lg text-steel-100">
                {money(totals.subtotal)}
              </span>
            </div>
            <div className="flex items-baseline justify-between text-steel-300 gap-3">
              <span className="flex items-center gap-2">
                Tax
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.taxRate}
                  onChange={(e) => setField('taxRate', e.target.value)}
                  className="w-16 bg-steel-900 border border-steel-700 text-steel-100 px-2 py-1 text-xs text-right focus:outline-none focus:border-safety"
                />
                <span className="text-xs text-steel-500">%</span>
              </span>
              <span className="font-stencil text-lg text-steel-100">
                {money(totals.tax)}
              </span>
            </div>
            <div className="flex items-baseline justify-between pt-2 border-t border-steel-700">
              <span className="font-stencil uppercase tracking-widest text-xs text-steel-400">
                Total
              </span>
              <span className="font-stencil text-3xl text-safety">
                {money(totals.total)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes + terms */}
      <div className="ty-card p-6 mb-6 space-y-4">
        <Field label="Internal notes (not printed)">
          <textarea
            rows="2"
            value={form.notes}
            onChange={(e) => setField('notes', e.target.value)}
            className="ty-input resize-none"
            placeholder="Private notes for your team…"
          />
        </Field>
        <Field label="Terms & conditions (shown on printed quote)">
          <textarea
            rows="4"
            value={form.terms}
            onChange={(e) => setField('terms', e.target.value)}
            className="ty-input resize-none"
          />
        </Field>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-steel-700">
        <button type="button" onClick={onClose} className="ty-btn">
          Cancel
        </button>
        <button type="button" onClick={() => save(false)} className="ty-btn">
          Save draft
        </button>
        <button
          type="button"
          onClick={() => save(true)}
          className="ty-btn-safety"
          disabled={!form.customerId || !form.projectTitle.trim()}
        >
          <Printer className="w-4 h-4" strokeWidth={3} />
          Save & preview
        </button>
      </div>

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
        .ty-input-sm {
          background-color: #0d1014;
          border: 2px solid #363c44;
          color: #e4e6e9;
          padding: 0.4rem 0.6rem;
          font-size: 0.75rem;
          outline: none;
        }
        .ty-input-sm:focus { border-color: #FF6B1A; }
      `}</style>
    </div>
  )
}

function LineItemRow({ item, onChange, onRemove }) {
  const total = lineTotal(item)
  return (
    <div className="grid grid-cols-12 gap-2 items-start bg-steel-900/60 border border-steel-700 p-3">
      <div className="col-span-12 md:col-span-5">
        <textarea
          rows="2"
          value={item.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Description…"
          className="ty-input resize-none"
        />
      </div>
      <div className="col-span-4 md:col-span-2">
        <input
          type="number"
          min="0"
          step="any"
          value={item.quantity}
          onChange={(e) => onChange({ quantity: e.target.value })}
          placeholder="Qty"
          className="ty-input text-right"
        />
      </div>
      <div className="col-span-4 md:col-span-2">
        <select
          value={item.unit}
          onChange={(e) => onChange({ unit: e.target.value })}
          className="ty-input"
        >
          {SERVICE_UNITS.map((u) => (
            <option key={u}>{u}</option>
          ))}
        </select>
      </div>
      <div className="col-span-4 md:col-span-2">
        <input
          type="number"
          min="0"
          step="0.01"
          value={item.rate}
          onChange={(e) => onChange({ rate: e.target.value })}
          placeholder="Rate"
          className="ty-input text-right"
        />
      </div>
      <div className="col-span-10 md:col-span-1 flex items-center justify-end font-stencil text-sm text-steel-100 pt-2">
        {money(total)}
      </div>
      <div className="col-span-2 md:col-span-12 md:hidden flex justify-end">
        <button
          type="button"
          onClick={onRemove}
          className="text-steel-500 hover:text-red-400 p-1"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <div className="hidden md:flex md:col-span-12 justify-end -mt-2">
        <button
          type="button"
          onClick={onRemove}
          className="text-xs text-steel-500 hover:text-red-400 flex items-center gap-1"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Remove line
        </button>
      </div>
    </div>
  )
}

// ---------- Print view ----------

function QuotePrintView({ quote, onClose }) {
  const customer = customers.useOne(quote.customerId)
  const totals = computeTotals(quote.lineItems || [], quote.taxRate)

  const customerEmail = customer?.email || quote.customerEmail || ''
  const mailto = buildMailtoUrl({
    to: customerEmail,
    subject: `Quote ${quote.number} — ${quote.projectTitle || 'Project'}`,
    body: `Hi ${customer?.contactName || customer?.name || 'there'},

Please find our quote ${quote.number} for ${quote.projectTitle || 'your project'}.

  Total: ${money(totals.total)}
  Valid through: ${quote.expiresDate || '—'}

Tip: use the "Save as PDF" button in the app to download a PDF, then attach it to this email.

Thanks!
`,
  })

  return (
    <div className="ty-print-overlay">
      {/* Toolbar (hidden when printing) */}
      <div className="ty-print-hide bg-steel-900 border-b-2 border-steel-700 px-6 py-3 flex items-center justify-between flex-wrap gap-3">
        <button
          onClick={onClose}
          className="inline-flex items-center gap-2 text-xs font-stencil uppercase tracking-widest text-steel-300 hover:text-safety"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to quotes
        </button>
        <div className="flex gap-2 flex-wrap">
          {customerEmail && (
            <a href={mailto} className="ty-btn">
              <Mail className="w-4 h-4" />
              Email quote
            </a>
          )}
          <button onClick={printNow} className="ty-btn-safety">
            <Printer className="w-4 h-4" strokeWidth={3} />
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* The printable document */}
      <div className="ty-print-root">
        <div className="ty-print-page">
          {/* Header */}
          <div className="flex items-start justify-between gap-8 mb-8 pb-6 border-b-4 border-black">
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-gray-500">
                Tool Yard
              </div>
              <div className="text-3xl font-bold mt-1">QUOTE</div>
              <div className="text-sm text-gray-600 mt-1">
                Your construction toolbox
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-widest text-gray-500">
                Quote #
              </div>
              <div className="text-xl font-mono font-bold">{quote.number}</div>
              <div className="text-xs text-gray-600 mt-2">
                Issued: <strong>{quote.issueDate || '—'}</strong>
              </div>
              <div className="text-xs text-gray-600">
                Valid through: <strong>{quote.expiresDate || '—'}</strong>
              </div>
            </div>
          </div>

          {/* Customer + project */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <div className="text-xs uppercase tracking-widest text-gray-500 mb-1">
                Bill to
              </div>
              <div className="font-bold text-lg">
                {customer?.name || quote.customerName || '—'}
              </div>
              {(customer?.contactName || quote.customerContact) && (
                <div className="text-sm">
                  {customer?.contactName || quote.customerContact}
                </div>
              )}
              {(customer?.address || quote.customerAddress) && (
                <div className="text-sm text-gray-700">
                  {customer?.address || quote.customerAddress}
                </div>
              )}
              {(customer?.email || quote.customerEmail) && (
                <div className="text-sm text-gray-700">
                  {customer?.email || quote.customerEmail}
                </div>
              )}
              {customer?.phone && (
                <div className="text-sm text-gray-700">{customer.phone}</div>
              )}
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-gray-500 mb-1">
                Project
              </div>
              <div className="font-bold text-lg">
                {quote.projectTitle || '—'}
              </div>
              {quote.jobName && (
                <div className="text-sm text-gray-700">Job: {quote.jobName}</div>
              )}
            </div>
          </div>

          {/* Line items table */}
          <table className="w-full border-collapse mb-6">
            <thead>
              <tr className="border-b-2 border-black">
                <th className="text-left py-2 pr-2 text-xs uppercase tracking-widest text-gray-700">
                  Description
                </th>
                <th className="text-right py-2 px-2 text-xs uppercase tracking-widest text-gray-700 w-20">
                  Qty
                </th>
                <th className="text-left py-2 px-2 text-xs uppercase tracking-widest text-gray-700 w-24">
                  Unit
                </th>
                <th className="text-right py-2 px-2 text-xs uppercase tracking-widest text-gray-700 w-28">
                  Rate
                </th>
                <th className="text-right py-2 pl-2 text-xs uppercase tracking-widest text-gray-700 w-28">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {(quote.lineItems || []).map((li) => (
                <tr key={li.id} className="border-b border-gray-300 align-top">
                  <td className="py-2 pr-2 text-sm whitespace-pre-wrap">
                    {li.description || <em className="text-gray-400">—</em>}
                  </td>
                  <td className="py-2 px-2 text-sm text-right">{li.quantity}</td>
                  <td className="py-2 px-2 text-sm">{li.unit}</td>
                  <td className="py-2 px-2 text-sm text-right">
                    {money(li.rate)}
                  </td>
                  <td className="py-2 pl-2 text-sm text-right font-semibold">
                    {money(lineTotal(li))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-72 text-sm">
              <div className="flex justify-between py-1">
                <span className="text-gray-600">Subtotal</span>
                <span>{money(totals.subtotal)}</span>
              </div>
              {Number(quote.taxRate) > 0 && (
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">
                    Tax ({Number(quote.taxRate)}%)
                  </span>
                  <span>{money(totals.tax)}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-t-2 border-black mt-1 text-xl font-bold">
                <span>Total</span>
                <span>{money(totals.total)}</span>
              </div>
            </div>
          </div>

          {/* Terms */}
          {quote.terms && (
            <div className="border-t border-gray-300 pt-4">
              <div className="text-xs uppercase tracking-widest text-gray-500 mb-2">
                Terms & conditions
              </div>
              <p className="text-xs text-gray-700 whitespace-pre-wrap">
                {quote.terms}
              </p>
            </div>
          )}

          {/* Signature */}
          <div className="grid grid-cols-2 gap-8 mt-10 pt-4">
            <div>
              <div className="border-b border-black pb-1 h-12" />
              <div className="text-xs text-gray-500 mt-1">
                Accepted by (customer)
              </div>
            </div>
            <div>
              <div className="border-b border-black pb-1 h-12" />
              <div className="text-xs text-gray-500 mt-1">Date</div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .ty-print-overlay {
          position: fixed;
          inset: 0;
          z-index: 40;
          background: #e5e7eb;
          overflow: auto;
        }
        .ty-print-root {
          display: flex;
          justify-content: center;
          padding: 2rem 1rem 4rem;
        }
        .ty-print-page {
          background: white;
          color: #111;
          width: 100%;
          max-width: 8.5in;
          min-height: 11in;
          padding: 0.75in;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
          font-family: ui-sans-serif, system-ui, sans-serif;
        }
        @media print {
          @page { size: letter; margin: 0.5in; }
          body * { visibility: hidden !important; }
          .ty-print-root, .ty-print-root * { visibility: visible !important; }
          .ty-print-overlay {
            position: static !important;
            background: white !important;
            overflow: visible !important;
          }
          .ty-print-root {
            padding: 0 !important;
            display: block !important;
          }
          .ty-print-page {
            box-shadow: none !important;
            max-width: none !important;
            width: 100% !important;
            padding: 0 !important;
            min-height: 0 !important;
          }
          .ty-print-hide { display: none !important; }
        }
      `}</style>
    </div>
  )
}

// ---------- Services catalog ----------

function ServicesPanel() {
  const all = servicesCollection.useAll()
  const [editing, setEditing] = useState(null)

  return (
    <>
      <div className="flex justify-end mb-4">
        <button className="ty-btn-safety" onClick={() => setEditing('new')}>
          <Plus className="w-4 h-4" strokeWidth={3} />
          Add Service
        </button>
      </div>

      {all.length === 0 ? (
        <EmptyState
          Icon={Package}
          title="No services yet"
          body="Add the services you quote the most often — labor, demo, paint — and they'll drop into quotes in one click."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {all.map((s) => (
            <div key={s.id} className="ty-card p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <div className="font-stencil text-base uppercase tracking-wide text-steel-100 truncate">
                    {s.name}
                  </div>
                  {s.description && (
                    <div className="text-xs text-steel-400 mt-0.5">
                      {s.description}
                    </div>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <IconButton onClick={() => setEditing(s)} title="Edit">
                    <Pencil className="w-4 h-4" />
                  </IconButton>
                  <IconButton
                    onClick={() => {
                      if (confirm(`Delete "${s.name}"?`)) servicesCollection.remove(s.id)
                    }}
                    title="Delete"
                    danger
                  >
                    <Trash2 className="w-4 h-4" />
                  </IconButton>
                </div>
              </div>
              <div className="flex items-baseline justify-between pt-3 border-t border-steel-700">
                <span className="text-xs uppercase tracking-wider text-steel-500">
                  per {s.unit}
                </span>
                <span className="font-stencil text-xl text-safety">
                  {money(s.rate)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <ServiceModal
          service={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSave={(data) => {
            const normalized = { ...data, rate: Number(data.rate) || 0 }
            servicesCollection.upsert(
              editing === 'new' ? normalized : { ...editing, ...normalized }
            )
            setEditing(null)
          }}
        />
      )}
    </>
  )
}

function ServiceModal({ service, onClose, onSave }) {
  const [form, setForm] = useState(
    service || { name: '', description: '', unit: 'hour', rate: 0 }
  )
  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const submit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    onSave(form)
  }
  return (
    <Modal title={service ? 'Edit Service' : 'Add Service'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Service name *">
          <input
            required
            autoFocus
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            placeholder="General Labor"
            className="ty-input"
          />
        </Field>
        <Field label="Description">
          <textarea
            rows="2"
            value={form.description}
            onChange={(e) => setField('description', e.target.value)}
            className="ty-input resize-none"
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Unit">
            <select
              value={form.unit}
              onChange={(e) => setField('unit', e.target.value)}
              className="ty-input"
            >
              {SERVICE_UNITS.map((u) => (
                <option key={u}>{u}</option>
              ))}
            </select>
          </Field>
          <Field label="Rate">
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.rate}
              onChange={(e) => setField('rate', e.target.value)}
              className="ty-input"
            />
          </Field>
        </div>
        <ModalFooter
          onClose={onClose}
          submitLabel={service ? 'Save changes' : 'Add to catalog'}
        />
      </form>
    </Modal>
  )
}

// ---------- Shared primitives ----------

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
      {count !== undefined && (
        <span
          className={`text-[10px] px-1.5 py-0.5 ${
            active ? 'bg-safety text-steel-900' : 'bg-steel-800 text-steel-400'
          }`}
        >
          {count}
        </span>
      )}
    </button>
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
