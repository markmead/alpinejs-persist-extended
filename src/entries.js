import { EXPIRES_SUFFIX, KEY_PREFIX } from './constants.js'

// Accepts the key as written in `x-data` (`name` -> `_x_name`) or as written in
// storage, which is what `.as()` aliases and non-Alpine keys look like. Writes
// to a key that does not exist yet use the prefixed form.
export function resolveLookupKey(storageTarget, persistKey) {
  const prefixedKey = `${KEY_PREFIX}${persistKey}`

  if (storageTarget.getItem(prefixedKey) !== null) {
    return prefixedKey
  }

  if (storageTarget.getItem(persistKey) !== null) {
    return persistKey
  }

  return prefixedKey
}

// A sidecar that does not read as a timestamp counts as already expired rather
// than as "no expiry": the key was asked to expire and we can no longer tell
// when, so sweeping it is the safe reading. Returning `null` would make a
// corrupt sidecar silently pin the value in storage forever.
export function readExpiresAt(storageTarget, lookupKey) {
  const rawExpiry = storageTarget.getItem(`${lookupKey}${EXPIRES_SUFFIX}`)

  if (rawExpiry === null) {
    return null
  }

  const expiresAt = Number(rawExpiry)

  return Number.isFinite(expiresAt) ? expiresAt : 0
}

export function hasExpired(storageTarget, lookupKey) {
  const expiresAt = readExpiresAt(storageTarget, lookupKey)

  return expiresAt !== null && expiresAt <= Date.now()
}

export function writeExpiresAt(storageTarget, lookupKey, expiresAt) {
  storageTarget.setItem(`${lookupKey}${EXPIRES_SUFFIX}`, String(expiresAt))
}

// Always clears both halves of an entry, so a sidecar can never outlive the
// value it belongs to and resurrect as an expiry on a future write.
export function removeStoredEntry(storageTarget, lookupKey) {
  storageTarget.removeItem(lookupKey)
  storageTarget.removeItem(`${lookupKey}${EXPIRES_SUFFIX}`)
}

export function removeExpiresAt(storageTarget, lookupKey) {
  storageTarget.removeItem(`${lookupKey}${EXPIRES_SUFFIX}`)
}

// Anything not written by `$persist` is left as the raw string rather than
// throwing, so reading a hand-written key still returns something usable.
export function parseStoredValue(rawValue) {
  try {
    return JSON.parse(rawValue)
  } catch {
    return rawValue
  }
}

// Snapshotted before anything is removed: deleting while walking
// `storage.key(i)` reindexes the store and silently skips entries.
export function listPersistedKeys(storageTarget) {
  return Array.from({ length: storageTarget.length }, (unusedItem, itemIndex) =>
    storageTarget.key(itemIndex)
  ).filter(
    (itemKey) =>
      itemKey !== null &&
      itemKey.startsWith(KEY_PREFIX) &&
      !itemKey.endsWith(EXPIRES_SUFFIX)
  )
}
