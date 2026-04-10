import { jobs as jobsCollection } from '../data/collections.js'
import { Link } from 'react-router-dom'
import { Briefcase, AlertCircle } from 'lucide-react'

/**
 * Shared Job selector used by any tool that needs to pick a job.
 *
 * Props:
 *   value           — currently selected job id, or '' for none
 *   onChange(id)    — called with the new id (or '' for cleared)
 *   includeNone     — show a "— No job —" option (default true)
 *   noneLabel       — label for the none option
 *   activeOnly      — if true, only show jobs with status 'active'
 *   disabled        — disable the select
 */
export default function JobPicker({
  value = '',
  onChange,
  includeNone = true,
  noneLabel = '— No job —',
  activeOnly = false,
  disabled = false,
}) {
  const all = jobsCollection.useAll()
  const visible = activeOnly ? all.filter((j) => j.status === 'active') : all

  if (all.length === 0) {
    return (
      <div className="flex items-center gap-2 p-3 bg-steel-900 border-2 border-steel-700 text-sm">
        <AlertCircle className="w-4 h-4 text-caution shrink-0" />
        <span className="text-steel-400">
          No jobs yet.{' '}
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
      <Briefcase className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-steel-500 pointer-events-none" />
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange && onChange(e.target.value)}
        className="w-full pl-10 pr-4 py-2.5 bg-steel-900 border-2 border-steel-700 text-steel-100 focus:outline-none focus:border-safety disabled:opacity-50 appearance-none cursor-pointer"
      >
        {includeNone && <option value="">{noneLabel}</option>}
        {visible.map((j) => (
          <option key={j.id} value={j.id}>
            {j.name}
            {j.status !== 'active' ? ` (${j.status.replace('_', ' ')})` : ''}
          </option>
        ))}
      </select>
    </div>
  )
}

/** Read-only display for a job id. Resolves via the live jobs collection. */
export function JobLabel({ id, fallback = '—' }) {
  const job = jobsCollection.useOne(id)
  if (!job) return <span className="text-steel-500">{fallback}</span>
  return (
    <span className="inline-flex items-center gap-1.5">
      <Briefcase className="w-3.5 h-3.5 text-steel-500" />
      <span>{job.name}</span>
    </span>
  )
}
