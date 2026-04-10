import { Link } from 'react-router-dom'
import { HardHat, ArrowLeft } from 'lucide-react'

/**
 * Shared "Coming Soon" scaffold used by placeholder tools.
 * Each placeholder tool component passes in its name/tagline/plan bullets,
 * so replacing it with a real implementation later is just swapping the file.
 */
export default function ComingSoon({ name, tagline, plan = [], Icon = HardHat }) {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <div className="ty-card p-10">
        {/* Hazard ribbon */}
        <div className="h-2 bg-hazard-stripe -mx-10 -mt-10 mb-8" />

        <div className="flex items-start gap-5 mb-6">
          <div className="w-16 h-16 bg-steel-900 border-2 border-caution flex items-center justify-center shrink-0">
            <Icon className="w-8 h-8 text-caution" strokeWidth={2.5} />
          </div>
          <div>
            <div className="font-stencil text-xs uppercase tracking-[0.25em] text-caution mb-1">
              Under construction
            </div>
            <h1 className="font-stencil text-4xl uppercase text-steel-100 leading-tight">
              {name}
            </h1>
            <p className="text-safety text-base mt-1">{tagline}</p>
          </div>
        </div>

        <p className="text-steel-400 mb-6 leading-relaxed">
          This tool is in the fabrication shop. Here's what's planned for the
          first release:
        </p>

        <ul className="space-y-2 mb-8">
          {plan.map((p, i) => (
            <li
              key={i}
              className="flex gap-3 text-steel-300 text-sm border-l-2 border-steel-700 pl-4 py-1"
            >
              <span className="text-safety font-stencil text-xs pt-0.5">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span>{p}</span>
            </li>
          ))}
        </ul>

        <Link to="/" className="ty-btn">
          <ArrowLeft className="w-4 h-4" />
          Back to the Yard
        </Link>
      </div>
    </div>
  )
}
