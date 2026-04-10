import { Link, useLocation } from 'react-router-dom'
import { Wrench, ArrowLeft } from 'lucide-react'

/**
 * Shared layout shell used by every page in Tool Yard.
 * - Header with Tool Yard wordmark + nav
 * - Hazard-stripe accent bar
 * - Footer with version/tagline
 */
export default function Shell({ children, toolName, toolAccent = 'safety' }) {
  const location = useLocation()
  const atRoot = location.pathname === '/'

  return (
    <div className="min-h-full flex flex-col bg-steel-900 bg-steel-textured">
      {/* Hazard accent bar */}
      <div className="h-2 bg-hazard-stripe" />

      {/* Header */}
      <header className="border-b-2 border-steel-700 bg-steel-950/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-safety flex items-center justify-center border-2 border-steel-100 shadow-hard group-hover:translate-x-[-1px] group-hover:translate-y-[-1px] transition-transform">
              <Wrench className="w-5 h-5 text-steel-900" strokeWidth={3} />
            </div>
            <div className="leading-none">
              <div className="font-stencil text-2xl tracking-wider text-steel-100 uppercase">
                Tool<span className="text-safety">·</span>Yard
              </div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-steel-400 mt-0.5">
                Construction Manager's Toolbox
              </div>
            </div>
          </Link>

          {!atRoot && (
            <Link
              to="/"
              className="flex items-center gap-2 text-sm font-stencil uppercase tracking-wider text-steel-300 hover:text-safety transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Yard
            </Link>
          )}
        </div>

        {/* Tool breadcrumb strip */}
        {toolName && (
          <div className="border-t border-steel-800 bg-steel-900/60">
            <div className="max-w-6xl mx-auto px-6 py-2 flex items-center gap-3">
              <span className="text-xs font-stencil uppercase tracking-widest text-steel-500">
                Currently using:
              </span>
              <span
                className={`font-stencil uppercase tracking-wider text-sm ${
                  toolAccent === 'caution' ? 'text-caution' : 'text-safety'
                }`}
              >
                {toolName}
              </span>
            </div>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t-2 border-steel-700 bg-steel-950 mt-16">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between text-xs text-steel-500 font-stencil uppercase tracking-widest">
          <span>Tool Yard · v0.1</span>
          <span>Built for the jobsite.</span>
        </div>
        <div className="h-1 bg-hazard-stripe" />
      </footer>
    </div>
  )
}
