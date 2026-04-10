// Shared helpers used by QuickQuote and Change Orders.

export function money(n) {
  return (Number(n) || 0).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  })
}

export function todayIso() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function addDaysIso(iso, days) {
  const d = iso ? new Date(iso + 'T00:00:00') : new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export function lineTotal(item) {
  return (Number(item.quantity) || 0) * (Number(item.rate) || 0)
}

export function computeTotals(items, taxRate) {
  const subtotal = items.reduce((s, it) => s + lineTotal(it), 0)
  const tax = subtotal * ((Number(taxRate) || 0) / 100)
  const total = subtotal + tax
  return { subtotal, tax, total }
}

/**
 * Generate the next sequential document number for a given prefix.
 * Scans existing documents for `${prefix}-${year}-${NNN}` and returns the
 * next one, padded to 3 digits. e.g. nextDocNumber('Q', quotes) → 'Q-2026-004'
 */
export function nextDocNumber(prefix, existing) {
  const year = new Date().getFullYear()
  const pattern = new RegExp(`^${prefix}-${year}-(\\d+)$`)
  let max = 0
  for (const item of existing) {
    const m = (item.number || '').match(pattern)
    if (m) max = Math.max(max, parseInt(m[1], 10))
  }
  return `${prefix}-${year}-${String(max + 1).padStart(3, '0')}`
}

/** A fresh empty line item. */
export function blankLineItem() {
  return {
    id:
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2),
    description: '',
    quantity: 1,
    unit: 'each',
    rate: 0,
  }
}

/**
 * Open the browser print dialog. Expects the printable content to already
 * be in the DOM with class `ty-print-root` and the app's @media print CSS
 * to hide everything else.
 */
export function printNow() {
  // Brief timeout ensures React has committed any state changes that
  // triggered the print view to render.
  setTimeout(() => window.print(), 50)
}

/**
 * Build a mailto: URL for sending a document to a customer.
 */
export function buildMailtoUrl({ to, subject, body }) {
  const params = []
  if (subject) params.push(`subject=${encodeURIComponent(subject)}`)
  if (body) params.push(`body=${encodeURIComponent(body)}`)
  const qs = params.length ? `?${params.join('&')}` : ''
  return `mailto:${to || ''}${qs}`
}
