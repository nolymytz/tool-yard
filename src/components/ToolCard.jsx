import { Link } from 'react-router-dom'
import { ArrowUpRight, Lock } from 'lucide-react'

const statusStyles = {
  live: {
    label: 'Live',
    cls: 'bg-safety text-steel-900 border-safety',
  },
  beta: {
    label: 'Beta',
    cls: 'bg-caution text-steel-900 border-caution',
  },
  soon: {
    label: 'Coming soon',
    cls: 'bg-steel-800 text-steel-400 border-steel-600',
  },
}

export default function ToolCard({ tool }) {
  const Icon = tool.icon
  const status = statusStyles[tool.status] || statusStyles.soon
  const isLive = tool.status === 'live'

  const inner = (
    <div className="ty-card p-6 h-full flex flex-col justify-between group">
      {/* Top row: icon + status chip */}
      <div className="flex items-start justify-between mb-6">
        <div
          className={`w-14 h-14 flex items-center justify-center border-2 ${
            isLive
              ? 'bg-safety border-safety text-steel-900'
              : 'bg-steel-900 border-steel-700 text-steel-400 group-hover:border-safety group-hover:text-safety'
          } transition-colors`}
        >
          <Icon className="w-7 h-7" strokeWidth={2.5} />
        </div>
        <span
          className={`text-[10px] font-stencil uppercase tracking-widest px-2 py-1 border ${status.cls}`}
        >
          {status.label}
        </span>
      </div>

      {/* Body */}
      <div className="flex-1">
        <h3 className="font-stencil text-2xl uppercase tracking-wide text-steel-100 mb-1">
          {tool.name}
        </h3>
        <p className="text-safety text-sm font-medium mb-3">{tool.tagline}</p>
        <p className="text-steel-400 text-sm leading-relaxed">
          {tool.description}
        </p>
      </div>

      {/* CTA row */}
      <div className="mt-6 pt-4 border-t border-steel-700 flex items-center justify-between">
        <span className="text-xs font-stencil uppercase tracking-widest text-steel-500">
          {isLive ? 'Open tool' : 'Not yet available'}
        </span>
        {isLive ? (
          <ArrowUpRight
            className="w-5 h-5 text-safety group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"
            strokeWidth={3}
          />
        ) : (
          <Lock className="w-4 h-4 text-steel-600" strokeWidth={2.5} />
        )}
      </div>
    </div>
  )

  if (isLive) {
    return (
      <Link to={`/tools/${tool.slug}`} className="block h-full">
        {inner}
      </Link>
    )
  }
  return <div className="h-full opacity-80 cursor-not-allowed">{inner}</div>
}
