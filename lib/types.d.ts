declare type containerType = {
    id?: string;
    ownerId: string;
    order: number;
    categories?: {};
    sections?: {};
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
declare type taskSectionId = string | null | undefined;
declare type taskDue = {
    date: string;
} | null | undefined;
declare type taskType = {
    text: taskText;
    status: taskStatus;
    category?: taskCategory;
    categoryId?: taskCategory;
    sectionId?: taskSectionId;
    due?: taskDue;
    createdAt: taskCreatedAt;
    completedAt?: taskCompletedAt;
    modifiedAt?: taskModifiedAt;
    order?: number;
    id?: taskId;
    index?: taskIndex;
};
declare type categoryType = {
    title: string;
    id?: taskCategory;
    index?: number;
};
declare type sectionType = {
    title: string;
    id?: string;
    index?: number;
};
declare type taskPackedType = [
    taskText,
    taskStatus,
    taskCreatedAt,
    taskCategory,
    taskCompletedAt?,
    taskModifiedAt?,
    taskSectionId?,
    taskIndex?,
    taskDue?
];
export { taskText, taskCategory, taskStatus, taskType, containerType, taskPackedType, taskId, taskIndex, firebaseTimestamp, sectionType, categoryType, };
