"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setDeep = void 0;
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
