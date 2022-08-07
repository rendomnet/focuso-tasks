declare type containerType = {
    id?: string;
    ownerId: string;
    order: number;
    categories?: {
        [key: string]: string;
    };
    [key: string]: any;
};
declare type firebaseTimestamp = {
    seconds: number;
    nanoseconds: number;
};
declare type taskText = string;
declare type taskStatus = number;
declare type taskCategory = number;
declare type taskId = string;
declare type taskIndex = number;
declare type taskCreatedAt = Date;
declare type taskCompletedAt = Date | null | undefined;
declare type taskModifiedAt = Date | null | undefined;
declare type taskType = {
    text: taskText;
    status: taskStatus;
    category: taskCategory;
    createdAt: taskCreatedAt;
    completedAt?: taskCompletedAt;
    modifiedAt?: taskModifiedAt;
    order?: number;
    id?: taskId;
};
declare type taskPackedType = [
    taskText,
    taskStatus,
    taskCreatedAt,
    taskCategory,
    taskCompletedAt?,
    taskModifiedAt?
];
export { taskText, taskCategory, taskStatus, taskType, containerType, taskPackedType, taskId, taskIndex, firebaseTimestamp, };
