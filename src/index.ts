import sizeof from "firestore-size";
import { setDeep } from "./helpers";

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
  stats: {
    [key: taskCategory]: {
      [key: taskStatus]: number;
    };
  };

  constructor(props: any) {
    this.containers = [];

    this.dictionary = {};
    this.stats = {};
    this.onAdd = () => null;
    this.onUpdate = () => null;
    this.onDelete = () => null;
  }

  private getDate(value: Date): Date {
    return value;
    // return !value
    //   ? new Date()
    //   : value.seconds
    //   ? new Date(value.seconds * 1000)
    //   : new Date(value);
  }

  /**
   * Add task
   * @param payload
   * @returns
   */
  add(payload: { text: taskText; category: taskCategory; userId: string }) {
    const { text, category, userId } = payload;
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

    // Create new container
    // If no  containers or if latest container size exceeds 1mb

    const containerLatest = this.containers[this.containers.length - 1] || null;

    if (this.containers.length < 1 || sizeof(containerLatest) > 999000) {
      this.onAdd({
        data: {
          ...data,
          ownerId: userId,
          order: this.containers.length - 1,
        },
      });
    } else {
      if (!containerLatest?.id) return;

      this.onUpdate({
        containerId: containerLatest.id,
        data: {
          ...data,
        },
      });
    }
  }

  delete(id: taskId) {
    const task = this.dictionary[id];
    const containerId = this.containers[task?.order || 0].id;

    this.onDelete({
      containerId: containerId,
      taskId: id,
    });
  }

  update(payload: { id: taskId; value: {} }) {
    const { id, value } = payload;

    const task = this.dictionary[id];

    const containerId = this.containers[task?.order || 0].id;

    const newData = {
      ...task,
      ...value,
    };

    const result = this.pack(newData);
    this.onUpdate({
      containerId: containerId,
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
  load(containerList: containerType[]): {
    dictionary: { [key: taskId]: taskType };
    stats: {
      [key: string]: {
        [key: string]: number;
      };
    };
  } {
    const dictionary = {};

    this.containers = [...containerList];

    if (containerList?.length > 0) {
      let stats = {
        0: { 0: 0, 1: 0 },
      };

      for (const [index, container] of containerList.entries()) {
        // Loop container
        for (let key in container) {
          // Skip container keys that are not dictionary keys
          if (["ownerId", "order", "id"].includes(key)) continue;

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
      createdAt: this.getDate(item[2]),
      category: Number(item[3]),
      completedAt: this.getDate(item[4]) || null,
      id: id,
      ...(index &&
        index > 0 && {
          order: index,
        }),
    };
  }
}

export default FocusoTasks;
