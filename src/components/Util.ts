import UtilID from "./UtilID";
import UtilMath from "./UtilMath";
import UtilType, { PrimitiveType } from "./UtilType";

export default class Util {

    public static Math = UtilMath;
    public static ID = UtilID;
    public static Type = UtilType;

    /** Returns `true` if the environment is a browser window, `false` if it's a node process */
    public static readonly isBrowser = typeof process === "undefined";

    /**
     * Returns a Promise that resolves when the specified time elapses
     * @param {number} timeout Wait time (in ms)
     */
    public static async sleep(timeout: number): Promise<void> {
        return new Promise((resolve) => { setTimeout(() => { resolve(); }, timeout) });
    }

    /**
     * URL-encodes the provided value
     * @param {string} value Original value
     * @returns {string} Encoded value
     */
    public static encode(value: PrimitiveType): string {
        return encodeURIComponent(value + "");
    }

    /**
     * Iterates over an array, URL-encoding its elements
     * @param {PrimitiveType[]} array Original array
     * @returns {string[]} Encoded array
     */
    public static encodeArray(array: PrimitiveType[]): string[] {
        const result: string[] = [];
        for (const value of array)
            result.push(this.encode(value));
        return result;
    }

    /**
     * Environment-independent implementation of BTOA.  
     * Uses a native method in the browsers, falls back to Node alternative otherwise
     * @param {string} input Input string
     * @returns {string} Base64 output
     */
    public static btoa(input: string): string {
        if (this.isBrowser) return btoa(input);
        else return Buffer.from(input).toString("base64");
    }

    /**
     * Environment-independent implementation of ATOB.  
     * Uses a native method in the browsers, falls back to Node alternative otherwise
     * @param {string} input Base64 input
     * @returns {string} Output string
     */
    public static atob(input: string): string {
        if (this.isBrowser) return atob(input);
        else return Buffer.from(input, "base64").toString();
    }
}

