// The official @alpinejs/persist plugin keys storage as `alias || '_x_' + path`
// and stores `JSON.stringify(value)`. Everything here reads and writes that
// exact format, so a key can be shared with `$persist` without translation.
const KEY_PREFIX = '_x_'

// Expiry lives in a sidecar key rather than wrapping the value, so the value
// key stays byte-identical to what `$persist` writes. Wrapping would make
// `{ v, e }` user data indistinguishable from an envelope.
const EXPIRES_SUFFIX = '__x_expires'

const DURATION_PATTERN = /^(\d+(?:\.\d+)?)(ms|s|m|h|d|w)$/i
const DURATION_UNITS = {
  ms: 1,
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
  w: 7 * 24 * 60 * 60 * 1000,
}

export default function (Alpine) {
  const defaultStorage = resolveDefaultStorage()

  function readPersistedValue(
    persistKey,
    fallbackValue,
    { storage: storageTarget = defaultStorage } = {}
  ) {
    const lookupKey = resolveLookupKey(storageTarget, persistKey)
    const rawValue = storageTarget.getItem(lookupKey)

    if (rawValue === null) {
      return fallbackValue
    }

    // Expiry is evaluated on read, never on a timer, so an expired key is
    // swept the first time anything asks for it.
    if (hasExpired(storageTarget, lookupKey)) {
      removeStoredEntry(storageTarget, lookupKey)

      return fallbackValue
    }

    return parseStoredValue(rawValue)
  }

  function writePersistedValue(
    sourceEl,
    persistKey,
    persistValue,
    { ttl: ttlValue, storage: storageTarget = defaultStorage } = {}
  ) {
    const lookupKey = resolveLookupKey(storageTarget, persistKey)

    // Resolved before the first write: a bad duration must not leave the value
    // persisted with no expiry, which is the opposite of what was asked for.
    const expiresAt =
      ttlValue === undefined ? null : Date.now() + parseDuration(ttlValue)

    storageTarget.setItem(lookupKey, JSON.stringify(persistValue))

    if (expiresAt === null) {
      storageTarget.removeItem(`${lookupKey}${EXPIRES_SUFFIX}`)
    } else {
      storageTarget.setItem(`${lookupKey}${EXPIRES_SUFFIX}`, String(expiresAt))
    }

    dispatchPersistEvent(sourceEl, 'set', {
      key: lookupKey,
      value: persistValue,
    })

    return persistValue
  }

  function deletePersistedValue(
    sourceEl,
    persistKey,
    { storage: storageTarget = defaultStorage } = {}
  ) {
    const lookupKey = resolveLookupKey(storageTarget, persistKey)
    const didExist = storageTarget.getItem(lookupKey) !== null

    removeStoredEntry(storageTarget, lookupKey)

    dispatchPersistEvent(sourceEl, 'delete', {
      key: lookupKey,
      existed: didExist,
    })

    return didExist
  }

  function clearPersistedValues(
    sourceEl,
    { prefix: prefixFilter = '', storage: storageTarget = defaultStorage } = {}
  ) {
    const targetPrefix = `${KEY_PREFIX}${prefixFilter}`
    const clearedKeys = listPersistedKeys(storageTarget).filter((itemKey) =>
      itemKey.startsWith(targetPrefix)
    )

    clearedKeys.forEach((itemKey) => removeStoredEntry(storageTarget, itemKey))

    dispatchPersistEvent(sourceEl, 'clear', { keys: clearedKeys })

    return clearedKeys
  }

  const expiringMagic = () => createExpiringInterceptor(Alpine, defaultStorage)

  Alpine.magic('persistExpire', expiringMagic)
  Alpine.magic('persistGet', () => readPersistedValue)
  Alpine.magic(
    'persistSet',
    (sourceEl) =>
      (...helperArgs) =>
        writePersistedValue(sourceEl, ...helperArgs)
  )
  Alpine.magic(
    'persistDelete',
    (sourceEl) =>
      (...helperArgs) =>
        deletePersistedValue(sourceEl, ...helperArgs)
  )
  Alpine.magic(
    'persistClear',
    (sourceEl) =>
      (...helperArgs) =>
        clearPersistedValues(sourceEl, ...helperArgs)
  )

  // Mirrors `Alpine.$persist` so the interceptor works inside `Alpine.store`,
  // and exposes the imperative helpers to plain scripts. Events from these
  // dispatch off the root element, which still reaches `.window` listeners.
  Object.defineProperty(Alpine, '$persistExpire', { get: expiringMagic })

  Alpine.persistGet = readPersistedValue
  Alpine.persistSet = (...helperArgs) =>
    writePersistedValue(getRootElement(), ...helperArgs)
  Alpine.persistDelete = (...helperArgs) =>
    deletePersistedValue(getRootElement(), ...helperArgs)
  Alpine.persistClear = (...helperArgs) =>
    clearPersistedValues(getRootElement(), ...helperArgs)
}

function createExpiringInterceptor(Alpine, defaultStorage) {
  let aliasKey
  let storageTarget = defaultStorage
  let isSliding = false
  let expiresIn = 0

  const buildInterceptor = Alpine.interceptor(
    (initialValue, getCurrentValue, setCurrentValue, dataPath) => {
      const lookupKey = aliasKey ?? `${KEY_PREFIX}${dataPath}`
      const expiresKey = `${lookupKey}${EXPIRES_SUFFIX}`
      const rawValue = storageTarget.getItem(lookupKey)

      let expiresAt = null
      let restoredValue = initialValue

      if (rawValue !== null && hasExpired(storageTarget, lookupKey)) {
        removeStoredEntry(storageTarget, lookupKey)
      } else if (rawValue !== null) {
        restoredValue = parseStoredValue(rawValue)

        const rawExpiry = storageTarget.getItem(expiresKey)

        if (rawExpiry !== null) {
          expiresAt = Number(rawExpiry)
        }
      }

      setCurrentValue(restoredValue)

      Alpine.effect(() => {
        const currentValue = getCurrentValue()

        storageTarget.setItem(lookupKey, JSON.stringify(currentValue))

        // A fixed window writes the sidecar once and then never again, so a
        // frequently updated property costs the same writes as `$persist`.
        if (isSliding || expiresAt === null) {
          expiresAt = Date.now() + expiresIn

          storageTarget.setItem(expiresKey, String(expiresAt))
        }

        setCurrentValue(currentValue)
      })

      return restoredValue
    },
    // `as`, `using` and `sliding` are named to match the official plugin's
    // chain, so they stay single words.
    (interceptorObject) => {
      interceptorObject.as = (nextAliasKey) => {
        aliasKey = nextAliasKey

        return interceptorObject
      }

      interceptorObject.using = (nextStorageTarget) => {
        storageTarget = nextStorageTarget

        return interceptorObject
      }

      interceptorObject.sliding = () => {
        isSliding = true

        return interceptorObject
      }
    }
  )

  // `Alpine.interceptor` only forwards the initial value, so the TTL is
  // captured here before handing off.
  return (initialValue, ttlValue) => {
    expiresIn = parseDuration(ttlValue)

    return buildInterceptor(initialValue)
  }
}

// Accepts the key as written in `x-data` (`name` -> `_x_name`) or as written in
// storage, which is what `.as()` aliases and non-Alpine keys look like.
function resolveLookupKey(storageTarget, persistKey) {
  const prefixedKey = `${KEY_PREFIX}${persistKey}`

  if (storageTarget.getItem(prefixedKey) !== null) {
    return prefixedKey
  }

  if (storageTarget.getItem(persistKey) !== null) {
    return persistKey
  }

  return prefixedKey
}

function hasExpired(storageTarget, lookupKey) {
  const rawExpiry = storageTarget.getItem(`${lookupKey}${EXPIRES_SUFFIX}`)

  return rawExpiry !== null && Number(rawExpiry) <= Date.now()
}

function removeStoredEntry(storageTarget, lookupKey) {
  storageTarget.removeItem(lookupKey)
  storageTarget.removeItem(`${lookupKey}${EXPIRES_SUFFIX}`)
}

// Anything not written by `$persist` is left as the raw string rather than
// throwing, so reading a hand-written key still returns something usable.
function parseStoredValue(rawValue) {
  try {
    return JSON.parse(rawValue)
  } catch {
    return rawValue
  }
}

// Snapshotted before anything is removed: deleting while walking
// `storage.key(i)` reindexes the store and silently skips entries.
function listPersistedKeys(storageTarget) {
  return Array.from({ length: storageTarget.length }, (unusedItem, itemIndex) =>
    storageTarget.key(itemIndex)
  ).filter(
    (itemKey) =>
      itemKey !== null &&
      itemKey.startsWith(KEY_PREFIX) &&
      !itemKey.endsWith(EXPIRES_SUFFIX)
  )
}

function parseDuration(ttlValue) {
  if (typeof ttlValue === 'number' && Number.isFinite(ttlValue) && ttlValue > 0) {
    return ttlValue
  }

  const durationMatch =
    typeof ttlValue === 'string' && DURATION_PATTERN.exec(ttlValue.trim())

  if (durationMatch) {
    return Number(durationMatch[1]) * DURATION_UNITS[durationMatch[2].toLowerCase()]
  }

  throw new Error(
    `alpinejs-persist-extended: expected a duration in milliseconds or a string like '45s', '10m' or '7d', received ${JSON.stringify(ttlValue)}`
  )
}

function dispatchPersistEvent(sourceEl, eventName, eventDetail) {
  sourceEl.dispatchEvent(
    new CustomEvent(`persist:${eventName}`, {
      bubbles: true,
      detail: eventDetail,
    })
  )
}

function getRootElement() {
  return document.documentElement
}

function resolveDefaultStorage() {
  const probeKey = `${KEY_PREFIX}probe`

  try {
    localStorage.setItem(probeKey, probeKey)
    localStorage.removeItem(probeKey)

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
function createMemoryStorage() {
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
