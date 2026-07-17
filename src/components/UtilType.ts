export default class UtilType {

    public static prefix(prefix: string, data: Partial<SimpleMap>): SimpleMap {
        const result: SimpleMap = {};
        for (const [key, value] of Object.entries(data))
            if (value !== undefined)
                result[prefix + `[${key}]`] = value;
        return result;
    }
}

export type PrimitiveType = string | boolean | number;
export type SimpleMap = { [prop: string]: PrimitiveType };
export type PrimitiveMap = { [prop: string]: PrimitiveType | PrimitiveType[] | PrimitiveMap | undefined };
export type StringMap = { [prop: string]: string };

/** 
 * Allows representing the initial, raw value, & the fully parsed & formatted
 * object with the same type. `true` for `Revived`, `false` for `Raw`, &
 * `boolean` (the default value) for the union.
 * 
 * Example usages would be for a JSON output that contains a string of
 * comma-separated `string` values.
 */
export type Revivable<Revived, Raw, T extends boolean = boolean> = T extends true ? Revived : T extends false ? Raw : Revived | Raw;
