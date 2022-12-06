import sizeof from "firestore-size";
import { findByLowesValue, getContainerTasks, getDate, setDeep, } from "./helpers";
class FocusoTasks {
    containers;
    dictionary;
    onAdd;
    onUpdate;
    onDelete;
    onLoad;
    pack;
    unpack;
    refreshContainers;
    deleteContainer;
    userId;
    stats;
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
    getContainer(params) {
        const { taskId, order } = params;
        const result = this.containers.find((item) => {
            if (taskId)
                return item[taskId];
            else
                return item.order === order;
        });
        if (!result)
            throw new Error(`Task container not found taskId: ${taskId}, order: ${order}`);
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
    async add(payload) {
        let { text, categoryId, userId, taskId } = payload;
        let timestamp = taskId ? Number(taskId) : new Date().valueOf();
        if (!taskId)
            taskId = String(timestamp);
        // Build task data
        const data = {
            [taskId]: FocusoTasks.pack({
                text: text,
                status: 0,
                createdAt: new Date(typeof taskId === "string" ? Number(taskId) : taskId),
                categoryId: Number(categoryId),
            }),
        };
        const containerLatest = this.containers[this.containers.length - 1] || {};
        // Create new container
        // If no  containers or if latest container size exceeds 1mb
        if (this.containers.length < 1 ||
            sizeof({ ...containerLatest, ...data }) > 999000) {
            // Create new task container
            if (this.refreshContainers) {
                const containers = await this.refreshContainers();
                if (containers?.length) {
                    await this.load(containers);
                }
            }
            userId = userId || this.userId;
            if (!userId)
                throw new Error("Focuso Tasks: User id not defined");
            this.onAdd({
                data: {
                    ...data,
                    ownerId: userId,
                    // createdAt: new Date(),
                    order: this.containers.length < 1 ? 0 : this.containers.length - 1,
                },
            });
        }
        else {
            if (!containerLatest.id)
                throw new Error("Focuso Tasks: Container id not found");
            this.onUpdate({
                containerId: containerLatest.id,
                data: {
                    ...data,
                },
            });
        }
    }
    /**
     * Delete single task
     * @param id - task id
     */
    delete(id) {
        const task = this.getTask(id);
        const container = this.getContainer({ taskId: id, order: task.order });
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
        const container = this.getContainer({ taskId: id, order: task.order });
        const newData = {
            ...task,
            ...value,
            modifiedAt: new Date(),
        };
        const result = FocusoTasks.pack(newData);
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
    async sanitizeContainers(containerList) {
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
                            await this.deleteContainer(lessKeys.id);
                        continue;
                    }
                }
            }
            // Delete invalid containers
            if (this.deleteContainer) {
                if (typeof item.order === "undefined") {
                    this.deleteContainer(item.id);
                    continue;
                }
            }
            // Detect empty containers
            // This will delete any new containers
            // if (isEmptyContainer(item)) {
            //   await this.deleteContainer(item.id);
            //   continue;
            // }
            result.push(item);
        }
        // If 1 low container
        // result = [...result, ...lowContainers];
        return result;
    }
    /**
     * Convert firebase docs list to tasks dictionary
     * @param containerList - array of container docs
     * @returns
     */
    async load(containerList) {
        const dictionary = {
            tasks: {},
            categories: {},
            sections: {},
        };
        const completed = {};
        const active = {};
        let tree = {};
        const due = {};
        let list = containerList;
        // Sort by order
        let sorted = list.sort((a, b) => a.order - b.order);
        this.containers = [...sorted];
        if (sorted?.length > 0) {
            let stats = {
                0: { 0: 0, 1: 0 },
            };
            for (const [index, container] of sorted.entries()) {
                // Loop container
                for (let taskId in container) {
                    // Skip container keys that are not dictionary keys
                    if (["ownerId", "order", "id", "createdAt", "categories"].includes(taskId))
                        continue;
                    const taskPacked = container[taskId];
                    const task = FocusoTasks.unpack(taskPacked, taskId, index);
                    const categoryId = task.categoryId;
                    const sectionId = task.sectionId || `defaultSection-${categoryId}`;
                    const category = container.categories?.[categoryId] || {};
                    const section = container.sections?.[sectionId] || {};
                    // DICTIONARY
                    dictionary.tasks[taskId] = {
                        ...task,
                        order: container.order,
                    };
                    // DUE
                    if (task.due?.date) {
                        const dueKey = this.getTaskDay(new Date(task.due?.date));
                        due[dueKey] = [...(due[dueKey] || []), taskId];
                    }
                    // CLOSED TASKS
                    if (task.completedAt) {
                        const dayKey = this.getTaskDay(task.completedAt);
                        // Create deep path
                        if (!completed[dayKey])
                            completed[dayKey] = {};
                        if (!completed[dayKey][categoryId])
                            completed[dayKey][categoryId] = [];
                        completed[dayKey][categoryId].push({ ...task });
                    }
                    // TREE
                    if (task.status === 0) {
                        tree = {
                            ...tree,
                            [categoryId]: {
                                ...(tree[categoryId] || {}),
                                [sectionId]: [...(tree[categoryId]?.[sectionId] || []), taskId],
                            },
                        };
                    }
                    // CATEGORIES
                    if (!dictionary.categories[categoryId])
                        dictionary.categories[categoryId] = {
                            id: categoryId,
                            title: category?.title || "category " + categoryId,
                            index: category?.index,
                        };
                    // SECTIONS
                    if (!dictionary.sections[sectionId])
                        dictionary.sections[sectionId] = {
                            id: sectionId,
                            title: section?.title || "section " + sectionId,
                            index: section?.index,
                        };
                    // Count categories
                    if (stats?.[categoryId]?.[dictionary.tasks[taskId].status]) {
                        stats[categoryId][dictionary.tasks[taskId].status]++;
                    }
                    else {
                        setDeep(stats, [categoryId, dictionary.tasks[taskId].status], 1);
                    }
                }
            }
            this.dictionary = dictionary.tasks;
            this.stats = stats;
            if (this.onLoad) {
                this.onLoad({ dictionary, stats, completed, active });
            }
            return {
                dictionary,
                stats,
                due,
                completed,
                active,
            };
        }
    }
    getTaskDay(completedAt) {
        return `${completedAt.getDate()}${completedAt.getMonth()}${completedAt.getFullYear()}`;
    }
    mergeLowContainers() {
        let lowContainers = [];
        for (const container of this.containers) {
            // Detect low containers
            if (Object.keys(container).length < 20)
                lowContainers.push(container);
        }
        console.log("lowContainers", lowContainers);
        // Merge low containers
        if (lowContainers.length > 1) {
            // TODO MERGE
            const lowestOrderContainer = findByLowesValue(lowContainers, "order");
            let mergedContainer = {};
            let containersIdsToDelete = [];
            if (lowestOrderContainer?.id) {
                for (const container of lowContainers) {
                    if (container.id === lowestOrderContainer.id)
                        continue;
                    let tasks = getContainerTasks(container);
                    mergedContainer = { ...mergedContainer, ...tasks };
                    containersIdsToDelete.push(container.id);
                }
                // Add order, ownerId
                mergedContainer = { ...mergedContainer, ...lowestOrderContainer };
                // todo Save merged
                // todo Delete rest
                console.log("mergedContainer", mergedContainer);
            }
        }
    }
    /**
     * Task to array task
     * @param item - {text, status = 0 |1 , createdAt, categoryId id, completedAt}
     * @returns
     */
    static pack(item) {
        let result = [
            item.text,
            Number(item.status),
            getDate(item.createdAt) || new Date(),
            Number(item.categoryId),
            getDate(item.completedAt) || null,
        ];
        if (item.modifiedAt && getDate(item.modifiedAt))
            result[5] = getDate(item.modifiedAt);
        if (item.sectionId)
            result[6] = item.sectionId;
        if (typeof item.index === "number")
            result[7] = item.index;
        if (item.due)
            result[8] = item.due;
        return result;
    }
    /**
     * Array task to object task
     * @param item
     * @param id
     * @param index
     * @returns
     */
    static unpack(item, id, index) {
        return {
            ...(id && { id: id }),
            text: item[0],
            status: Number(item[1]),
            createdAt: getDate(item[2]),
            categoryId: Number(item[3]),
            ...(item[4] && { completedAt: getDate(item[4]) }),
            ...(item[5] && { modifiedAt: getDate(item[5]) }),
            ...(item[6] && { sectionId: item[6] }),
            ...(item[7] && { index: item[7] }),
            // ...(item[8] && { due: item[8] }),
        };
    }
    static getSize(payload) {
        return sizeof(payload);
    }
}
export default FocusoTasks;
