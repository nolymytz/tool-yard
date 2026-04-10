// Shared collections used across Tool Yard tools.
// Every tool that needs to read or write shops, jobs, materials, or crib
// pulls should import from this file — never touch store.js directly.

import { createCollection } from './store.js'

// --- Shops / Offices ---
// A shop is a physical location where tools and materials are stocked.
// Most small outfits will have one; we model it as a list for future-proofing.
export const shops = createCollection('shops', [
  { name: 'Main Shop', address: '', notes: '' },
])

// --- Jobs ---
// Jobs are active, on-hold, or complete projects. Tools reference jobs by id
// and snapshot job.name at write time so history stays intact if a job is
// renamed or deleted later.
export const JOB_STATUSES = [
  { key: 'active', label: 'Active' },
  { key: 'on_hold', label: 'On Hold' },
  { key: 'complete', label: 'Complete' },
]

export const jobs = createCollection('jobs', [
  {
    name: 'Maple Ave Residence',
    address: '1124 Maple Ave',
    client: 'The Whitlocks',
    poNumber: 'PO-2026-041',
    status: 'active',
    startDate: '2026-03-01',
  },
  {
    name: 'Downtown Cafe Buildout',
    address: '88 S Main St, Suite 2',
    client: 'Ember Coffee Co.',
    poNumber: 'PO-2026-052',
    status: 'active',
    startDate: '2026-03-20',
  },
])

// --- Crib Materials ---
// Materials stocked at a shop. `onHand` is the current quantity, `lowStock`
// is the threshold below which the material should be flagged as running low.
// `costPerUnit` is used to compute billing totals per job.
export const MATERIAL_CATEGORIES = [
  'Fasteners',
  'Lumber',
  'Hardware',
  'Adhesives & Sealants',
  'Abrasives',
  'Electrical',
  'Plumbing',
  'Consumables',
  'Safety',
  'Other',
]

export const MATERIAL_UNITS = [
  'each', 'box', 'case', 'bag', 'pack',
  'lb', 'oz', 'kg',
  'ft', 'yd', 'm', 'roll',
  'gal', 'qt', 'tube', 'bottle',
]

export const materials = createCollection('crib.materials', [
  {
    name: '16d Framing Nails',
    category: 'Fasteners',
    unit: 'lb',
    onHand: 42,
    lowStock: 15,
    costPerUnit: 2.85,
    shopId: null, // linked at runtime if a shop exists
    notes: '',
  },
  {
    name: 'Cedar Shims (14-pack)',
    category: 'Consumables',
    unit: 'pack',
    onHand: 22,
    lowStock: 8,
    costPerUnit: 3.75,
    shopId: null,
    notes: '',
  },
  {
    name: '2x4x8 SPF Studs',
    category: 'Lumber',
    unit: 'each',
    onHand: 58,
    lowStock: 25,
    costPerUnit: 4.12,
    shopId: null,
    notes: '',
  },
  {
    name: 'Painters Tape 1.5"',
    category: 'Consumables',
    unit: 'roll',
    onHand: 6,
    lowStock: 10, // already below — demonstrates low-stock badge on first open
    costPerUnit: 5.40,
    shopId: null,
    notes: '',
  },
])

// --- Crib Pulls (transaction log) ---
// A pull is a single withdrawal of a material for a job. Pulls are
// append-mostly; we keep snapshots of material name, unit, cost, and job
// name so the history survives later edits or deletes.
export const cribPulls = createCollection('crib.pulls', [])
