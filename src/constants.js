// The official @alpinejs/persist plugin keys storage as `alias || '_x_' + path`
// and stores `JSON.stringify(value)`. Everything here reads and writes that
// exact format, so a key can be shared with `$persist` without translation.
export const KEY_PREFIX = '_x_'

// Expiry lives in a sidecar key rather than wrapping the value, so the value
// key stays byte-identical to what `$persist` writes. Wrapping would make
// `{ v, e }` user data indistinguishable from an envelope.
export const EXPIRES_SUFFIX = '__x_expires'
