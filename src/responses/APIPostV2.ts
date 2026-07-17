import { Revivable } from "../components/UtilType";
import { APITagCategory } from "./APITag";

// #region Helper Types
type StatusFlag = "pending" | "flagged" | "note_locked" | "status_locked" | "rating_locked" | "deleted";
type FileExtension = "jpg" | "png" | "gif" | "webm" | "webp" | "mp4" | "swf";
type Rating = "s" | "q" | "e";
type TagMap = { [key in Lowercase<keyof typeof APITagCategory>]-?: string[] };
type SourceUrl = { isDead: boolean, url: URL, raw: string };
type ImageData<T extends boolean = boolean> = {
    width: number,
    height: number,
    url: Revivable<URL, string, T>,
};
type SampledImageData<T extends boolean = boolean> = {
    width: number,
    height: number,
    jpg: Revivable<URL, string, T>,
    webp: Revivable<URL, string, T>,
};
type VideoSpecificData = {
    fps: number,
    codec: string,
    size: number,
};
type VideoData<T extends boolean = boolean> = Pick<ImageData<T> & VideoSpecificData, keyof (ImageData<T> & VideoSpecificData)>;
type FilesData<T extends boolean = boolean> = {
    meta: {
        md5: string,
        ext: FileExtension,
        size: number,
        duration: number | null,
        has_sample: boolean,
    },
    original: ImageData<T>,
    preview: SampledImageData<T>,
    sample: SampledImageData<T>,
    video?: {
        has: true,
        original: VideoData<T>,
        variants: Record<string, never> | { mp4: VideoData<T> },
        samples: {
            "480p": VideoData<T>,
            "720p": VideoData<T>,
        },
    },
};
// #endregion Helper Types

// #region Basic
/**
 * @todo Leverage [`Extract<T, U>`](https://www.typescriptlang.org/docs/handbook/utility-types.html#extracttype-union)
 */
export type ApiPostBasic<T extends boolean = boolean> = {
    id: number,
    created_at: Revivable<Date, string, T>,
    updated_at: Revivable<Date, string, T>,
    change_seq: number,
    files: FilesData<T>,
    uploader_id: number,
    uploader_name: string,
    approver_id: number,
    stats: {
        score: {
            up: number,
            down: number,
            total: number,
        },
        fav_count: number,
        is_favorited: boolean,
        vote: number,
        comment_count: number,
    },
    flags: { [k in StatusFlag]-?: boolean },
    has: {
        parent: boolean,
        children: boolean,
        active_children: boolean,
        notes: boolean,
        sample: boolean,
    },
    relationships: {
        parent_id: number | null,
        children: number[],
    },
    pools: number[],
    rating: Rating,
    locked_tags: string[],
    sources: Revivable<SourceUrl[], string[], T>,
    description: string | null,
    tags: string[],
};

type ApiPostBasicRevivedFields = {
    created_at: ApiPostBasic<true>["created_at"],
    updated_at: ApiPostBasic<true>["updated_at"],
    url: ApiPostBasic<true>["files"]["original"]["url"],
    jpg: ApiPostBasic<true>["files"]["preview"]["jpg"],
    webp: ApiPostBasic<true>["files"]["preview"]["webp"],
    sources: ApiPostBasic<true>["sources"],
};
const basicRevivedKeys: Readonly<(keyof ApiPostBasicRevivedFields)[]> = Object.freeze([
    "created_at",
    "updated_at",
    "url",
    "jpg",
    "webp",
    "sources",
]);
function postBasicReviver<Key extends keyof ApiPostBasicRevivedFields>(key: Key, value: any, context?: { source: string }): ApiPostBasicRevivedFields[Key] {
    switch (key) {
        case "updated_at":
        case "created_at":
            if (typeof value === "object") return value;
            return new Date(value as string) as any;
        case "url":
        case "jpg":
        case "webp":
            if (typeof value === "object") return value;
            return new URL(value as string) as any;
        case "sources":
            if (typeof value === "object") return value;
            return (value as string[]).map(e => e[0] === "-" ? { isDead: true, url: new URL(e.substring(1)), raw: e } : { isDead: false, url: new URL(e), raw: e }) as any;
        default: return value;
    }
}
export namespace ApiPostBasic {
    export function fromBasicJson(json: string | ApiPostBasic) {
        if (typeof json === "string") return JSON.parse(json, postBasicReviver as (key: string, value: any) => any);
        for (const element of basicRevivedKeys) {
            (json[element] as ApiPostBasicRevivedFields[typeof element]) = postBasicReviver(element, json[element]);
        }
        return json as ApiPostBasic<true>;
    }
}
// #endregion Basic

// #region Extended
export type ApiPostExtended<T extends boolean = boolean> = Pick<Omit<ApiPostBasic<T>, "tags"> & { tags: TagMap }, keyof ApiPostBasic>;

type ApiPostExtendedRevivedFields<Revived extends boolean = true> = {
    created_at: Revivable<Date, string, Revived>,
    updated_at: Revivable<Date, string, Revived>,
    url: Revivable<URL, string, Revived>,
    jpg: Revivable<URL, string, Revived>,
    webp: Revivable<URL, string, Revived>,
    sources: Revivable<SourceUrl[], string[], Revived>,
};
const extendedRevivedKeys: Readonly<(keyof ApiPostExtendedRevivedFields)[]> = Object.freeze([
    "created_at",
    "updated_at",
    "url",
    "jpg",
    "webp",
    "sources",
]);
function postExtendedReviver<Key extends keyof ApiPostExtendedRevivedFields>(key: Key, value: any, context?: { source: string }): ApiPostExtendedRevivedFields[Key] {
    switch (key) {
        case "updated_at":
        case "created_at":
            if (typeof value === "object") return value;
            return new Date(value as string) as any;
        case "url":
        case "jpg":
        case "webp":
            if (typeof value === "object") return value;
            return new URL(value as string) as any;
        case "sources":
            if (typeof value === "object") return value;
            return (value as string[]).map(e => e[0] === "-" ? { isDead: true, url: new URL(e.substring(1)), raw: e } : { isDead: false, url: new URL(e), raw: e }) as any;
        default: return value;
    }
}
export namespace ApiPostExtended {
    export function fromExtendedJson(json: string | ApiPostExtended) {
        if (typeof json === "string") return JSON.parse(json, postExtendedReviver as (key: string, value: any) => any);
        for (const element of extendedRevivedKeys) {
            (json[element] as ApiPostExtendedRevivedFields[typeof element]) = postExtendedReviver(element, json[element]);
        }
        return json as ApiPostExtended<true>;
    }
}
// #endregion Extended

// #region Thumbnail
export type ApiPostThumbnail<IsRevived extends boolean = boolean> = {
    id: number,
    created_at: Revivable<Date, string, IsRevived>,
    md5: string,
    file_ext: FileExtension,
    width: number,
    height: number,
    size: number,
    /** jpg */
    preview_url: Revivable<URL, string, IsRevived>,
    preview_webp: Revivable<URL, string, IsRevived>,
    sample_url: Revivable<URL, string, IsRevived>,
    file_url: Revivable<URL, string, IsRevived>,
    preview_width: number,
    preview_height: number,
    uploader_id: number,
    uploader: string,
    approver_id: number,
    score: number,
    fav_count: number,
    is_favorited: boolean,
    vote: number,
    comment_count: number,
    /** Space-separated list of statuses (e.g. `pending`, `flagged`, `deleted`). */
    flags: Revivable<StatusFlag[], string, IsRevived>,
    /** Space-separated list of pool ids or an empty string. */
    pools: Revivable<number[], string, IsRevived>,
    rating: Rating,
    /** Space-separated list of tags. */
    tags: Revivable<string[], string, IsRevived>,
};
type ApiPostThumbnailFieldsAfterRevive = {
    created_at: Date,
    preview_url: URL,
    preview_webp: URL,
    sample_url: URL,
    file_url: URL,
    flags: StatusFlag[],
    pools: number[],
    tags: string[],
};

const thumbnailRevivedKeys = Object.freeze([
    "created_at", //: Date,
    "preview_url", //: JsonUrl,
    "preview_webp", //: JsonUrl,
    "sample_url", //: JsonUrl,
    "file_url", //: JsonUrl,
    "flags", //: string,
    "pools", //: number[] | string,
    "tags", //: string[] | string,
]);
function postThumbnailReviver<Key extends keyof ApiPostThumbnailFieldsAfterRevive>(key: Key, value: any, context?: { source: string }): ApiPostThumbnailFieldsAfterRevive[Key] {
    if (!thumbnailRevivedKeys.includes(key)) return value;
    switch (key) {
        // case "updated_at":
        case "created_at":
            if (typeof value === "object") return value;
            return new Date(value as string) as any;
        case "preview_url":
        case "preview_webp":
        case "sample_url":
        case "file_url":
            if (typeof value === "object") return value;
            return new URL(value as string) as any;
        case "flags":
        case "tags":
            if (typeof value === "object") return value;
            return (value as string).split(" ") as any;
        case "pools":
            if (typeof value === "object") return value;
            return (value as string).split(" ").map(e => parseInt(e)) as any;
    
        default:
            return value;
    }
}
export function fromThumbnailJson(json: string | ApiPostThumbnail) {
    if (typeof json === "string") return JSON.parse(json, postThumbnailReviver as (key: string, value: any) => any) as ApiPostThumbnail<true>;
    for (const element of thumbnailRevivedKeys as (keyof ApiPostThumbnailFieldsAfterRevive)[]) {
        (json[element] as any) = postThumbnailReviver(element, json[element]);
    }
    return json as ApiPostThumbnail<true>;
}
// #endregion Thumbnail

export namespace APIPost {

    export function getTags(post: ApiPostBasic | ApiPostExtended | ApiPostThumbnail): string[] {
        if (typeof post.tags === "string")
            return post.tags.split(/\s/);
        if (post.tags instanceof Array)
            return post.tags;
        return [
            ...post.tags.artist,
            ...post.tags.character,
            ...post.tags.copyright,
            ...post.tags.general,
            ...post.tags.invalid,
            ...post.tags.lore,
            ...post.tags.meta,
            ...post.tags.species
        ];
    }

    export function getTagString(post: ApiPostBasic | ApiPostExtended | ApiPostThumbnail): string {
        return APIPost.getTags(post).join(" ");
    }

    export function getTagSet(post: ApiPostBasic | ApiPostExtended | ApiPostThumbnail): Set<string> {
        return new Set(APIPost.getTags(post));
    }

}

/*
// Post Rating
export enum PostRating {
    Safe = "s",
    Questionable = "q",
    Explicit = "e"
}

export namespace PostRating {
    const ratingRef = {
        "s": PostRating.Safe,
        "safe": PostRating.Safe,
        "q": PostRating.Questionable,
        "questionable": PostRating.Questionable,
        "e": PostRating.Explicit,
        "explicit": PostRating.Explicit,
    };

    export function fromValue(value: string): PostRating {
        return ratingRef[value.toLowerCase()];
    }

    export function toString(postRating: PostRating): string {
        for (const key of Object.keys(PostRating)) {
            if (PostRating[key] === postRating) {
                return key;
            }
        }
        return undefined;
    }

    export function toFullString(postRating: PostRating): string {
        switch (postRating.toLowerCase()) {
            case "s": return "safe";
            case "q": return "questionable";
            case "e": return "explicit";
        }
        return null;
    }
}
*/


// Post Flag
/*
export enum PostFlag {
    Pending = "pending",    // Post in the mod queue that has not been approved / disapproved yet
    Flagged = "flagged",    // Post that has been flagged for moderation - duplicate, DNP, etc
    Deleted = "deleted",    // Post that has been deleted. Indicates that the image file will return `null`

    // Locked
    NoteLocked = "note_locked",
    StatusLocked = "status_locked",
    RatingLocked = "rating_locked",
}

export namespace PostFlag {

    export function get(post: APIPost): PostFlag[] {
        const flags: PostFlag[] = [];
        if (post.flags.deleted) flags.push(PostFlag.Deleted);
        if (post.flags.flagged) flags.push(PostFlag.Flagged);
        if (post.flags.pending) flags.push(PostFlag.Pending);
        return flags;
    }

    export function getString(post: APIPost): string {
        return PostFlag.get(post).join(" ");
    }

    export function fromString(input: string): Set<PostFlag> {
        const parts = new Set(input.split(" "));
        const flags: Set<PostFlag> = new Set();
        if (parts.has("deleted")) flags.add(PostFlag.Deleted);
        if (parts.has("flagged")) flags.add(PostFlag.Flagged);
        if (parts.has("pending")) flags.add(PostFlag.Pending);
        return flags;
    }
}
*/
