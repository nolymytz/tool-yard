import { useMemo, useState } from 'react'
import {
  Package, PackagePlus, History, Plus, Pencil, Trash2, X, Search,
  AlertTriangle, TrendingDown, DollarSign, Hash, Tag, ArrowDownCircle,
  Briefcase,
} from 'lucide-react'
import {
  materials,
  cribPulls,
  jobs,
  MATERIAL_CATEGORIES,
  MATERIAL_UNITS,
} from '../../data/collections.js'
import JobPicker, { JobLabel } from '../../components/JobPicker.jsx'

const TAB_INVENTORY = 'inventory'
const TAB_PULL = 'pull'
const TAB_HISTORY = 'history'

const money = (n) =>
  (Number(n) || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })

export default function Crib() {
  const [tab, setTab] = useState(TAB_INVENTORY)
  const allMaterials = materials.useAll()
  const allPulls = cribPulls.useAll()

  const lowCount = allMaterials.filter(
    (m) => Number(m.onHand) <= Number(m.lowStock || 0)
  ).length

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* Page header */}
      <div className="mb-8">
        <div className="font-stencil text-xs uppercase tracking-[0.25em] text-safety mb-1">
          Tool · The Crib
        </div>
        <h1 className="font-stencil text-4xl uppercase text-steel-100 mb-2">
          The Crib
        </h1>
        <p className="text-steel-400 text-sm max-w-xl">
          Shop materials inventory and pull log. Track what's on hand, pull
          supplies against a job, and bill materials back to the project.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b-2 border-steel-700 mb-6 flex-wrap">
        <TabButton
          active={tab === TAB_INVENTORY}
          onClick={() => setTab(TAB_INVENTORY)}
          Icon={Package}
          label="Inventory"
          count={allMaterials.length}
          badge={lowCount > 0 ? lowCount : null}
        />
        <TabButton
          active={tab === TAB_PULL}
          onClick={() => setTab(TAB_PULL)}
          Icon={PackagePlus}
          label="Pull Supplies"
        />
        <TabButton
          active={tab === TAB_HISTORY}
          onClick={() => setTab(TAB_HISTORY)}
          Icon={History}
          label="Pull History"
          count={allPulls.length}
        />
      </div>

      {tab === TAB_INVENTORY && <InventoryPanel />}
      {tab === TAB_PULL && <PullPanel onComplete={() => setTab(TAB_HISTORY)} />}
      {tab === TAB_HISTORY && <HistoryPanel />}
    </div>
  )
}

// ---------- Inventory ----------

function InventoryPanel() {
  const all = materials.useAll()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [editing, setEditing] = useState(null)

  const filtered = useMemo(() => {
    return all.filter((m) => {
      if (category !== 'all' && m.category !== category) return false
      if (!query) return true
      const q = query.toLowerCase()
      return (
        m.name.toLowerCase().includes(q) ||
        (m.category || '').toLowerCase().includes(q) ||
        (m.notes || '').toLowerCase().includes(q)
      )
    })
  }, [all, query, category])

  const lowStock = all.filter((m) => Number(m.onHand) <= Number(m.lowStock || 0))

  return (
    <>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div className="flex gap-2 flex-wrap">
          <FilterChip active={category === 'all'} onClick={() => setCategory('all')}>
            All · {all.length}
          </FilterChip>
          {MATERIAL_CATEGORIES.map((c) => {
            const n = all.filter((m) => m.category === c).length
            if (n === 0) return null
            return (
              <FilterChip
                key={c}
                active={category === c}
                onClick={() => setCategory(c)}
              >
                {c} · {n}
              </FilterChip>
            )
          })}
        </div>
        <button className="ty-btn-safety" onClick={() => setEditing('new')}>
          <Plus className="w-4 h-4" strokeWidth={3} />
          Add Material
        </button>
      </div>

      {lowStock.length > 0 && (
        <div className="mb-4 p-4 bg-caution/10 border-2 border-caution/40 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-caution shrink-0 mt-0.5" />
          <div>
            <div className="font-stencil text-sm uppercase tracking-wider text-caution mb-1">
              {lowStock.length} material{lowStock.length === 1 ? '' : 's'} running low
            </div>
            <div className="text-xs text-steel-300">
              {lowStock.map((m) => m.name).join(' · ')}
            </div>
          </div>
        </div>
      )}

      <div className="relative mb-6">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-steel-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search materials…"
          className="w-full pl-10 pr-4 py-3 bg-steel-800 border-2 border-steel-700 text-steel-100 placeholder-steel-500 focus:outline-none focus:border-safety"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          Icon={Package}
          title={all.length === 0 ? 'No materials yet' : 'Nothing matches that filter'}
          body={
            all.length === 0
              ? 'Stock the crib with the supplies your crews pull on the regular.'
              : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((m) => (
            <MaterialCard
              key={m.id}
              material={m}
              onEdit={() => setEditing(m)}
              onDelete={() => {
                if (confirm(`Delete "${m.name}"? Past pulls keep their history.`)) {
                  materials.remove(m.id)
                }
              }}
            />
          ))}
        </div>
      )}

      {editing && (
        <MaterialModal
          material={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSave={(data) => {
            const normalized = {
              ...data,
              onHand: Number(data.onHand) || 0,
              lowStock: Number(data.lowStock) || 0,
              costPerUnit: Number(data.costPerUnit) || 0,
            }
            materials.upsert(
              editing === 'new' ? normalized : { ...editing, ...normalized }
            )
            setEditing(null)
          }}
        />
      )}
    </>
  )
}

function MaterialCard({ material, onEdit, onDelete }) {
  const low = Number(material.onHand) <= Number(material.lowStock || 0)
  return (
    <div className={`ty-card p-5 ${low ? 'border-caution/60' : ''}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="font-stencil text-base uppercase tracking-wide text-steel-100 truncate">
            {material.name}
          </div>
          {material.category && (
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-steel-500 mt-1">
              <Tag className="w-3 h-3" />
              {material.category}
            </div>
          )}
        </div>
        {low && (
          <span className="inline-flex items-center gap-1 text-[10px] font-stencil uppercase tracking-widest px-2 py-1 border text-caution border-caution/40 bg-caution/10 shrink-0">
            <TrendingDown className="w-3 h-3" strokeWidth={2.5} />
            Low
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-2 mb-3">
        <span className="font-stencil text-3xl text-steel-100">
          {material.onHand}
        </span>
        <span className="text-xs uppercase tracking-wider text-steel-500">
          {material.unit}
        </span>
      </div>

      <div className="space-y-1 text-xs text-steel-400 mb-4">
        <div className="flex items-center gap-2">
          <DollarSign className="w-3 h-3 text-steel-500" />
          <span>{money(material.costPerUnit)} / {material.unit}</span>
        </div>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-3 h-3 text-steel-500" />
          <span>Reorder at {material.lowStock} {material.unit}</span>
        </div>
      </div>

      {material.notes && (
        <p className="text-xs text-steel-500 italic border-l-2 border-steel-700 pl-3 mb-4">
          {material.notes}
        </p>
      )}

      <div className="pt-4 border-t border-steel-700 flex items-center justify-end gap-2">
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

function MaterialModal({ material, onClose, onSave }) {
  const [form, setForm] = useState(
    material || {
      name: '',
      category: 'Fasteners',
      unit: 'each',
      onHand: 0,
      lowStock: 0,
      costPerUnit: 0,
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
    <Modal title={material ? 'Edit Material' : 'Add Material'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Name *">
          <input
            required
            autoFocus
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            placeholder="16d Framing Nails"
            className="ty-input"
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Category">
            <select
              value={form.category}
              onChange={(e) => setField('category', e.target.value)}
              className="ty-input"
            >
              {MATERIAL_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Unit">
            <select
              value={form.unit}
              onChange={(e) => setField('unit', e.target.value)}
              className="ty-input"
            >
              {MATERIAL_UNITS.map((u) => (
                <option key={u}>{u}</option>
              ))}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Field label="On hand">
            <input
              type="number"
              min="0"
              step="any"
              value={form.onHand}
              onChange={(e) => setField('onHand', e.target.value)}
              className="ty-input"
            />
          </Field>
          <Field label="Reorder at">
            <input
              type="number"
              min="0"
              step="any"
              value={form.lowStock}
              onChange={(e) => setField('lowStock', e.target.value)}
              className="ty-input"
            />
          </Field>
          <Field label="Cost / unit">
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.costPerUnit}
              onChange={(e) => setField('costPerUnit', e.target.value)}
              className="ty-input"
            />
          </Field>
        </div>
        <Field label="Notes">
          <textarea
            rows="3"
            value={form.notes}
            onChange={(e) => setField('notes', e.target.value)}
            placeholder="Supplier, SKU, bin location…"
            className="ty-input resize-none"
          />
        </Field>
        <ModalFooter
          onClose={onClose}
          submitLabel={material ? 'Save changes' : 'Add to crib'}
        />
      </form>
    </Modal>
  )
}

// ---------- Pull Supplies ----------

function PullPanel({ onComplete }) {
  const allMaterials = materials.useAll()
  const allJobs = jobs.useAll()
  const [materialId, setMaterialId] = useState('')
  const [jobId, setJobId] = useState('')
  const [qty, setQty] = useState('')
  const [pulledBy, setPulledBy] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [flash, setFlash] = useState(null)

  const material = allMaterials.find((m) => m.id === materialId) || null
  const numericQty = Number(qty) || 0
  const runningTotal = material ? numericQty * Number(material.costPerUnit || 0) : 0
  const wouldOverdraw = material ? numericQty > Number(material.onHand || 0) : false

  const reset = () => {
    setMaterialId('')
    setJobId('')
    setQty('')
    setPulledBy('')
    setNote('')
    setError('')
  }

  const submit = (e) => {
    e.preventDefault()
    setError('')
    if (!material) return setError('Pick a material.')
    if (!jobId) return setError('Pick a job to bill this pull against.')
    if (!numericQty || numericQty <= 0) return setError('Quantity must be greater than zero.')
    if (wouldOverdraw) {
      return setError(
        `Only ${material.onHand} ${material.unit} on hand — adjust inventory or reduce the pull.`
      )
    }

    const job = allJobs.find((j) => j.id === jobId)
    // Snapshot everything so the pull history survives later edits
    cribPulls.add({
      materialId: material.id,
      materialName: material.name,
      category: material.category,
      unit: material.unit,
      qty: numericQty,
      costPerUnit: Number(material.costPerUnit) || 0,
      totalCost: runningTotal,
      jobId: job?.id || null,
      jobName: job?.name || '',
      pulledBy: pulledBy.trim(),
      note: note.trim(),
      pulledAt: new Date().toISOString(),
    })

    // Decrement inventory
    materials.update(material.id, {
      onHand: Math.max(0, Number(material.onHand) - numericQty),
    })

    setFlash({
      material: material.name,
      qty: numericQty,
      unit: material.unit,
      job: job?.name || '',
      total: runningTotal,
    })
    reset()
  }

  if (allMaterials.length === 0) {
    return (
      <EmptyState
        Icon={Package}
        title="The crib is empty"
        body="Add materials on the Inventory tab before you can pull anything."
      />
    )
  }

  if (allJobs.length === 0) {
    return (
      <EmptyState
        Icon={Briefcase}
        title="No jobs to bill against"
        body="Add a job in The Office first — every pull has to be tagged to a job."
      />
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <form onSubmit={submit} className="ty-card p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <ArrowDownCircle className="w-5 h-5 text-safety" />
            <h2 className="font-stencil text-xl uppercase tracking-wide text-steel-100">
              Pull from the crib
            </h2>
          </div>

          <Field label="Material *">
            <select
              required
              value={materialId}
              onChange={(e) => setMaterialId(e.target.value)}
              className="ty-input"
            >
              <option value="">— Pick a material —</option>
              {allMaterials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.onHand} {m.unit} on hand)
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Quantity *">
              <input
                type="number"
                min="0"
                step="any"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                placeholder="0"
                className="ty-input"
              />
            </Field>
            <Field label="Unit">
              <input
                disabled
                value={material ? material.unit : ''}
                placeholder="—"
                className="ty-input opacity-60"
              />
            </Field>
          </div>

          <Field label="Bill to job *">
            <JobPicker
              value={jobId}
              onChange={setJobId}
              noneLabel="— Pick a job —"
              activeOnly
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Pulled by">
              <input
                value={pulledBy}
                onChange={(e) => setPulledBy(e.target.value)}
                placeholder="Luis R."
                className="ty-input"
              />
            </Field>
            <Field label="Note">
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Framing north wall"
                className="ty-input"
              />
            </Field>
          </div>

          {error && (
            <div className="p-3 border-2 border-red-500/40 bg-red-500/10 text-red-300 text-sm flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-steel-700">
            <button type="button" onClick={reset} className="ty-btn">
              Clear
            </button>
            <button
              type="submit"
              disabled={!material || !jobId || !numericQty || wouldOverdraw}
              className="ty-btn-safety disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ArrowDownCircle className="w-4 h-4" strokeWidth={3} />
              Log pull
            </button>
          </div>
        </form>

        {flash && (
          <div className="mt-4 p-4 border-2 border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-sm flex items-start justify-between gap-3">
            <div>
              <div className="font-stencil uppercase tracking-wider text-emerald-300 mb-1">
                Pull logged
              </div>
              <div className="text-steel-300">
                {flash.qty} {flash.unit} of{' '}
                <span className="text-steel-100">{flash.material}</span> billed to{' '}
                <span className="text-steel-100">{flash.job}</span> — {money(flash.total)}
              </div>
            </div>
            <button
              onClick={() => {
                setFlash(null)
                onComplete && onComplete()
              }}
              className="shrink-0 text-xs uppercase tracking-wider font-stencil text-emerald-300 hover:text-emerald-200"
            >
              View history →
            </button>
          </div>
        )}
      </div>

      {/* Summary panel */}
      <div className="space-y-4">
        <div className="ty-card p-5">
          <div className="text-xs font-stencil uppercase tracking-widest text-steel-500 mb-2">
            Pull summary
          </div>
          {material ? (
            <>
              <div className="font-stencil text-base uppercase text-steel-100 mb-1">
                {material.name}
              </div>
              <div className="text-xs text-steel-400 mb-4">
                {material.onHand} {material.unit} on hand · {money(material.costPerUnit)}/{material.unit}
              </div>
              <div className="flex items-baseline justify-between py-3 border-t border-steel-700">
                <span className="text-xs uppercase tracking-wider text-steel-500">
                  Pulling
                </span>
                <span className="font-stencil text-xl text-steel-100">
                  {numericQty || 0} {material.unit}
                </span>
              </div>
              <div className="flex items-baseline justify-between py-3 border-t border-steel-700">
                <span className="text-xs uppercase tracking-wider text-steel-500">
                  Remaining
                </span>
                <span
                  className={`font-stencil text-xl ${
                    wouldOverdraw
                      ? 'text-red-400'
                      : Number(material.onHand) - numericQty <= Number(material.lowStock || 0)
                      ? 'text-caution'
                      : 'text-steel-100'
                  }`}
                >
                  {Math.max(0, Number(material.onHand) - numericQty)} {material.unit}
                </span>
              </div>
              <div className="flex items-baseline justify-between py-3 border-t border-steel-700">
                <span className="text-xs uppercase tracking-wider text-steel-500">
                  Bill total
                </span>
                <span className="font-stencil text-2xl text-safety">
                  {money(runningTotal)}
                </span>
              </div>
            </>
          ) : (
            <p className="text-sm text-steel-500 italic">
              Pick a material to see totals.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------- History ----------

function HistoryPanel() {
  const allPulls = cribPulls.useAll()
  const [jobFilter, setJobFilter] = useState('all')

  const sorted = useMemo(
    () =>
      [...allPulls].sort((a, b) => {
        const ta = new Date(a.pulledAt || a.createdAt || 0).getTime()
        const tb = new Date(b.pulledAt || b.createdAt || 0).getTime()
        return tb - ta
      }),
    [allPulls]
  )

  const filtered =
    jobFilter === 'all'
      ? sorted
      : sorted.filter((p) => p.jobId === jobFilter)

  // Totals per job for billing
  const byJob = useMemo(() => {
    const map = new Map()
    for (const p of allPulls) {
      const key = p.jobId || '__none'
      const name = p.jobName || '— No job —'
      const entry = map.get(key) || { id: p.jobId, name, total: 0, count: 0 }
      entry.total += Number(p.totalCost) || 0
      entry.count += 1
      map.set(key, entry)
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total)
  }, [allPulls])

  if (allPulls.length === 0) {
    return (
      <EmptyState
        Icon={History}
        title="No pulls logged yet"
        body="Head to the Pull Supplies tab to log your first withdrawal."
      />
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <div className="flex gap-2 flex-wrap mb-4">
          <FilterChip
            active={jobFilter === 'all'}
            onClick={() => setJobFilter('all')}
          >
            All jobs · {allPulls.length}
          </FilterChip>
          {byJob.map((j) => (
            <FilterChip
              key={j.id || 'none'}
              active={jobFilter === j.id}
              onClick={() => setJobFilter(j.id || 'all')}
            >
              {j.name} · {j.count}
            </FilterChip>
          ))}
        </div>

        <div className="ty-card divide-y divide-steel-700">
          {filtered.map((p) => (
            <PullRow key={p.id} pull={p} />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="ty-card p-5">
          <div className="text-xs font-stencil uppercase tracking-widest text-steel-500 mb-3">
            Billing by job
          </div>
          <div className="space-y-3">
            {byJob.map((j) => (
              <div
                key={j.id || 'none'}
                className="flex items-baseline justify-between gap-3 pb-3 border-b border-steel-700 last:border-0 last:pb-0"
              >
                <div className="min-w-0">
                  <div className="text-sm text-steel-100 truncate">{j.name}</div>
                  <div className="text-[10px] uppercase tracking-wider text-steel-500">
                    {j.count} pull{j.count === 1 ? '' : 's'}
                  </div>
                </div>
                <span className="font-stencil text-base text-safety shrink-0">
                  {money(j.total)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t-2 border-steel-700 flex items-baseline justify-between">
            <span className="text-xs font-stencil uppercase tracking-widest text-steel-400">
              Total billed
            </span>
            <span className="font-stencil text-2xl text-safety">
              {money(byJob.reduce((s, j) => s + j.total, 0))}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function PullRow({ pull }) {
  const when = pull.pulledAt ? new Date(pull.pulledAt) : null
  return (
    <div className="p-4 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-stencil text-sm uppercase tracking-wide text-steel-100 truncate">
            {pull.materialName}
          </span>
          <span className="text-xs text-steel-500">×</span>
          <span className="font-stencil text-sm text-safety">
            {pull.qty} {pull.unit}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-steel-400 mb-1 min-w-0">
          <Briefcase className="w-3 h-3 text-steel-500 shrink-0" />
          <span className="truncate">{pull.jobName || '— No job —'}</span>
        </div>
        <div className="text-[10px] uppercase tracking-wider text-steel-500">
          {when ? when.toLocaleString() : ''}
          {pull.pulledBy ? ` · ${pull.pulledBy}` : ''}
        </div>
        {pull.note && (
          <div className="text-xs text-steel-500 italic mt-1">{pull.note}</div>
        )}
      </div>
      <div className="text-right shrink-0">
        <div className="font-stencil text-base text-steel-100">
          {money(pull.totalCost)}
        </div>
        <div className="text-[10px] uppercase tracking-wider text-steel-500">
          {money(pull.costPerUnit)}/{pull.unit}
        </div>
        <button
          onClick={() => {
            if (
              confirm(
                `Remove this pull from history? This will NOT restore inventory.`
              )
            ) {
              cribPulls.remove(pull.id)
            }
          }}
          className="mt-2 p-1 text-steel-500 hover:text-red-400"
          title="Remove from history"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// ---------- Shared primitives ----------

function TabButton({ active, onClick, Icon, label, count, badge }) {
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
      {badge && (
        <span className="text-[10px] px-1.5 py-0.5 bg-caution text-steel-900 font-stencil">
          {badge} low
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
          .ty-input:disabled { background-color: #1a1e24; }
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
