import { KEY_PREFIX } from './constants.js'
import { parseDuration } from './duration.js'
import {
  hasExpired,
  listPersistedKeys,
  parseStoredValue,
  removeExpiresAt,
  removeStoredEntry,
  resolveLookupKey,
  writeExpiresAt,
} from './entries.js'
import { dispatchPersistEvent } from './events.js'

// The imperative half of the plugin: operations on persisted keys the calling
// component does not own. Anything a component does own should be changed by
// assigning to its `$persist` property, which updates the UI and storage
// together — these helpers cannot.
export function createPersistHelpers(defaultStorage) {
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
      removeExpiresAt(storageTarget, lookupKey)
    } else {
      writeExpiresAt(storageTarget, lookupKey, expiresAt)
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

  // Scoped to the `_x_` namespace, so it never destroys unrelated app keys the
  // way `localStorage.clear()` would. `.as()` aliases fall outside it by design.
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

  return {
    readPersistedValue,
    writePersistedValue,
    deletePersistedValue,
    clearPersistedValues,
  }
}
