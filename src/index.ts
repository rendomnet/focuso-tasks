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
} from "./types";

class FocusoTasks {
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

  constructor(props: any) {
    this.userId = "";
    this.containers = [];
    this.dictionary = {};
    this.stats = {};

    this.onAdd = () => null;
    this.onUpdate = () => null;
    this.onDelete = () => null;
    this.refreshContainers;
    this.deleteContainer;
    this.onLoad;
  }

  private getContainer(params: { taskId: taskId; order: number }) {
    const { taskId, order } = params;
    const result = this.containers.find((item) => {
      if (taskId) return item[taskId];
      else return item.order === order;
    });

    if (!result)
      throw new Error(
        `Task container not found taskId: ${taskId}, order: ${order}`
      );
    return result;
  }

  private getTask(id: taskId) {
    const result = this.dictionary[id];
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
    category: taskCategory;
    userId: string;
    taskId?: taskId;
  }) {
    let { text, category, userId, taskId } = payload;
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
        category: Number(category),
      }),
    };

    const containerLatest: { id?: string } =
      this.containers[this.containers.length - 1] || {};

    // Create new container
    // If no  containers or if latest container size exceeds 1mb
    if (
      this.containers.length < 1 ||
      sizeof({ ...containerLatest, ...data }) > 999000
    ) {
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
          order: this.containers.length < 1 ? 0 : this.containers.length - 1,
        },
      });
    } else {
      if (!containerLatest.id)
        throw new Error("Focuso Tasks: Container id not found");

      this.onUpdate({
        containerId: containerLatest.id,
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
    const container = this.getContainer({ taskId: id, order: task.order });

    this.onDelete({
      containerId: container.id,
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
    const container = this.getContainer({ taskId: id, order: task.order });

    const newData = {
      ...task,
      ...value,
      modifiedAt: new Date(),
    };

    const result = FocusoTasks.pack(newData);
    this.onUpdate({
      containerId: container.id,
      data: {
        [id]: result,
      },
    });
  }

  /**
   * Remove invalid containers
   * @param containerList
   */
  async sanitizeContainers(
    containerList: containerType[]
  ): Promise<containerType[]> {
    let byOrder = {};
    let lowContainers: containerType[] = [];
    let result: containerType[] = [];
    for (const item of containerList) {
      // Add to dictionary by order
      if (item.order && !byOrder[item.order]) {
        byOrder[item.order] = byOrder[item.order]
          ? byOrder[item.order].push(item)
          : [byOrder[item.order]];

        if (byOrder[item.order].length > 1) {
          // Duplicate found
          const lessKeys = byOrder[item.order].reduce((prev, current) => {
            return Object.keys(prev).length < Object.keys(current).length
              ? prev
              : current;
          });

          if (this.deleteContainer) {
            if (lessKeys.id) await this.deleteContainer(lessKeys.id);
            continue;
          }
        }
      }
      // Delete invalid containers
      if (this.deleteContainer) {
        if (typeof item.order === "undefined") {
          this.deleteContainer(item.id);
          continue;
        }
      }

      // Detect empty containers
      // This will delete any new containers
      // if (isEmptyContainer(item)) {
      //   await this.deleteContainer(item.id);
      //   continue;
      // }

      result.push(item);
    }

    // If 1 low container
    // result = [...result, ...lowContainers];

    return result;
  }

  /**
   * Convert firebase docs list to tasks dictionary
   * @param containerList - array of container docs
   * @returns
   */
  async load(containerList: containerType[]): Promise<{
    dictionary: { [key: taskId]: taskType };
    completed: { [key: string]: taskId[] };
    active: taskId[];
    stats: {
      [key: string]: {
        [key: string]: number;
      };
    };
  }> {
    const dictionary = {};
    const completed = {};
    const active = [];
    let that = this;
    let list = containerList;
    // let list = await this.sanitizeContainers(containerList);

    // Sort by order
    let sorted = list.sort((a, b) => a.order - b.order);

    this.containers = [...sorted];

    if (sorted?.length > 0) {
      let stats = {
        0: { 0: 0, 1: 0 },
      };

      for (const [index, container] of sorted.entries()) {
        // Loop container
        for (let key in container) {
          // Skip container keys that are not dictionary keys
          if (["ownerId", "order", "id", "createdAt"].includes(key)) continue;

          const taskPacked: taskPackedType = container[key];

          const task = FocusoTasks.unpack(taskPacked, key, index);
          dictionary[key] = {
            ...task,
            order: container.order,
          };

          // Build completed days
          if (task.completedAt) {
            const dayKey = this.getTaskDay(task.completedAt);
            if (completed.hasOwnProperty(dayKey))
              completed[dayKey].push(task.id);
            else completed[dayKey] = [task.id];
          }

          // Build active tasks
          if (task.status === 0) {
            active.push(task.id);
          }

          // Count categories
          const categoryId = dictionary[key].category;

          if (stats?.[categoryId]?.[dictionary[key].status]) {
            stats[categoryId][dictionary[key].status]++;
          } else {
            setDeep(stats, [categoryId, dictionary[key].status], 1);
          }
        }
      }

      this.dictionary = dictionary;
      this.stats = stats;
      if (this.onLoad) {
        this.onLoad({ dictionary, stats, completed, active });
      }
      return {
        dictionary,
        stats,
        completed,
        active,
      };
    }
  }

  getTaskDay(completedAt: Date): string {
    return `${completedAt.getDate()}${completedAt.getMonth()}${completedAt.getFullYear()}`;
  }

  mergeLowContainers() {
    let lowContainers = [];
    for (const container of this.containers) {
      // Detect low containers
      if (Object.keys(container).length < 20) lowContainers.push(container);
    }

    console.log("lowContainers", lowContainers);

    // Merge low containers
    if (lowContainers.length > 1) {
      // TODO MERGE
      const lowestOrderContainer: containerType = findByLowesValue(
        lowContainers,
        "order"
      );

      let mergedContainer = {};
      let containersIdsToDelete = [];
      if (lowestOrderContainer?.id) {
        for (const container of lowContainers) {
          if (container.id === lowestOrderContainer.id) continue;

          let tasks = getContainerTasks(container);
          mergedContainer = { ...mergedContainer, ...tasks };
          containersIdsToDelete.push(container.id);
        }

        // Add order, ownerId
        mergedContainer = { ...mergedContainer, ...lowestOrderContainer };
        // todo Save merged
        // todo Delete rest
        console.log("mergedContainer", mergedContainer);
      }
    }
  }

  /**
   * Task to array task
   * @param item - {text, status = 0 |1 , createdAt, category id, completedAt}
   * @returns
   */
  static pack(item: taskType): taskPackedType {
    let result: taskPackedType = [
      item.text,
      Number(item.status),
      getDate(item.createdAt) || new Date(),
      Number(item.category),
      getDate(item.completedAt) || null,
    ];
    if (item.modifiedAt && getDate(item.modifiedAt))
      result[5] = getDate(item.modifiedAt);

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
      text: item[0],
      status: Number(item[1]),
      createdAt: getDate(item[2]),
      category: Number(item[3]),
      ...(item[4] && { completedAt: getDate(item[4]) }),
      ...(item[5] && { modifiedAt: getDate(item[5]) }),
      ...(id && { id: id }),
      ...(index &&
        index > 0 && {
          order: index,
        }),
    };
  }

  static getSize(payload: object | object[]) {
    return sizeof(payload);
  }
}

export default FocusoTasks;
