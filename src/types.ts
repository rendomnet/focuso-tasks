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
    [key: taskCategory]: string;
  };
  [key: string]: any;
};

type firebaseTimestamp = { seconds: number; nanoseconds: number };

type taskText = string;
type taskStatus = number;
type taskCategory = string;
type taskId = string;
type taskIndex = number;
type taskCreatedAt = Date;
type taskCompletedAt = Date | undefined;

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
  taskText,
  taskStatus,
  taskCreatedAt,
  taskCategory,
  taskCompletedAt?
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
