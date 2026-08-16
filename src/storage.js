// Deliberately outside the `_x_` namespace: probing writes and then removes the
// key, so anything a component could persist there would be destroyed before it
// was ever restored.
const PROBE_KEY = '__x_persist_extended_probe'

export function resolveDefaultStorage() {
  try {
    localStorage.setItem(PROBE_KEY, PROBE_KEY)
    localStorage.removeItem(PROBE_KEY)

    return localStorage
  } catch {
    console.warn(
      'alpinejs-persist-extended: localStorage is unavailable, falling back to in-memory storage for this page load.'
    )

    return createMemoryStorage()
  }
}

// `$persist` falls back to a Map exposing only getItem/setItem. Deleting and
// sweeping need removeItem, key and length too.
export function createMemoryStorage() {
  const memoryStore = new Map()

  // `key()` is called once per index by `listPersistedKeys`, so the key list is
  // materialised once per mutation rather than once per lookup.
  let cachedKeys = null
  const storedKeys = () => (cachedKeys ??= [...memoryStore.keys()])

  return {
    getItem: (itemKey) =>
      memoryStore.has(itemKey) ? memoryStore.get(itemKey) : null,
    setItem: (itemKey, itemValue) => {
      memoryStore.set(itemKey, String(itemValue))
      cachedKeys = null
    },
    removeItem: (itemKey) => {
      memoryStore.delete(itemKey)
      cachedKeys = null
    },
    key: (itemIndex) => storedKeys()[itemIndex] ?? null,
    get length() {
      return memoryStore.size
    },
  }
}
