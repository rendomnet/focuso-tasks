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

export function getDate(value: any): Date | null | undefined {
  let result: Date | undefined;
  if (value?.seconds) result = new Date(value.seconds * 1000);
  else result = new Date(value);
  if (result && result instanceof Date && !isNaN(result?.getTime()))
    return result;
  else return null;
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

export function findByLowesValue<T>(
  array: T[],
  propertyName: string
): T | undefined {
  return array.reduce(
    (acc, curr) => (curr[propertyName] < acc[propertyName] ? curr : acc),
    array[0] || undefined
  );
}

export function getContainerTasks(container: containerType): object {
  const { id, order, ownerId, ...tasks } = container;
  return tasks || {};
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
