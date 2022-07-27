import { containerType } from "./types";

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

export function isDate(value: any): boolean {
  return typeof value?.getMonth === "function";
}

export function getDate(value: any): Date {
  return value?.seconds ? new Date(value.seconds * 1000) : new Date(value);
}

export function getTimestamp(value: any): number {
  return this.isDate(value) // if date
    ? new Date(value).valueOf()
    : value?.seconds // if firebase date
    ? value?.seconds * 1000
    : typeof value === "number" // if number
    ? value
    : null;
}

export function isEmptyContainer(item: containerType): boolean {
  return Object.keys(item).length < 4;
}

// user defined type guard
//  isFruit(fruit: string): fruit is Fruit {
//   return ["apple", "banana", "grape"].indexOf("fruit") !== -1;
// }

// if (isFruit(myfruit)) {
//     // if this condition passes
//     // then TS compiler knows that myfruit is of the Fruit type
//     myfruit
// }
