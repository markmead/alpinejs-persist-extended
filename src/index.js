export default function (Alpine) {
  Alpine.magic('storage', (el) => (alpineData, requestType = 'GET') => {
    const crudActions = ['GET', 'DELETE']

    const requestedAction = requestType.toUpperCase()

    let alpineDataKey = alpineData

    if (!crudActions.includes(requestedAction)) {
      console.error(`Expected ${crudActions} but got ${requestedAction}.`)
    }

    if (!localStorage.getItem(alpineDataKey)) {
      alpineDataKey = `_x_${alpineDataKey}`
    }

    if (requestedAction === 'GET') {
      return storageGet(alpineDataKey)
    }

    if (requestedAction === 'DELETE') {
      storageDelete(el, alpineDataKey)
    }
  })

  function storageGet(alpineData) {
    return localStorage.getItem(alpineData)
  }

  function storageDelete(el, alpineData) {
    localStorage.removeItem(alpineData)

    el.dispatchEvent(
      new CustomEvent('ls-delete', {
        bubbles: true,
        cancelable: true,
      })
    )
  }
}
