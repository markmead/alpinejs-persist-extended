import { KEY_PREFIX } from './constants.js'
import { parseDuration } from './duration.js'
import {
  hasExpired,
  parseStoredValue,
  readExpiresAt,
  removeStoredEntry,
  writeExpiresAt,
} from './entries.js'

// `$persist` with a TTL. A fresh factory is created per magic access, so each
// use in an `x-data` expression gets its own alias, backend and window.
export function createExpiringInterceptor(Alpine, defaultStorage) {
  let aliasKey
  let storageTarget = defaultStorage
  let isSliding = false
  let expiresIn = 0

  const buildInterceptor = Alpine.interceptor(
    (initialValue, getCurrentValue, setCurrentValue, dataPath) => {
      const lookupKey = aliasKey ?? `${KEY_PREFIX}${dataPath}`
      const rawValue = storageTarget.getItem(lookupKey)

      let expiresAt = null
      let restoredValue = initialValue

      if (rawValue !== null && hasExpired(storageTarget, lookupKey)) {
        removeStoredEntry(storageTarget, lookupKey)
      } else if (rawValue !== null) {
        restoredValue = parseStoredValue(rawValue)
        expiresAt = readExpiresAt(storageTarget, lookupKey)
      }

      setCurrentValue(restoredValue)

      Alpine.effect(() => {
        const currentValue = getCurrentValue()

        storageTarget.setItem(lookupKey, JSON.stringify(currentValue))

        // A fixed window writes the sidecar once and then never again, so a
        // frequently updated property costs the same writes as `$persist`.
        if (isSliding || expiresAt === null) {
          expiresAt = Date.now() + expiresIn

          writeExpiresAt(storageTarget, lookupKey, expiresAt)
        }

        setCurrentValue(currentValue)
      })

      return restoredValue
    },
    // `as`, `using` and `sliding` are named to match the official plugin's
    // chain, so they stay single words. They mutate closure variables read
    // later at initialize time, which is why chain order does not matter.
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
