import { useMemo, useState } from 'react'
import {
  FileWarning, Plus, Pencil, Trash2, X, Search, Printer, Mail, Copy,
  ArrowLeft, ListChecks, CalendarDays, Briefcase, AlertTriangle,
} from 'lucide-react'
import {
  changeOrders,
  quotes,
  customers,
  jobs,
  services as servicesCollection,
  customerAddressLines,
  SERVICE_UNITS,
  CHANGE_ORDER_STATUSES,
} from '../../data/collections.js'
import JobPicker, { JobLabel } from '../../components/JobPicker.jsx'
import {
  money,
  todayIso,
  lineTotal,
  computeTotals,
  nextDocNumber,
  blankLineItem,
  printNow,
  buildMailtoUrl,
} from '../quickquote/quoteUtils.js'

const statusMeta = (key) =>
  ({
    draft:    { label: 'Draft',    cls: 'text-steel-400 border-steel-600 bg-steel-800' },
    sent:     { label: 'Sent',     cls: 'text-sky-400 border-sky-500/40 bg-sky-500/10' },
    approved: { label: 'Approved', cls: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10' },
    rejected: { label: 'Rejected', cls: 'text-red-400 border-red-500/40 bg-red-500/10' },
  }[key] || { label: key, cls: 'text-steel-400 border-steel-600 bg-steel-800' })

export default function ChangeOrders() {
  const [editing, setEditing] = useState(null)
  const [printing, setPrinting] = useState(null)

  if (editing) {
    return (
      <ChangeOrderEditor
        changeOrder={editing === 'new' ? null : editing}
        onClose={() => setEditing(null)}
        onPreview={(co) => {
          setEditing(null)
          setPrinting(co)
        }}
      />
    )
  }

  if (printing) {
    return (
      <ChangeOrderPrintView
        changeOrder={printing}
        onClose={() => setPrinting(null)}
      />
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* Page header */}
      <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="font-stencil text-xs uppercase tracking-[0.25em] text-safety mb-1">
            Tool · Change Orders
          </div>
          <h1 className="font-stencil text-4xl uppercase text-steel-100 mb-2">
            Change Orders
          </h1>
          <p className="text-steel-400 text-sm max-w-xl">
            Bill extra work against an existing job. Each change order is tied
            to a job and rolls up into the per-job billing summary below.
          </p>
        </div>
        <button className="ty-btn-safety" onClick={() => setEditing('new')}>
          <Plus className="w-4 h-4" strokeWidth={3} />
          New Change Order
        </button>
      </div>

      <ChangeOrdersList
        onEdit={(co) => setEditing(co)}
        onPreview={(co) => setPrinting(co)}
      />
    </div>
  )
}

// ---------- List + rollup ----------

function ChangeOrdersList({ onEdit, onPreview }) {
  const all = changeOrders.useAll()
  const allQuotes = quotes.useAll()
  const allJobs = jobs.useAll()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [jobFilter, setJobFilter] = useState('all')

  const filtered = useMemo(() => {
    return all.filter((co) => {
      if (filter !== 'all' && co.status !== filter) return false
      if (jobFilter !== 'all' && co.jobId !== jobFilter) return false
      if (!query) return true
      const needle = query.toLowerCase()
      return (
        (co.number || '').toLowerCase().includes(needle) ||
        (co.jobName || '').toLowerCase().includes(needle) ||
        (co.reason || '').toLowerCase().includes(needle)
      )
    })
  }, [all, query, filter, jobFilter])

  const sorted = [...filtered].sort(
    (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
  )

  // Build per-job billing rollup: original accepted quote + approved COs
  const rollup = useMemo(() => {
    const map = new Map()

    // Seed with jobs referenced anywhere
    for (const j of allJobs) {
      map.set(j.id, {
        jobId: j.id,
        jobName: j.name,
        status: j.status,
        acceptedQuotes: 0,
        quoteCount: 0,
        approvedCOs: 0,
        approvedCOCount: 0,
        draftCOs: 0,
      })
    }

    for (const q of allQuotes) {
      if (!q.jobId) continue
      if (!map.has(q.jobId)) {
        map.set(q.jobId, {
          jobId: q.jobId,
          jobName: q.jobName || 'Unknown job',
          status: 'unknown',
          acceptedQuotes: 0,
          quoteCount: 0,
          approvedCOs: 0,
          approvedCOCount: 0,
          draftCOs: 0,
        })
      }
      const entry = map.get(q.jobId)
      if (q.status === 'accepted') {
        entry.acceptedQuotes += computeTotals(q.lineItems || [], q.taxRate).total
        entry.quoteCount += 1
      }
    }

    for (const co of all) {
      if (!co.jobId) continue
      if (!map.has(co.jobId)) {
        map.set(co.jobId, {
          jobId: co.jobId,
          jobName: co.jobName || 'Unknown job',
          status: 'unknown',
          acceptedQuotes: 0,
          quoteCount: 0,
          approvedCOs: 0,
          approvedCOCount: 0,
          draftCOs: 0,
        })
      }
      const entry = map.get(co.jobId)
      const coTotal = computeTotals(co.lineItems || [], co.taxRate).total
      if (co.status === 'approved') {
        entry.approvedCOs += coTotal
        entry.approvedCOCount += 1
      } else if (co.status === 'draft' || co.status === 'sent') {
        entry.draftCOs += coTotal
      }
    }

    return Array.from(map.values())
      .filter(
        (e) =>
          e.acceptedQuotes > 0 ||
          e.approvedCOs > 0 ||
          e.draftCOs > 0 ||
          e.approvedCOCount > 0
      )
      .sort(
        (a, b) =>
          b.acceptedQuotes + b.approvedCOs - (a.acceptedQuotes + a.approvedCOs)
      )
  }, [allJobs, allQuotes, all])

  if (allJobs.length === 0) {
    return (
      <EmptyState
        Icon={Briefcase}
        title="No jobs yet"
        body="Change orders have to be tied to a job. Add one in The Office first."
      />
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <div className="flex gap-2 flex-wrap mb-3">
          <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>
            All · {all.length}
          </FilterChip>
          {CHANGE_ORDER_STATUSES.map((s) => (
            <FilterChip
              key={s.key}
              active={filter === s.key}
              onClick={() => setFilter(s.key)}
            >
              {s.label} · {all.filter((c) => c.status === s.key).length}
            </FilterChip>
          ))}
        </div>

        <div className="flex gap-2 flex-wrap mb-4">
          <FilterChip
            active={jobFilter === 'all'}
            onClick={() => setJobFilter('all')}
          >
            All jobs
          </FilterChip>
          {allJobs
            .filter((j) => all.some((co) => co.jobId === j.id))
            .map((j) => (
              <FilterChip
                key={j.id}
                active={jobFilter === j.id}
                onClick={() => setJobFilter(j.id)}
              >
                {j.name}
              </FilterChip>
            ))}
        </div>

        <div className="relative mb-4">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-steel-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by number, job, or reason…"
            className="w-full pl-10 pr-4 py-3 bg-steel-800 border-2 border-steel-700 text-steel-100 placeholder-steel-500 focus:outline-none focus:border-safety"
          />
        </div>

        {sorted.length === 0 ? (
          <EmptyState
            Icon={FileWarning}
            title={
              all.length === 0
                ? 'No change orders yet'
                : 'No change orders match that filter'
            }
            body={
              all.length === 0
                ? 'Create one when a customer approves extra work on a job.'
                : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sorted.map((co) => (
              <ChangeOrderCard
                key={co.id}
                changeOrder={co}
                onEdit={() => onEdit(co)}
                onPreview={() => onPreview(co)}
                onDelete={() => {
                  if (confirm(`Delete change order ${co.number}?`)) {
                    changeOrders.remove(co.id)
                  }
                }}
                onDuplicate={() => {
                  const copy = {
                    ...co,
                    id: undefined,
                    createdAt: undefined,
                    number: nextDocNumber('CO', changeOrders.getAll()),
                    status: 'draft',
                    issueDate: todayIso(),
                  }
                  delete copy.id
                  delete copy.createdAt
                  changeOrders.add(copy)
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Rollup panel */}
      <div className="space-y-4">
        <div className="ty-card p-5">
          <div className="text-xs font-stencil uppercase tracking-widest text-steel-500 mb-3">
            Billing by job
          </div>
          {rollup.length === 0 ? (
            <p className="text-xs text-steel-500 italic">
              Accepted quotes and approved change orders will show up here.
            </p>
          ) : (
            <div className="space-y-4">
              {rollup.map((r) => {
                const jobTotal = r.acceptedQuotes + r.approvedCOs
                return (
                  <div
                    key={r.jobId}
                    className="pb-4 border-b border-steel-700 last:border-0 last:pb-0"
                  >
                    <div className="text-sm text-steel-100 font-semibold truncate mb-2">
                      {r.jobName}
                    </div>
                    <div className="flex justify-between text-xs text-steel-400 mb-1">
                      <span>Accepted quote{r.quoteCount === 1 ? '' : 's'}</span>
                      <span className="text-steel-200">
                        {money(r.acceptedQuotes)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-steel-400 mb-1">
                      <span>
                        Approved CO{r.approvedCOCount === 1 ? '' : 's'}
                      </span>
                      <span className="text-steel-200">
                        +{money(r.approvedCOs)}
                      </span>
                    </div>
                    {r.draftCOs > 0 && (
                      <div className="flex justify-between text-xs text-steel-500 italic mb-1">
                        <span>Pending COs</span>
                        <span>{money(r.draftCOs)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-baseline pt-1.5 mt-1.5 border-t border-steel-700">
                      <span className="text-[10px] font-stencil uppercase tracking-widest text-steel-400">
                        Job total
                      </span>
                      <span className="font-stencil text-lg text-safety">
                        {money(jobTotal)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          {rollup.length > 0 && (
            <div className="mt-4 pt-4 border-t-2 border-steel-700 flex justify-between items-baseline">
              <span className="text-xs font-stencil uppercase tracking-widest text-steel-400">
                Grand total
              </span>
              <span className="font-stencil text-2xl text-safety">
                {money(
                  rollup.reduce(
                    (s, r) => s + r.acceptedQuotes + r.approvedCOs,
                    0
                  )
                )}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ChangeOrderCard({
  changeOrder,
  onEdit,
  onPreview,
  onDelete,
  onDuplicate,
}) {
  const meta = statusMeta(changeOrder.status)
  const { total } = computeTotals(
    changeOrder.lineItems || [],
    changeOrder.taxRate
  )
  return (
    <div className="ty-card p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="font-mono text-xs text-steel-500 mb-1">
            {changeOrder.number}
          </div>
          <div className="font-stencil text-lg uppercase tracking-wide text-steel-100 truncate">
            {changeOrder.reason || 'No reason'}
          </div>
          <div className="flex items-center gap-1 text-xs text-safety mt-0.5 min-w-0">
            <Briefcase className="w-3 h-3 shrink-0" />
            <span className="truncate">{changeOrder.jobName || '—'}</span>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-stencil uppercase tracking-widest px-2 py-1 border ${meta.cls} shrink-0`}
        >
          {meta.label}
        </span>
      </div>

      <div className="space-y-1 text-xs text-steel-400 mb-4">
        {changeOrder.issueDate && (
          <div className="flex items-center gap-2">
            <CalendarDays className="w-3 h-3 text-steel-500" />
            <span>Issued {changeOrder.issueDate}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <ListChecks className="w-3 h-3 text-steel-500" />
          <span>
            {(changeOrder.lineItems || []).length} line item
            {(changeOrder.lineItems || []).length === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      <div className="flex items-baseline justify-between pt-4 border-t border-steel-700">
        <span className="text-[10px] font-stencil uppercase tracking-widest text-steel-500">
          Amount
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

// ---------- Editor ----------

function ChangeOrderEditor({ changeOrder, onClose, onPreview }) {
  const allJobs = jobs.useAll()
  const allServices = servicesCollection.useAll()
  const allCustomers = customers.useAll()

  const [form, setForm] = useState(() => {
    if (changeOrder)
      return { ...changeOrder, lineItems: changeOrder.lineItems || [] }
    return {
      number: nextDocNumber('CO', changeOrders.getAll()),
      status: 'draft',
      jobId: '',
      jobName: '',
      customerId: '',
      customerName: '',
      reason: '',
      issueDate: todayIso(),
      lineItems: [blankLineItem()],
      taxRate: 0,
      notes: '',
    }
  })

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  // Try to auto-fill customer from the selected job's most recent accepted quote
  const handleJobChange = (id) => {
    setField('jobId', id)
    if (!id) return
    // look up a quote for this job to inherit the customer
    const q = quotes
      .getAll()
      .find((q) => q.jobId === id && q.customerId)
    if (q) {
      setForm((f) => ({ ...f, jobId: id, customerId: q.customerId }))
    }
  }

  const totals = computeTotals(form.lineItems, form.taxRate)

  const updateLine = (id, patch) => {
    setForm((f) => ({
      ...f,
      lineItems: f.lineItems.map((li) =>
        li.id === id ? { ...li, ...patch } : li
      ),
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
    setForm((f) => ({
      ...f,
      lineItems: f.lineItems.filter((li) => li.id !== id),
    }))
  }

  const save = (alsoPreview = false) => {
    const job = allJobs.find((j) => j.id === form.jobId)
    const customer = allCustomers.find((c) => c.id === form.customerId)

    const cleaned = {
      ...form,
      jobName: job ? job.name : form.jobName || '',
      customerName: customer ? customer.name : form.customerName || '',
      customerEmail: customer ? customer.email : form.customerEmail || '',
      customerAddress: customer
        ? customerAddressLines(customer).join('\n')
        : form.customerAddress || '',
      customerContact: customer
        ? customer.contactName
        : form.customerContact || '',
      taxRate: Number(form.taxRate) || 0,
      lineItems: form.lineItems.map((li) => ({
        ...li,
        quantity: Number(li.quantity) || 0,
        rate: Number(li.rate) || 0,
      })),
    }

    const saved = changeOrders.upsert(
      changeOrder ? { ...changeOrder, ...cleaned } : cleaned
    )
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
        Back to change orders
      </button>

      <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="font-mono text-xs text-steel-500 mb-1">
            {form.number}
          </div>
          <h1 className="font-stencil text-3xl uppercase text-steel-100">
            {changeOrder ? 'Edit Change Order' : 'New Change Order'}
          </h1>
        </div>
        <select
          value={form.status}
          onChange={(e) => setField('status', e.target.value)}
          className="ty-input-sm"
        >
          {CHANGE_ORDER_STATUSES.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="ty-card p-6 mb-6 space-y-4">
        <Field label="Bill to job *">
          <JobPicker
            value={form.jobId}
            onChange={handleJobChange}
            noneLabel="— Pick a job —"
          />
        </Field>
        <Field label="Reason / short title *">
          <input
            value={form.reason}
            onChange={(e) => setField('reason', e.target.value)}
            placeholder="Add pantry electrical circuit"
            className="ty-input"
          />
        </Field>
        <Field label="Issue date">
          <input
            type="date"
            value={form.issueDate}
            onChange={(e) => setField('issueDate', e.target.value)}
            className="ty-input"
          />
        </Field>
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
              No line items yet.
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

      <div className="ty-card p-6 mb-6">
        <Field label="Notes (shown on printed change order)">
          <textarea
            rows="3"
            value={form.notes}
            onChange={(e) => setField('notes', e.target.value)}
            className="ty-input resize-none"
            placeholder="Explain the scope change, why it was needed, and any impact on schedule."
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
          disabled={!form.jobId || !form.reason.trim()}
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

function ChangeOrderPrintView({ changeOrder, onClose }) {
  const customer = customers.useOne(changeOrder.customerId)
  const totals = computeTotals(
    changeOrder.lineItems || [],
    changeOrder.taxRate
  )

  const customerEmail = customer?.email || changeOrder.customerEmail || ''
  const mailto = buildMailtoUrl({
    to: customerEmail,
    subject: `Change Order ${changeOrder.number} — ${changeOrder.jobName || ''}`,
    body: `Hi ${customer?.contactName || customer?.name || 'there'},

Please find change order ${changeOrder.number} for the ${changeOrder.jobName || 'project'}.

  Reason: ${changeOrder.reason || '—'}
  Amount: ${money(totals.total)}

Tip: use the "Save as PDF" button in the app to download a PDF, then attach it to this email.

Thanks!
`,
  })

  return (
    <div className="ty-print-overlay">
      <div className="ty-print-hide bg-steel-900 border-b-2 border-steel-700 px-6 py-3 flex items-center justify-between flex-wrap gap-3">
        <button
          onClick={onClose}
          className="inline-flex items-center gap-2 text-xs font-stencil uppercase tracking-widest text-steel-300 hover:text-safety"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to change orders
        </button>
        <div className="flex gap-2 flex-wrap">
          {customerEmail && (
            <a href={mailto} className="ty-btn">
              <Mail className="w-4 h-4" />
              Email change order
            </a>
          )}
          <button onClick={printNow} className="ty-btn-safety">
            <Printer className="w-4 h-4" strokeWidth={3} />
            Print / Save PDF
          </button>
        </div>
      </div>

      <div className="ty-print-root">
        <div className="ty-print-page">
          <div className="flex items-start justify-between gap-8 mb-8 pb-6 border-b-4 border-black">
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-gray-500">
                Tool Yard
              </div>
              <div className="text-3xl font-bold mt-1">CHANGE ORDER</div>
              <div className="text-sm text-gray-600 mt-1">
                Additional work authorization
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-widest text-gray-500">
                CO #
              </div>
              <div className="text-xl font-mono font-bold">
                {changeOrder.number}
              </div>
              <div className="text-xs text-gray-600 mt-2">
                Issued: <strong>{changeOrder.issueDate || '—'}</strong>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-6">
            <div>
              <div className="text-xs uppercase tracking-widest text-gray-500 mb-1">
                Bill to
              </div>
              <div className="font-bold text-lg">
                {customer?.name || changeOrder.customerName || '—'}
              </div>
              {(customer?.contactName || changeOrder.customerContact) && (
                <div className="text-sm">
                  {customer?.contactName || changeOrder.customerContact}
                </div>
              )}
              {(() => {
                const lines = customer
                  ? customerAddressLines(customer)
                  : (changeOrder.customerAddress || '')
                      .split('\n')
                      .filter(Boolean)
                return lines.length > 0 ? (
                  <div className="text-sm text-gray-700 whitespace-pre-line">
                    {lines.join('\n')}
                  </div>
                ) : null
              })()}
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-gray-500 mb-1">
                Job
              </div>
              <div className="font-bold text-lg">{changeOrder.jobName || '—'}</div>
            </div>
          </div>

          <div className="mb-6 p-3 bg-gray-100 border-l-4 border-black">
            <div className="text-xs uppercase tracking-widest text-gray-500 mb-1">
              Reason for change
            </div>
            <div className="font-semibold">{changeOrder.reason || '—'}</div>
          </div>

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
              {(changeOrder.lineItems || []).map((li) => (
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

          <div className="flex justify-end mb-8">
            <div className="w-72 text-sm">
              <div className="flex justify-between py-1">
                <span className="text-gray-600">Subtotal</span>
                <span>{money(totals.subtotal)}</span>
              </div>
              {Number(changeOrder.taxRate) > 0 && (
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">
                    Tax ({Number(changeOrder.taxRate)}%)
                  </span>
                  <span>{money(totals.tax)}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-t-2 border-black mt-1 text-xl font-bold">
                <span>Change order total</span>
                <span>{money(totals.total)}</span>
              </div>
            </div>
          </div>

          {changeOrder.notes && (
            <div className="border-t border-gray-300 pt-4 mb-6">
              <div className="text-xs uppercase tracking-widest text-gray-500 mb-2">
                Notes
              </div>
              <p className="text-xs text-gray-700 whitespace-pre-wrap">
                {changeOrder.notes}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-8 mt-10 pt-4">
            <div>
              <div className="border-b border-black pb-1 h-12" />
              <div className="text-xs text-gray-500 mt-1">
                Authorized by (customer)
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

// ---------- Shared primitives ----------

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
