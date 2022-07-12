export function setDeep(obj: object, keyPath: string | string[], value: any) {
  if (!Array.isArray(keyPath)) keyPath = keyPath.split(".");

  let lastKeyIndex = keyPath.length - 1;
  for (var i = 0; i < lastKeyIndex; ++i) {
    let key = keyPath[i];
    if (!(key in obj)) {
      obj[key] = {};
    }
    obj = obj[key];
  }
  obj[keyPath[lastKeyIndex]] = value;
}
