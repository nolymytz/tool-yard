# Tool Yard

**The construction manager's toolbox.** A monorepo of focused micro apps for people who run jobsites — no bloated suite, no six-month rollout, just sharp tools that do one thing well.

## What's in the yard

| Tool | Slug | Status | Purpose |
|---|---|---|---|
| EquipTrack | `equiptrack` | Live | Track equipment across jobsites — status, location, operator, service history |
| Punch Pro | `punchlist` | Coming soon | Punch lists, inspections, QA walkthroughs |
| Daily Drift | `dailylogs` | Coming soon | Crew hours, weather, deliveries, daily logs |
| Submittal Shed | `submittals` | Coming soon | Submittals, RFIs, change orders |
| BidBoard | `bids` | Coming soon | Bid tracking, estimates, material takeoffs |

## Architecture

Tool Yard uses a **shared-shell monorepo** pattern:

- A single Vite + React + Tailwind app
- One shared `Shell` (header, footer, nav, branding) wraps every tool
- Tools live in `src/tools/<slug>/` and are registered in `src/tools/registry.js`
- Adding a new tool = create a component, add one entry to the registry — it automatically gets a route and a card on the landing grid

```
tool-yard/
├── index.html
├── package.json
├── tailwind.config.js         ← rugged/industrial color palette (steel, safety orange, caution yellow)
├── vite.config.js
└── src/
    ├── main.jsx
    ├── App.jsx                ← router + shell wiring
    ├── index.css              ← shared component classes (.ty-btn, .ty-card, …)
    ├── components/
    │   ├── Shell.jsx          ← header, footer, hazard stripes, back-to-yard nav
    │   └── ToolCard.jsx       ← card rendered on the landing grid
    ├── pages/
    │   └── Landing.jsx        ← hero + tool grid + why section
    └── tools/
        ├── registry.js        ← ⭐ add new tools here
        ├── ComingSoon.jsx     ← shared scaffold for placeholder tools
        ├── equiptrack/EquipTrack.jsx
        ├── punchlist/PunchList.jsx
        ├── dailylogs/DailyLogs.jsx
        ├── submittals/Submittals.jsx
        └── bids/Bids.jsx
```

## Running locally

```bash
cd tool-yard
npm install
npm run dev
```

Vite will start on http://localhost:5174 (5173 is left for the original EquipTrack project so you can run both side-by-side).

## Adding a new micro app

1. Create `src/tools/<slug>/<ComponentName>.jsx`
2. Import it and add an entry to `src/tools/registry.js`:
   ```js
   {
     slug: 'myapp',
     name: 'My App',
     tagline: 'What it does in 5 words.',
     description: 'One sentence longer description.',
     icon: SomeLucideIcon,
     status: 'soon',    // 'live' | 'beta' | 'soon'
     accent: 'safety',  // 'safety' | 'caution'
     component: MyApp,
   }
   ```
3. That's it — it now appears on the landing grid and is routable at `/tools/myapp`.

## Design language

- **Type**: Oswald (display) + Inter (body)
- **Palette**: Steel grays (`#0d1014` → `#e4e6e9`), Safety orange (`#FF6B1A`), Caution yellow (`#FACC15`)
- **Motifs**: Hazard stripes, hard shadows, chunky 2px borders, stencil uppercase headings
- **Voice**: Direct, crew-friendly. "Walk it. List it. Close it." not "Streamline your quality assurance workflow."

## Data & persistence

Each tool manages its own storage. EquipTrack uses `localStorage` under the key `toolyard.equiptrack.v1`. Future tools should namespace their own keys (`toolyard.<slug>.v1`) so they can be migrated independently.

## Notes on the original EquipTrack project

The original EquipTrack lives in the sibling folder `equiptrack-project/` and continues to run independently. The version of EquipTrack inside Tool Yard is a fresh implementation designed to match the shared shell — they share a name and intent but not code. Once you're happy with the Tool Yard version, the standalone project can be retired.
