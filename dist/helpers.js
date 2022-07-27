"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isEmptyContainer = exports.getTimestamp = exports.getDate = exports.isDate = exports.setDeep = void 0;
function setDeep(obj, keyPath, value) {
    if (!Array.isArray(keyPath))
        keyPath = keyPath.split(".");
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
exports.setDeep = setDeep;
function isDate(value) {
    return typeof (value === null || value === void 0 ? void 0 : value.getMonth) === "function";
}
exports.isDate = isDate;
function getDate(value) {
    return (value === null || value === void 0 ? void 0 : value.seconds) ? new Date(value.seconds * 1000) : new Date(value);
}
exports.getDate = getDate;
function getTimestamp(value) {
    return this.isDate(value) // if date
        ? new Date(value).valueOf()
        : (value === null || value === void 0 ? void 0 : value.seconds // if firebase date
        )
            ? (value === null || value === void 0 ? void 0 : value.seconds) * 1000
            : typeof value === "number" // if number
                ? value
                : null;
}
exports.getTimestamp = getTimestamp;
function isEmptyContainer(item) {
    return Object.keys(item).length < 4;
}
exports.isEmptyContainer = isEmptyContainer;
// user defined type guard
//  isFruit(fruit: string): fruit is Fruit {
//   return ["apple", "banana", "grape"].indexOf("fruit") !== -1;
// }
// if (isFruit(myfruit)) {
//     // if this condition passes
//     // then TS compiler knows that myfruit is of the Fruit type
//     myfruit
// }
