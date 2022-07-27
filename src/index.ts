import sizeof from "firestore-size";
import { getDate, isEmptyContainer, setDeep } from "./helpers";

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

  private getContainer(order: number) {
    const result = this.containers.find((item) => item.order === order);
    if (!result) throw new Error(`Task container ${order} not found`);
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
  }) {
    let { text, category, userId } = payload;
    const timestamp = new Date().valueOf();

    // Build task data
    const data = {
      [timestamp]: this.pack({
        text: text,
        status: 0,
        createdAt: new Date(timestamp),
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
    const container = this.getContainer(task.order);

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
    const container = this.getContainer(task.order);

    const newData = {
      ...task,
      ...value,
    };

    const result = this.pack(newData);
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
    let lowContainers = [];
    let result = [];
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
      if (isEmptyContainer(item)) {
        await this.deleteContainer(item.id);
        continue;
      }

      // Detect low containers
      if (Object.keys(item).length < 20) {
        lowContainers.push(item);
        continue;
      }

      result.push(item);
    }

    // Merge low containers
    if (lowContainers.length > 1) {
      // TODO MERGE
      result = [...result, ...lowContainers];
    }

    return result;
  }

  /**
   * Convert firebase docs list to tasks dictionary
   * @param containerList - array of container docs
   * @returns
   */
  async load(containerList: containerType[]): Promise<{
    dictionary: { [key: taskId]: taskType };
    stats: {
      [key: string]: {
        [key: string]: number;
      };
    };
  }> {
    const dictionary = {};
    let list = await this.sanitizeContainers(containerList);

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

          dictionary[key] = {
            ...this.unpack(taskPacked, key, index),
            order: container.order,
          };

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
        this.onLoad({ dictionary, stats });
      }
      return {
        dictionary,
        stats,
      };
    }
  }

  /**
   * Task to array task
   * @param item
   * @returns
   */
  private pack(item: taskType): taskPackedType {
    return [
      item.text,
      Number(item.status),
      item.createdAt,
      Number(item.category),
      item.completedAt || null,
    ];
  }

  /**
   * Array task to object task
   * @param item
   * @param id
   * @param index
   * @returns
   */
  private unpack(item: taskPackedType, id: taskId, index: taskIndex): taskType {
    return {
      text: item[0],
      status: Number(item[1]),
      createdAt: getDate(item[2]),
      category: Number(item[3]),
      completedAt: getDate(item[4]) || null,
      id: id,
      ...(index &&
        index > 0 && {
          order: index,
        }),
    };
  }
}

export default FocusoTasks;
