import sizeof from "firestore-size";
import { getDate, setDeep } from "./helpers";

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
  getContainers: Function;
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

    this.load = () => null;
    this.onAdd = () => null;
    this.onUpdate = () => null;
    this.onDelete = () => null;
    this.getContainers;
  }

  getContainer(order: number) {
    const result = this.containers.find((item) => item.order === order);
    return result || 0;
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

    // Create new container
    // If no  containers or if latest container size exceeds 1mb
    const containerLatest: { id?: string } =
      this.containers[this.containers.length - 1] || {};

    if (
      this.containers.length < 1 ||
      sizeof({ ...containerLatest, ...data }) > 999000
    ) {
      // Create new task container
      if (this.getContainers) {
        const containers = await this.getContainers();
        if (containers?.length) {
          this.load(containers);
        }
      }
      userId = userId || this.userId;
      if (!userId) throw new Error("Focuso Tasks: User id not defined");
      this.onAdd({
        data: {
          ...data,
          ownerId: userId,
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
    const task = this.dictionary[id];
    const containerId = this.containers[task?.order || 0].id;

    this.onDelete({
      containerId: containerId,
      taskId: id,
    });
  }

  /**
   * Update task
   * @param payload - object {id, value}
   */
  update(payload: { id: taskId; value: {} }) {
    const { id, value } = payload;

    const task = this.dictionary[id];

    const containerId = this.containers[task?.order || 0]?.id;
    if (!containerId) throw new Error("Focuso Tasks: Container id not found");

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

    // TODO: Sanitize duplicate containers
    // let keyed = {};
    // let order0 = containerList.map((item) => {
    //   if (!keyed[item.order]) {
    //     keyed[item.order] = keyed[item.order] ? keyed[item.order] + 1 : 1;
    //     if (keyed[item.order] > 1) {
    //       // Duplicate found
    //     }
    //   }
    // });

    // Sort by order
    containerList = containerList.sort((a, b) => a.order - b.order);

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
