import { customers as customersCollection } from '../data/collections.js'
import { Link } from 'react-router-dom'
import { User, AlertCircle } from 'lucide-react'

/**
 * Shared customer selector used by Quotes and Change Orders.
 *
 * Props:
 *   value         — selected customer id, or '' for none
 *   onChange(id)  — called with the new id
 *   includeNone   — show a "— No customer —" option (default true)
 *   noneLabel     — label for the none option
 *   disabled      — disable the select
 */
export default function CustomerPicker({
  value = '',
  onChange,
  includeNone = true,
  noneLabel = '— Pick a customer —',
  disabled = false,
}) {
  const all = customersCollection.useAll()

  if (all.length === 0) {
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

  return (
    <div className="relative">
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
