type optionsType = {
  pid: string;
  children: string;
  defaultRoot: string;
  isDir: Function;
};

type containerType = {
  id?: string;
  ownerId: string;
  order: number;
  categories?: {};
  sections?: {};
  tasks?: {};
  [key: string]: any;
};

type firebaseTimestamp = { seconds: number; nanoseconds: number };

type containerSizeObjectType = {
  size: number;
  id?: containerIdType;
  createdAt?: string;
  order?: number;
};

type containerIdType = string;
type taskText = string;
type taskStatus = number;
type taskCategory = number;
type taskId = string;
type taskIndex = number;
type taskCreatedAt = Date;
type taskCompletedAt = Date | null | undefined;
type taskModifiedAt = Date | null | undefined;
type taskSectionId = string | null | undefined;
type taskDue = { date: string } | null | undefined;

type taskType = {
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
  containerId?: containerIdType;
};

type categoryType = {
  title: string;
  id?: taskCategory;
  index?: number;
};

type sectionType = {
  title: string;
  id?: string;
  index?: number;
};

type taskPackedType = [
  taskText, // text
  taskStatus, // number status 0: notcompleted, 1, completed
  taskCreatedAt, // Date
  taskCategory, // category id number
  taskCompletedAt?, // Date
  taskModifiedAt?, //
  taskSectionId?, //
  taskIndex?,
  taskDue? //
];

export {
  taskText,
  taskCategory,
  taskStatus,
  taskType,
  containerType,
  taskPackedType,
  taskId,
  taskIndex,
  firebaseTimestamp,
  sectionType,
  categoryType,
  containerIdType,
  taskSectionId,
  containerSizeObjectType,
};
