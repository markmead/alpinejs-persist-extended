const DURATION_PATTERN = /^(\d+(?:\.\d+)?)(ms|s|m|h|d|w)$/i
const DURATION_UNITS = {
  ms: 1,
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
  w: 7 * 24 * 60 * 60 * 1000,
}

// Throws rather than falling back to "never expires": silently ignoring a bad
// duration produces bugs that only show up as data outliving its window.
export function parseDuration(ttlValue) {
  if (
    typeof ttlValue === 'number' &&
    Number.isFinite(ttlValue) &&
    ttlValue > 0
  ) {
    return ttlValue
  }

  const durationMatch =
    typeof ttlValue === 'string' && DURATION_PATTERN.exec(ttlValue.trim())

  if (durationMatch) {
    return (
      Number(durationMatch[1]) * DURATION_UNITS[durationMatch[2].toLowerCase()]
    )
  }

  throw new Error(
    `alpinejs-persist-extended: expected a duration in milliseconds or a string like '45s', '10m' or '7d', received ${JSON.stringify(ttlValue)}`
  )
}
