// Minimal reactive, localStorage-backed collection store.
//
// createCollection(key, seed) returns a collection API with CRUD methods
// plus React hooks (useAll, useOne) wired through useSyncExternalStore, so
// any component that reads from the store re-renders when the data changes.
//
// Each collection namespaces its own localStorage key under `toolyard.<key>.v1`
// so collections can be migrated independently.

import { useSyncExternalStore } from 'react'

const PREFIX = 'toolyard'
const VERSION = 'v1'

function storageKey(name) {
  return `${PREFIX}.${name}.${VERSION}`
}

function load(name, fallback) {
  try {
    const raw = localStorage.getItem(storageKey(name))
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : fallback
  } catch {
    return fallback
  }
}

function save(name, items) {
  try {
    localStorage.setItem(storageKey(name), JSON.stringify(items))
  } catch {
    // Quota exceeded or private mode — silently ignore
  }
}

function uid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function createCollection(name, seed = []) {
  let items = load(name, null)
  if (items === null) {
    items = seed.map((s) => ({ id: uid(), createdAt: Date.now(), ...s }))
    save(name, items)
  }

  const subscribers = new Set()

  function notify() {
    save(name, items)
    subscribers.forEach((fn) => fn())
  }

  function subscribe(fn) {
    subscribers.add(fn)
    return () => subscribers.delete(fn)
  }

  function getAll() {
    return items
  }

  function getOne(id) {
    return items.find((it) => it.id === id) || null
  }

  function add(partial) {
    const item = { id: uid(), createdAt: Date.now(), ...partial }
    items = [item, ...items]
    notify()
    return item
  }

  function update(id, patch) {
    items = items.map((it) => (it.id === id ? { ...it, ...patch } : it))
    notify()
  }

  function remove(id) {
    items = items.filter((it) => it.id !== id)
    notify()
  }

  function upsert(item) {
    if (item.id && items.some((it) => it.id === item.id)) {
      update(item.id, item)
      return getOne(item.id)
    }
    return add(item)
  }

  function replaceAll(next) {
    items = Array.isArray(next) ? next : []
    notify()
  }

  // React hook: subscribe to the whole list
  function useAll() {
    return useSyncExternalStore(subscribe, getAll, getAll)
  }

  // React hook: subscribe to a single item by id
  function useOne(id) {
    return useSyncExternalStore(
      subscribe,
      () => items.find((it) => it.id === id) || null,
      () => items.find((it) => it.id === id) || null
    )
  }

  return {
    name,
    getAll,
    getOne,
    add,
    update,
    remove,
    upsert,
    replaceAll,
    useAll,
    useOne,
  }
}

export { uid }
