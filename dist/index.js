"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const firestore_size_1 = __importDefault(require("firestore-size"));
const helpers_1 = require("./helpers");
class FocusoTasks {
    constructor(props) {
        this.userId = "";
        this.containers = [];
        this.dictionary = {};
        this.stats = {};
        this.onAdd = () => null;
        this.onUpdate = () => null;
        this.onDelete = () => null;
        this.refreshContainers;
        this.deleteContainer;
        this.onLoad;
    }
    getContainer(order) {
        const result = this.containers.find((item) => item.order === order);
        if (!result)
            throw new Error(`Task container ${order} not found`);
        return result;
    }
    getTask(id) {
        const result = this.dictionary[id];
        if (!result)
            throw new Error(`Task ${id} not found`);
        return result;
    }
    /**
     * Add task
     * @param payload
     * @returns
     */
    add(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            let { text, category, userId } = payload;
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
            const containerLatest = this.containers[this.containers.length - 1] || {};
            // Create new container
            // If no  containers or if latest container size exceeds 1mb
            if (this.containers.length < 1 ||
                (0, firestore_size_1.default)(Object.assign(Object.assign({}, containerLatest), data)) > 999000) {
                // Create new task container
                if (this.refreshContainers) {
                    const containers = yield this.refreshContainers();
                    if (containers === null || containers === void 0 ? void 0 : containers.length) {
                        yield this.load(containers);
                    }
                }
                userId = userId || this.userId;
                if (!userId)
                    throw new Error("Focuso Tasks: User id not defined");
                this.onAdd({
                    data: Object.assign(Object.assign({}, data), { ownerId: userId, 
                        // createdAt: new Date(),
                        order: this.containers.length < 1 ? 0 : this.containers.length - 1 }),
                });
            }
            else {
                if (!containerLatest.id)
                    throw new Error("Focuso Tasks: Container id not found");
                this.onUpdate({
                    containerId: containerLatest.id,
                    data: Object.assign({}, data),
                });
            }
        });
    }
    /**
     * Delete single task
     * @param id - task id
     */
    delete(id) {
        const task = this.getTask(id);
        const container = this.getContainer(task.order);
        this.onDelete({
            containerId: container.id,
            taskId: id,
        });
    }
    /**
     * Update task
     * @param payload - object {id, value}
     */
    update(payload) {
        const { id, value } = payload;
        const task = this.getTask(id);
        const container = this.getContainer(task.order);
        const newData = Object.assign(Object.assign({}, task), value);
        const result = this.pack(newData);
        this.onUpdate({
            containerId: container.id,
            data: {
                [id]: result,
            },
        });
    }
    /**
     * Remove invalid containers
     * @param containerList
     */
    sanitizeContainers(containerList) {
        return __awaiter(this, void 0, void 0, function* () {
            let byOrder = {};
            let lowContainers = [];
            let result = [];
            for (const item of containerList) {
                // Add to dictionary by order
                if (item.order && !byOrder[item.order]) {
                    byOrder[item.order] = byOrder[item.order]
                        ? byOrder[item.order].push(item)
                        : [byOrder[item.order]];
                    if (byOrder[item.order].length > 1) {
                        // Duplicate found
                        const lessKeys = byOrder[item.order].reduce((prev, current) => {
                            return Object.keys(prev).length < Object.keys(current).length
                                ? prev
                                : current;
                        });
                        if (this.deleteContainer) {
                            if (lessKeys.id)
                                yield this.deleteContainer(lessKeys.id);
                            continue;
                        }
                    }
                }
                // Delete invalid containers
                if (this.deleteContainer) {
                    if (!item.order || !item.ownerId) {
                        this.deleteContainer(item.id);
                        continue;
                    }
                }
                // Detect empty containers
                if ((0, helpers_1.isEmptyContainer)(item)) {
                    yield this.deleteContainer(item.id);
                    continue;
                }
                // Detect low containers
                if (Object.keys(item).length < 20) {
                    lowContainers.push(item);
                    continue;
                }
                result.push(item);
            }
            // Merge low containers
            if (lowContainers.length > 1) {
                // TODO MERGE
                result = [...result, ...lowContainers];
            }
            return result;
        });
    }
    /**
     * Convert firebase docs list to tasks dictionary
     * @param containerList - array of container docs
     * @returns
     */
    load(containerList) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const dictionary = {};
            let list = yield this.sanitizeContainers(containerList);
            // Sort by order
            let sorted = list.sort((a, b) => a.order - b.order);
            this.containers = [...sorted];
            if ((sorted === null || sorted === void 0 ? void 0 : sorted.length) > 0) {
                let stats = {
                    0: { 0: 0, 1: 0 },
                };
                for (const [index, container] of sorted.entries()) {
                    // Loop container
                    for (let key in container) {
                        // Skip container keys that are not dictionary keys
                        if (["ownerId", "order", "id", "createdAt"].includes(key))
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
                if (this.onLoad) {
                    this.onLoad({ dictionary, stats });
                }
                return {
                    dictionary,
                    stats,
                };
            }
        });
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
        return Object.assign({ text: item[0], status: Number(item[1]), createdAt: (0, helpers_1.getDate)(item[2]), category: Number(item[3]), completedAt: (0, helpers_1.getDate)(item[4]) || null, id: id }, (index &&
            index > 0 && {
            order: index,
        }));
    }
}
exports.default = FocusoTasks;
