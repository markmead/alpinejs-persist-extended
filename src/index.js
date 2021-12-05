export default function (Alpine) {
  Alpine.magic("storage", (el) => (data, type) => {
    let methodType = type.toUpperCase();
    let methodTypes = ["GET", "DELETE"];

    if (!methodTypes.includes(methodType)) {
      console.error(`Expected ${methodTypes} but got ${methodType}.`);
    }

    if (methodType === "GET") {
      return storageGet(data);
    }

    if (methodType === "DELETE") {
      storageDelete(el, data);
    }
  });

  function storageGet(data) {
    return localStorage.getItem(data);
  }

  function storageDelete(el, data) {
    localStorage.removeItem(data);

    let eventOptions = {
      bubbles: true,
      cancelable: true,
    };

    let stringRegex = /[A-Z]?[a-z]+|[0-9]+|[A-Z]+(?![a-z])/g;

    let eventName = data
      .replace("_x_", "")
      .match(stringRegex)
      .join("-")
      .toLowerCase();

    el.dispatchEvent(new CustomEvent("storage-delete", eventOptions));

    el.dispatchEvent(
      new CustomEvent(`storage-delete-${eventName}`, eventOptions)
    );
  }
}
