"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const firestore_size_1 = __importDefault(require("firestore-size"));
const helpers_1 = require("./helpers");
class FocusoTasks {
    constructor(props) {
        this.containers = [];
        this.dictionary = {};
        this.stats = {};
        this.onAdd = () => null;
        this.onUpdate = () => null;
        this.onDelete = () => null;
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
    isDate(value) {
        return typeof (value === null || value === void 0 ? void 0 : value.getMonth) === "function";
    }
    getDate(value) {
        return (value === null || value === void 0 ? void 0 : value.seconds) ? new Date(value.seconds * 1000) : new Date(value);
    }
    getTimestamp(value) {
        return this.isDate(value) // if date
            ? new Date(value).valueOf()
            : (value === null || value === void 0 ? void 0 : value.seconds // if firebase date
            )
                ? (value === null || value === void 0 ? void 0 : value.seconds) * 1000
                : typeof value === "number" // if number
                    ? value
                    : null;
    }
    /**
     * Add task
     * @param payload
     * @returns
     */
    add(payload) {
        const { text, category, userId } = payload;
        const timestamp = new Date().valueOf();
        // Build task data
        const data = {
            [timestamp]: this.pack({
                text: text,
                status: 0,
                createdAt: new Date(timestamp),
                category: Number(category),
            }),
        };
        // Create new container
        // If no  containers or if latest container size exceeds 1mb
        const containerLatest = this.containers[this.containers.length - 1] || null;
        if (this.containers.length < 1 || (0, firestore_size_1.default)(containerLatest) > 999000) {
            this.onAdd({
                data: Object.assign(Object.assign({}, data), { ownerId: userId, order: this.containers.length - 1 }),
            });
        }
        else {
            if (!(containerLatest === null || containerLatest === void 0 ? void 0 : containerLatest.id))
                return;
            this.onUpdate({
                containerId: containerLatest.id,
                data: Object.assign({}, data),
            });
        }
    }
    delete(id) {
        const task = this.dictionary[id];
        const containerId = this.containers[(task === null || task === void 0 ? void 0 : task.order) || 0].id;
        this.onDelete({
            containerId: containerId,
            taskId: id,
        });
    }
    update(payload) {
        const { id, value } = payload;
        const task = this.dictionary[id];
        const containerId = this.containers[(task === null || task === void 0 ? void 0 : task.order) || 0].id;
        const newData = Object.assign(Object.assign({}, task), value);
        const result = this.pack(newData);
        this.onUpdate({
            containerId: containerId,
            data: {
                [id]: result,
            },
        });
    }
    /**
     * Convert firebase docs list to tasks dictionary
     * @param containerList - array of container docs
     * @returns
     */
    load(containerList) {
        var _a;
        const dictionary = {};
        this.containers = [...containerList];
        if ((containerList === null || containerList === void 0 ? void 0 : containerList.length) > 0) {
            let stats = {
                0: { 0: 0, 1: 0 },
            };
            for (const [index, container] of containerList.entries()) {
                // Loop container
                for (let key in container) {
                    // Skip container keys that are not dictionary keys
                    if (["ownerId", "order", "id"].includes(key))
                        continue;
                    const taskPacked = container[key];
                    dictionary[key] = Object.assign(Object.assign({}, this.unpack(taskPacked, key, index)), { order: container.order });
                    // Count categories
                    const categoryId = dictionary[key].category;
                    if ((_a = stats === null || stats === void 0 ? void 0 : stats[categoryId]) === null || _a === void 0 ? void 0 : _a[dictionary[key].status]) {
                        stats[categoryId][dictionary[key].status]++;
                    }
                    else {
                        (0, helpers_1.setDeep)(stats, [categoryId, dictionary[key].status], 1);
                    }
                }
            }
            this.dictionary = dictionary;
            this.stats = stats;
            return {
                dictionary,
                stats,
            };
        }
    }
    /**
     * Task to array task
     * @param item
     * @returns
     */
    pack(item) {
        return [
            item.text,
            Number(item.status),
            item.createdAt,
            Number(item.category),
            item.completedAt || null,
        ];
    }
    /**
     * Array task to object task
     * @param item
     * @param id
     * @param index
     * @returns
     */
    unpack(item, id, index) {
        return Object.assign({ text: item[0], status: Number(item[1]), createdAt: this.getDate(item[2]), category: Number(item[3]), completedAt: this.getDate(item[4]) || null, id: id }, (index &&
            index > 0 && {
            order: index,
        }));
    }
}
exports.default = FocusoTasks;
