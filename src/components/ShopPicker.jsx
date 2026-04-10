import { shops as shopsCollection } from '../data/collections.js'
import { Link } from 'react-router-dom'
import { Building2, AlertCircle } from 'lucide-react'

/**
 * Shared Shop selector. Same API as JobPicker.
 */
export default function ShopPicker({
  value = '',
  onChange,
  includeNone = true,
  noneLabel = '— No shop —',
  disabled = false,
}) {
  const all = shopsCollection.useAll()

  if (all.length === 0) {
    return (
      <div className="flex items-center gap-2 p-3 bg-steel-900 border-2 border-steel-700 text-sm">
        <AlertCircle className="w-4 h-4 text-caution shrink-0" />
        <span className="text-steel-400">
          No shops yet.{' '}
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
      <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-steel-500 pointer-events-none" />
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange && onChange(e.target.value)}
        className="w-full pl-10 pr-4 py-2.5 bg-steel-900 border-2 border-steel-700 text-steel-100 focus:outline-none focus:border-safety disabled:opacity-50 appearance-none cursor-pointer"
      >
        {includeNone && <option value="">{noneLabel}</option>}
        {all.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
    </div>
  )
}

export function ShopLabel({ id, fallback = '—' }) {
  const shop = shopsCollection.useOne(id)
  if (!shop) return <span className="text-steel-500">{fallback}</span>
  return (
    <span className="inline-flex items-center gap-1.5">
      <Building2 className="w-3.5 h-3.5 text-steel-500" />
      <span>{shop.name}</span>
    </span>
  )
}
