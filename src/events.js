// Bubbling, so a listener can sit on an ancestor or use `.window`. Not
// cancelable: nothing reads `defaultPrevented`, and 1.2.0's `cancelable: true`
// implied a hook that never existed.
export function dispatchPersistEvent(sourceEl, eventName, eventDetail) {
  sourceEl.dispatchEvent(
    new CustomEvent(`persist:${eventName}`, {
      bubbles: true,
      detail: eventDetail,
    })
  )
}

// The helpers exposed on the Alpine object have no calling element, so their
// events dispatch from the root, which still reaches `.window` listeners.
export function getRootElement() {
  return document.documentElement
}
