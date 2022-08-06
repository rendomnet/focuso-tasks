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
  categories?: {
    [key: string]: string;
  };
  [key: string]: any;
};

type firebaseTimestamp = { seconds: number; nanoseconds: number };

type taskText = string;
type taskStatus = number;
type taskCategory = number;
type taskId = string;
type taskIndex = number;
type taskCreatedAt = Date;
type taskCompletedAt = Date | null;

type taskType = {
  id?: taskId;
  text: taskText;
  status: taskStatus;
  category: taskCategory;
  createdAt: taskCreatedAt;
  completedAt?: taskCompletedAt;
  order?: number;
};

type taskPackedType = [
  taskText, // text
  taskStatus, // number status 0: notcompleted, 1, completed
  taskCreatedAt, // Date
  taskCategory, // category id number
  taskCompletedAt? // Date
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
};
