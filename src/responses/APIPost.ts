import APIResponse from "./APIResponse";

/**
 * @deprecated In the process of being phased out; see forum [topic #63849](<https://e621.net/forum_topics/63849>) for details.
 */
export default interface APIPost extends APIResponse {
    id: number;
    created_at: string;
    updated_at: string;
    file: {
        width: number;
        height: number;
        ext: string;
        size: number;
        md5: string;
        url: string;
    };
    preview: {
        width: number;
        height: number;
        url: string;
    };
    sample: {
        has: boolean;
        height: number;
        width: number;
        url: string;
    };
    score: {
        up: number;
        down: number;
        total: number;
    };
    tags: {
        general: string[];
        species: string[];
        character: string[];
        copyright: string[];
        artist: string[];
        invalid: string[];
        lore: string[];
        meta: string[];
    };
    locked_tags: string[];
    change_seq: number;
    flags: {
        pending: boolean;
        flagged: boolean;
        note_locked: boolean;
        status_locked: boolean;
        rating_locked: boolean;
        deleted: boolean;
    };
    rating: "s" | "q" | "e";
    fav_count: number;
    sources: string[];
    pools: number[];
    relationships: {
        parent_id: number;
        has_children: boolean;
        has_active_children: boolean;
        children: number[];
    };
    approver_id: number;
    uploader_id: number;
    description: string;
    comment_count: number;
    is_favorited: boolean;
    has_notes: boolean;
    duration: number;
}

export namespace APIPost {

    export function getTags(post: APIPost): string[] {
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

    export function getTagString(post: APIPost): string {
        return APIPost.getTags(post).join(" ");
    }

    export function getTagSet(post: APIPost): Set<string> {
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
