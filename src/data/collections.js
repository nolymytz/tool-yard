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

// --- Customers ---
// A customer is the party a quote or change order is billed to. Jobs can
// optionally reference a customer by id; quotes and change orders always do.
export const customers = createCollection('customers', [
  {
    name: 'The Whitlocks',
    contactName: 'Sarah Whitlock',
    email: 'sarah.whitlock@example.com',
    phone: '(555) 555-0142',
    address: '1124 Maple Ave',
    address2: '',
    city: 'Cedar Falls',
    state: 'IA',
    zip: '50613',
    notes: '',
  },
  {
    name: 'Ember Coffee Co.',
    contactName: 'Miguel Ortega',
    email: 'miguel@embercoffee.co',
    phone: '(555) 555-0187',
    address: '88 S Main St',
    address2: 'Suite 2',
    city: 'Cedar Falls',
    state: 'IA',
    zip: '50613',
    notes: 'Downtown cafe buildout client.',
  },
])

/**
 * Format a customer's address for display or snapshotting.
 * Returns either an array of non-empty lines (for multi-line display) or a
 * single joined string. Accepts partial records so old saved customers that
 * only have `address` still render cleanly.
 */
export function customerAddressLines(customer) {
  if (!customer) return []
  const line1 = (customer.address || '').trim()
  const line2 = (customer.address2 || '').trim()
  const city = (customer.city || '').trim()
  const state = (customer.state || '').trim()
  const zip = (customer.zip || '').trim()
  const cityLine = [city, [state, zip].filter(Boolean).join(' ').trim()]
    .filter(Boolean)
    .join(', ')
  return [line1, line2, cityLine].filter(Boolean)
}

export function customerAddressOneLine(customer) {
  return customerAddressLines(customer).join(', ')
}

// --- Service Catalog ---
// A reusable list of priced line items that Quotes and Change Orders can
// drop into a document with one click. Rates are stored per-unit; the
// quote/CO line item snapshots description + rate at the moment of use so
// later edits to the catalog don't retroactively change old documents.
export const SERVICE_UNITS = [
  'hour',
  'day',
  'each',
  'sq ft',
  'linear ft',
  'cu yd',
  'lump sum',
]

export const services = createCollection('services', [
  { name: 'General Labor',         description: 'Skilled construction labor',         unit: 'hour',      rate: 85 },
  { name: 'Lead Carpenter',        description: 'Lead carpenter on-site',             unit: 'hour',      rate: 125 },
  { name: 'Project Management',    description: 'PM / site supervision',              unit: 'hour',      rate: 110 },
  { name: 'Interior Demolition',   description: 'Demo and haul-away',                 unit: 'hour',      rate: 95 },
  { name: 'Drywall Hang & Finish', description: 'Hang, tape, mud, sand',              unit: 'sq ft',     rate: 3.75 },
  { name: 'Interior Paint',        description: 'Two coats, minor prep',              unit: 'sq ft',     rate: 2.50 },
  { name: 'Trim & Baseboard',      description: 'Install paint-grade trim',           unit: 'linear ft', rate: 6 },
  { name: 'Interior Door Install', description: 'Hang pre-hung interior door',        unit: 'each',      rate: 275 },
])

// --- Quotes ---
// A quote is a priced proposal issued to a customer, optionally linked to a
// job. Status moves from draft → sent → accepted/declined.
export const QUOTE_STATUSES = [
  { key: 'draft',    label: 'Draft' },
  { key: 'sent',     label: 'Sent' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'declined', label: 'Declined' },
]

export const quotes = createCollection('quotes', [])

// --- Change Orders ---
// A change order is a priced addition to an already-running job. Change
// orders are ALWAYS tied to a job id, and roll up into per-job totals so
// the user can see original quote + approved COs per project.
export const CHANGE_ORDER_STATUSES = [
  { key: 'draft',    label: 'Draft' },
  { key: 'sent',     label: 'Sent' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
]

export const changeOrders = createCollection('changeOrders', [])
