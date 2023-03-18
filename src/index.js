export default function (Alpine) {
  Alpine.magic('persistGet', () => (storageKey) => {
    return localStorage.getItem(`_x_${storageKey}`)
  })

  Alpine.magic('persistDelete', (el) => (storageKey) => {
    localStorage.removeItem(`_x_${storageKey}`)

    el.dispatchEvent(
      new CustomEvent('persist:delete', {
        bubbles: true,
        cancelable: true,
      })
    )
  })
}
