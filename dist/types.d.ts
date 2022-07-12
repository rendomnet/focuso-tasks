declare type containerType = {
    id?: string;
    ownerId: string;
    order: number;
    categories?: {
        [key: taskCategory]: string;
    };
    [key: string]: any;
};
declare type firebaseTimestamp = {
    seconds: number;
    nanoseconds: number;
};
declare type taskText = string;
declare type taskStatus = number;
declare type taskCategory = string;
declare type taskId = string;
declare type taskIndex = number;
declare type taskCreatedAt = Date;
declare type taskCompletedAt = Date | undefined;
declare type taskType = {
    id?: taskId;
    text: taskText;
    status: taskStatus;
    category: taskCategory;
    createdAt: taskCreatedAt;
    completedAt?: taskCompletedAt;
    order?: number;
};
declare type taskPackedType = [
    taskText,
    taskStatus,
    taskCreatedAt,
    taskCategory,
    taskCompletedAt?
];
export { taskText, taskCategory, taskStatus, taskType, containerType, taskPackedType, taskId, taskIndex, firebaseTimestamp, };
