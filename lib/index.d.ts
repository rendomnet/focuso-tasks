import { containerType, taskCategory, taskId, taskIndex, taskPackedType, taskStatus, taskText, taskType } from "./types";
declare class FocusoTasks {
    containers: containerType[];
    dictionary: {
        [key: taskId]: taskType;
    };
    onAdd: Function;
    onUpdate: Function;
    onDelete: Function;
    onLoad: Function;
    pack: Function;
    unpack: Function;
    refreshContainers: Function;
    deleteContainer: Function;
    userId: string;
    stats: {
        [key: taskCategory]: {
            [key: taskStatus]: number;
        };
    };
    constructor(props: any);
    private getContainer;
    private getTask;
    /**
     * Add task
     * @param payload
     * @returns
     */
    add(payload: {
        text: taskText;
        category: taskCategory;
        userId: string;
        taskId?: taskId;
    }): Promise<void>;
    /**
     * Delete single task
     * @param id - task id
     */
    delete(id: taskId): void;
    /**
     * Update task
     * @param payload - object {id, value}
     */
    update(payload: {
        id: taskId;
        value: {};
    }): void;
    /**
     * Remove invalid containers
     * @param containerList
     */
    sanitizeContainers(containerList: containerType[]): Promise<containerType[]>;
    /**
     * Convert firebase docs list to tasks dictionary
     * @param containerList - array of container docs
     * @returns
     */
    load(containerList: containerType[]): Promise<{
        dictionary: {
            [key: taskId]: taskType;
        };
        stats: {
            [key: string]: {
                [key: string]: number;
            };
        };
    }>;
    mergeLowContainers(): void;
    /**
     * Task to array task
     * @param item - {text, status = 0 |1 , createdAt, category id, completedAt}
     * @returns
     */
    static pack(item: taskType): taskPackedType;
    /**
     * Array task to object task
     * @param item
     * @param id
     * @param index
     * @returns
     */
    static unpack(item: taskPackedType, id: taskId, index: taskIndex): taskType;
    static getSize(payload: object | object[]): number;
}
export default FocusoTasks;
