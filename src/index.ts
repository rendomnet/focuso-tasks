import sizeof from "firestore-size";
import {
  findByLowesValue,
  getContainerTasks,
  getDate,
  isEmptyContainer,
  setDeep,
} from "./helpers";

import {
  containerType,
  firebaseTimestamp,
  taskCategory,
  taskId,
  taskIndex,
  taskPackedType,
  taskStatus,
  taskText,
  taskType,
  sectionType,
  categoryType,
  containerIdType,
  containerSizeObjectType,
  taskSectionId,
} from "./types";

class FocusoTasks {
  containers: {
    [key: containerIdType]: containerSizeObjectType;
  },
  dictionary: {
    tasks: { [key: taskId]: taskType };
    categories: { [key: taskCategory]: categoryType };
    sections: { [key: taskSectionId]: sectionType };
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

  constructor(props: any) {
    this.userId = "";
    this.containers = {};
    this.dictionary = {
      tasks: {},
      categories: {},
      sections: {},
    };
    this.stats = {};

    this.onAdd = () => null;
    this.onUpdate = () => null;
    this.onDelete = () => null;
    this.refreshContainers;
    this.deleteContainer;
    this.onLoad;
  }

  private getSmallestContainer(): containerSizeObjectType {
    let result: containerSizeObjectType;
    for (const id in this.containers) {
      let container = this.containers[id];
      if (!result) result = container;
      else if (container?.size < result?.size) result = container;
    }
    return result;
  }

  private getTask(id: taskId) {
    const result = this.dictionary.tasks[id];
    if (!result) throw new Error(`Task ${id} not found`);
    return result;
  }

  /**
   * Add task
   * @param payload
   * @returns
   */
  async add(payload: {
    text: taskText;
    categoryId: taskCategory;
    userId: string;
    taskId?: taskId;
  }) {
    let { text, categoryId, userId, taskId } = payload;
    let timestamp = taskId ? Number(taskId) : new Date().valueOf();

    if (!taskId) taskId = String(timestamp);

    // Build task data
    const data = {
      [taskId]: FocusoTasks.pack({
        text: text,
        status: 0,
        createdAt: new Date(
          typeof taskId === "string" ? Number(taskId) : taskId
        ),
        categoryId: Number(categoryId),
      }),
    };

    const smallestContainer = this.getSmallestContainer();

    // Create new container
    // If no  containers or if latest container size exceeds 1mb
    if (!smallestContainer.size || smallestContainer.size > 999000) {
      // Create new task container
      if (this.refreshContainers) {
        const containers = await this.refreshContainers();
        if (containers?.length) {
          await this.load(containers);
        }
      }
      userId = userId || this.userId;
      if (!userId) throw new Error("Focuso Tasks: User id not defined");
      
      this.onAdd({
        data: {
          ...data,
          ownerId: userId,
          // createdAt: new Date(),
          containerId: smallestContainer.id,
        },
      });
    } else {
      if (!smallestContainer.id)
        throw new Error("Focuso Tasks: Container id not found");

      this.onUpdate({
        containerId: smallestContainer.id,
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
  delete(id: taskId) {
    const task = this.getTask(id);

    this.onDelete({
      containerId: task.containerId,
      taskId: id,
    });
  }

  /**
   * Update task
   * @param payload - object {id, value}
   */
  update(payload: { id: taskId; value: {} }) {
    const { id, value } = payload;

    const task = this.getTask(id);

    const newData = {
      ...task,
      ...value,
      modifiedAt: new Date(),
    };

    const result = FocusoTasks.pack(newData);
    this.onUpdate({
      containerId: task.containerId,
      data: {
        [id]: result,
      },
    });
  }

  /**
   * Convert firebase docs list to tasks dictionary
   * @param containerList - array of container docs
   * @returns
   */
  async load(containerList: containerType[]): Promise<{
    dictionary: Object;
    closed: { [key: string]: taskId[] };
    tree: {
      [key: taskCategory]: {
        [key: taskSectionId]: taskId[];
      };
    };
    due: Object;
    stats: {
      [key: string]: {
        [key: string]: number;
      };
    };
  }> {
    const dictionary = {
      tasks: {},
      categories: {},
      sections: {},
    };
    let closed = {};
    let tree = {};
    let due = {};
    let stats = {};

    // CONTAINERS

    for (const [index, container] of containerList.entries()) {
      //
      this.containers[container.id] = {
        size: sizeof(container),
        id: container.id,
        createdAt: container.createdAt,
        order: container.order,
      };

      // Loop container fields
      for (let taskId in container) {
        // Skip container keys that are not dictionary keys
        if (
          ["ownerId", "order", "id", "createdAt", "categories"].includes(taskId)
        )
          continue;

        const taskPacked: taskPackedType = container[taskId];
        const task = FocusoTasks.unpack(taskPacked, taskId, index);

        const categoryId = task.categoryId;
        const sectionId = task.sectionId || `defaultSection-${categoryId}`;

        const category: categoryType = container.categories?.[categoryId] || {};

        const section: sectionType = container.sections?.[sectionId] || {};

        // DICTIONARY
        dictionary.tasks[taskId] = {
          ...task,
          containerId: container.id,
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
          if (!closed[dayKey]) closed[dayKey] = {};
          if (!closed[dayKey][categoryId]) closed[dayKey][categoryId] = [];

          closed[dayKey][categoryId].push({ ...task });
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
        } else {
          setDeep(stats, [categoryId, dictionary.tasks[taskId].status], 1);
        }
      }

      this.dictionary = dictionary;
      this.stats = stats;
      if (this.onLoad) {
        this.onLoad({ dictionary, stats, closed, tree });
      }
      return {
        dictionary,
        stats,
        due,
        closed,
        tree,
      };
    }
  }

  getTaskDay(completedAt: Date): string {
    return `${completedAt.getDate()}${completedAt.getMonth()}${completedAt.getFullYear()}`;
  }

  /**
   * Task to array task
   * @param item - {text, status = 0 |1 , createdAt, categoryId id, completedAt}
   * @returns
   */
  static pack(item: taskType): taskPackedType {
    let result: taskPackedType = [
      item.text,
      Number(item.status),
      getDate(item.createdAt) || new Date(),
      Number(item.categoryId),
      getDate(item.completedAt) || null,
    ];
    if (item.modifiedAt && getDate(item.modifiedAt))
      result[5] = getDate(item.modifiedAt);
    if (item.sectionId) result[6] = item.sectionId;

    if (typeof item.index === "number") result[7] = item.index;
    if (item.due) result[8] = item.due;
    return result;
  }

  /**
   * Array task to object task
   * @param item
   * @param id
   * @param index
   * @returns
   */
  static unpack(item: taskPackedType, id: taskId, index: taskIndex): taskType {
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

  static getSize(payload: object | object[]) {
    return sizeof(payload);
  }
}

export default FocusoTasks;
