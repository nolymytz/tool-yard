import { tools } from '../tools/registry.js'
import ToolCard from '../components/ToolCard.jsx'
import { Hammer, ShieldCheck, Zap } from 'lucide-react'

export default function Landing() {
  const liveCount = tools.filter((t) => t.status === 'live').length
  const comingCount = tools.filter((t) => t.status === 'soon').length

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden border-b-2 border-steel-700">
        {/* Diagonal safety stripes running behind the hero text */}
        <div className="absolute inset-0 opacity-[0.04] bg-safety-stripe pointer-events-none" />
        <div className="max-w-6xl mx-auto px-6 pt-20 pb-24 relative">
          <div className="inline-flex items-center gap-2 border-2 border-safety px-3 py-1 mb-6">
            <span className="w-2 h-2 bg-safety animate-pulse" />
            <span className="font-stencil text-xs uppercase tracking-[0.2em] text-safety">
              Now open · {liveCount} tool{liveCount === 1 ? '' : 's'} live,{' '}
              {comingCount} in fabrication
            </span>
          </div>

          <h1 className="font-stencil text-6xl md:text-8xl uppercase tracking-tight leading-[0.9] text-steel-100 mb-6">
            The Construction
            <br />
            Manager's{' '}
            <span className="text-safety">Toolbox</span>
          </h1>

          <p className="text-xl text-steel-300 max-w-2xl mb-10 leading-relaxed">
            Tool Yard is a collection of focused micro apps for people who
            actually run jobsites. No bloated suite. No six-month rollout. Just
            sharp tools that do one thing well.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <a href="#tools" className="ty-btn-safety">
              Browse the Yard
            </a>
            <a href="#why" className="ty-btn">
              Why Tool Yard
            </a>
          </div>
        </div>

        {/* Bottom hazard rail */}
        <div className="h-1.5 bg-hazard-stripe" />
      </section>

      {/* TOOL GRID */}
      <section id="tools" className="max-w-6xl mx-auto px-6 py-16">
        <div className="flex items-end justify-between mb-8 border-b-2 border-steel-700 pb-4">
          <div>
            <div className="font-stencil text-xs uppercase tracking-[0.25em] text-safety mb-1">
              The Yard
            </div>
            <h2 className="font-stencil text-4xl uppercase text-steel-100">
              Pick a tool
            </h2>
          </div>
          <span className="text-sm text-steel-500 hidden sm:block">
            {tools.length} tools in the collection
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      </section>

      {/* WHY SECTION */}
      <section id="why" className="border-t-2 border-steel-700 bg-steel-950/60">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="font-stencil text-xs uppercase tracking-[0.25em] text-safety mb-2">
            Built different
          </div>
          <h2 className="font-stencil text-4xl uppercase text-steel-100 mb-12">
            Why Tool Yard
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            <WhyCard
              Icon={Hammer}
              title="One job per tool"
              body="Every app in the yard does exactly one thing. No feature bloat, no learning a new 'platform' just to log crew hours."
            />
            <WhyCard
              Icon={Zap}
              title="Fast on any device"
              body="Designed for a phone in a muddy glove. Big buttons, few taps, works on the crew's cheap Android."
            />
            <WhyCard
              Icon={ShieldCheck}
              title="Your data, your yard"
              body="Nothing you enter leaves your device unless you ship it. Own your files, your lists, and your history."
            />
          </div>
        </div>
      </section>
    </>
  )
}

function WhyCard({ Icon, title, body }) {
  return (
    <div className="ty-card p-6">
      <div className="w-12 h-12 flex items-center justify-center border-2 border-safety text-safety mb-4">
        <Icon className="w-6 h-6" strokeWidth={2.5} />
      </div>
      <h3 className="font-stencil text-xl uppercase tracking-wide text-steel-100 mb-2">
        {title}
      </h3>
      <p className="text-steel-400 text-sm leading-relaxed">{body}</p>
    </div>
  )
}
