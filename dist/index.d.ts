import { containerType, taskCategory, taskId, taskStatus, taskText, taskType } from "./types";
declare class FocusoTasks {
    containers: containerType[];
    dictionary: {
        [key: taskId]: taskType;
    };
    onAdd: Function;
    onUpdate: Function;
    onDelete: Function;
    stats: {
        [key: taskCategory]: {
            [key: taskStatus]: number;
        };
    };
    constructor(props: any);
    private getDate;
    /**
     * Add task
     * @param payload
     * @returns
     */
    add(payload: {
        text: taskText;
        category: taskCategory;
        userId: string;
    }): void;
    delete(id: taskId): void;
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
            [key: taskCategory]: {
                [key: taskStatus]: number;
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
