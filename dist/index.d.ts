import { containerType, taskCategory, taskId, taskStatus, taskText, taskType } from "./types";
declare class FocusoTasks {
    containers: containerType[];
    dictionary: {
        [key: taskId]: taskType;
    };
    onAdd: Function;
    onUpdate: Function;
    onDelete: Function;
    getContainers: Function;
    userId: string;
    stats: {
        [key: taskCategory]: {
            [key: taskStatus]: number;
        };
    };
    constructor(props: any);
    getContainer(order: number): 0 | containerType;
    /**
     * Add task
     * @param payload
     * @returns
     */
    add(payload: {
        text: taskText;
        category: taskCategory;
        userId: string;
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
     * Convert firebase docs list to tasks dictionary
     * @param containerList - array of container docs
     * @returns
     */
    load(containerList: containerType[]): {
        dictionary: {
            [key: taskId]: taskType;
        };
        stats: {
            [key: string]: {
                [key: string]: number;
            };
        };
    };
    /**
     * Task to array task
     * @param item
     * @returns
     */
    private pack;
    /**
     * Array task to object task
     * @param item
     * @param id
     * @param index
     * @returns
     */
    private unpack;
}
export default FocusoTasks;
