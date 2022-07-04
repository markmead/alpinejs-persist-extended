export default function (Alpine) {
  Alpine.magic("storage", (el) => (data, type = "GET") => {
    let methodType = type.toUpperCase();
    let methodTypes = ["GET", "DELETE", "CLEAR"];
    let dataKey = data;

    if (!methodTypes.includes(methodType)) {
      console.error(`Expected ${methodTypes} but got ${methodType}.`);
    }

    if (!localStorage.getItem(dataKey)) {
      dataKey = `_x_${dataKey}`;
    }

    if (methodType === "GET") {
      return storageGet(dataKey);
    }

    if (methodType === "DELETE") {
      storageDelete(el, dataKey);
    }
  });

  function storageGet(data) {
    return localStorage.getItem(data);
  }

  function storageDelete(el, data) {
    localStorage.removeItem(data);

    el.dispatchEvent(
      new CustomEvent("storage-delete", {
        bubbles: true,
        cancelable: true,
      })
    );
  }
}
