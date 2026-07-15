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
