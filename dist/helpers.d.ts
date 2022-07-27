import { containerType } from "./types";
export declare function setDeep(obj: object, keyPath: string | string[], value: any): void;
export declare function isDate(value: any): boolean;
export declare function getDate(value: any): Date;
export declare function getTimestamp(value: any): number;
export declare function isEmptyContainer(item: containerType): boolean;
