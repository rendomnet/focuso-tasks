"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getContainerTasks = exports.findByLowesValue = exports.isEmptyContainer = exports.getTimestamp = exports.getDate = exports.isDate = exports.setDeep = void 0;
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
function findByLowesValue(array, propertyName) {
    return array.reduce((acc, curr) => (curr[propertyName] < acc[propertyName] ? curr : acc), array[0] || undefined);
}
exports.findByLowesValue = findByLowesValue;
function getContainerTasks(container) {
    const { id, order, ownerId } = container, tasks = __rest(container, ["id", "order", "ownerId"]);
    return tasks || {};
}
exports.getContainerTasks = getContainerTasks;
// user defined type guard
//  isFruit(fruit: string): fruit is Fruit {
//   return ["apple", "banana", "grape"].indexOf("fruit") !== -1;
// }
// if (isFruit(myfruit)) {
//     // if this condition passes
//     // then TS compiler knows that myfruit is of the Fruit type
//     myfruit
// }
