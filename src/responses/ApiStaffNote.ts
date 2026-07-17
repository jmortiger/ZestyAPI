import { Revivable } from "../components/UtilType";

export type ApiStaffNote<Revived extends boolean = true> = {
    id:         number;
    created_at: Revivable<Date, string, Revived>;
    updated_at: Revivable<Date, string, Revived>;
    user_id:    number;
    creator_id: number;
    body:       string;
    is_deleted: boolean;
    updater_id: number;
}

function staffNoteReviver<Key extends "created_at" | "updated_at">(key: Key, value: any, context?: { source: string }): ApiStaffNote<true>[Key] {
    switch (key) {
        case "updated_at":
        case "created_at":
            if (typeof value === "object") return value;
            return new Date(value as string) as any;
        default: return value;
    }
}

namespace ApiStaffNote {
    export const jsonKeys = Object.freeze([
        "id",
        "created_at",
        "updated_at",
        "user_id",
        "creator_id",
        "body",
        "is_deleted",
        "updater_id",
    ]);
    export function fromJson(json: string | ApiStaffNote) {
        if (typeof json === "string") return JSON.parse(json, staffNoteReviver as (key: string, value: any) => any);
        for (const element of ["created_at", "updated_at"] as ("created_at" | "updated_at")[]) {
            (json[element] as ApiStaffNote<true>[typeof element]) = staffNoteReviver(element, json[element]);
        }
        return json as ApiStaffNote<true>;
    }
}
