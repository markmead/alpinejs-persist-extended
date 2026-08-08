import { getRootElement } from './events.js'
import { createExpiringInterceptor } from './expiring.js'
import { createPersistHelpers } from './helpers.js'
import { resolveDefaultStorage } from './storage.js'

export default function (Alpine) {
  const defaultStorage = resolveDefaultStorage()

  const {
    readPersistedValue,
    writePersistedValue,
    deletePersistedValue,
    clearPersistedValues,
  } = createPersistHelpers(defaultStorage)

  const expiringMagic = () => createExpiringInterceptor(Alpine, defaultStorage)

  // Each magic is resolved per evaluation, so `expiringMagic` hands out a fresh
  // interceptor every time `$persistExpire` is touched.
  Alpine.magic('persistExpire', expiringMagic)
  Alpine.magic('persistGet', () => readPersistedValue)
  Alpine.magic('persistSet', (sourceEl) =>
    bindSourceEl(writePersistedValue, sourceEl)
  )
  Alpine.magic('persistDelete', (sourceEl) =>
    bindSourceEl(deletePersistedValue, sourceEl)
  )
  Alpine.magic('persistClear', (sourceEl) =>
    bindSourceEl(clearPersistedValues, sourceEl)
  )

  // Mirrors `Alpine.$persist` so the interceptor works inside `Alpine.store`,
  // and exposes the imperative helpers to plain scripts.
  Object.defineProperty(Alpine, '$persistExpire', { get: expiringMagic })

  Alpine.persistGet = readPersistedValue
  Alpine.persistSet = bindRootEl(writePersistedValue)
  Alpine.persistDelete = bindRootEl(deletePersistedValue)
  Alpine.persistClear = bindRootEl(clearPersistedValues)
}

// The helpers take the dispatching element first; callers pass everything after
// it. `$persistGet` is exempt because it dispatches no event.
function bindSourceEl(persistHelper, sourceEl) {
  return (...helperArgs) => persistHelper(sourceEl, ...helperArgs)
}

function bindRootEl(persistHelper) {
  return (...helperArgs) => persistHelper(getRootElement(), ...helperArgs)
}
