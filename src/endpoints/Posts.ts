import Endpoint, { QueryParams } from "../components/Endpoint";
import { FormattedResponse, QueueResponse } from "../components/RequestQueue";
import Util from "../components/Util";
import { PrimitiveMap, SimpleMap } from "../components/UtilType";
import { MalformedRequestError } from "../error/RequestError";
import { ResponseCode, ResponseStatusMessage } from "../error/ResponseCode";
import APIPost from "../responses/APIPost";
import { ApiPostBasic, ApiPostExtended, ApiPostThumbnail } from "../responses/APIPostV2";
import ZestyAPI from "../ZestyAPI";

export default class PostsEndpoint extends Endpoint<APIPost> {

    /*
    Endpoint Notes

    - No search parameters, everything is in query parameters
    - Output is wrapped in `{ posts: [] }` when searching for multiple posts (ex. `/posts.json`)
    - Output is wrapped in `{ post: {} }` when searching for one post (ex. `/posts/12345.json`)
    - Returns an empty object `{ posts: [] }` when no results are found in a search

    */

    /**
     * Search for posts with specified tags.  
     * Note that the hard limit for this request is 40 tags.  
     * Page number and post limit can be specified as parameters.
     * @param {PostQueryParams} query Search parameters
     * @returns {FormattedResponse<APIPost[]>} Post data
     * @todo Replace empty object w/ undefined in `validateParams`
     */
    public async find<Version extends 1 | 2 = 1, Mode extends PostMode | undefined = undefined>(query: PostQueryParams<Version, Mode> = {}): Promise<FormattedResponse<ModeSelect<Version, Mode>>> {

        let lookup: PrimitiveMap;
        try { lookup = this.validateParams({}, query); }
        catch (e) { return Endpoint.makeMalformedRequestResponse(); }

        return this.api.makeRequest("posts.json", { query: Endpoint.flattenParams(lookup, "+") })
            .then(
                (response: QueueResponse) => {
                    if (!response.data.posts || response.data.posts.length == 0) {
                        response.status.code = ResponseCode.NotFound;
                        response.status.message = ResponseStatusMessage.NotFound;
                        response.data = [];
                    } else response.data = response.data.posts;
                    return Endpoint.formatAPIResponse(response.status, response.data);
                },
                (error: QueueResponse) => {
                    return Endpoint.formatAPIResponse(error.status, []);
                }
            );
    }

    /**
     * Fetch post data for a specific post
     * @param {number} id ID of the post to return
     * @returns {FormattedResponse<APIPost>} Post data
     */
    public async get<Version extends 1 | 2 = 1, Mode extends PostMode | undefined = undefined>(id: number, query?: PostModeParams<Version, Mode>): Promise<FormattedResponse<ModeSelect<Version, Mode>>> {
        if (typeof id !== "number" || !Number.isInteger(id) || id < 0)
            return Endpoint.makeMalformedRequestResponse();

        let lookup: PrimitiveMap;
        try { lookup = this.validateParams({}, query); }
        catch (e) { return Endpoint.makeMalformedRequestResponse(); }

        return this.api.makeRequest(`posts/${id}.json`, lookup)
            .then(
                (response: QueueResponse) => {
                    if (!response.data.post) {
                        response.status.code = ResponseCode.NotFound;
                        response.status.message = ResponseStatusMessage.NotFound;
                        response.data = [];
                    } else response.data = [response.data.post];
                    return Endpoint.formatAPIResponse(response.status, response.data);
                },
                (error: QueueResponse) => {
                    return Endpoint.formatAPIResponse(error.status, []);
                }
            );
    }

    /**
     * Fetches data for multiple posts by their IDs.
     * 
     * Note that up to {@link ZestyAPI.MAX_PAGE_ITEMS} * {@link ZestyAPI.MAX_POST_SEARCH_TOKENS} IDs are accepted at a time; any more than
     * that will throw an error unless silenced via `discardOverflow`.
     * @param ids List of post IDs
     * @param {boolean} [discardOverflow=true] Should ids be silently discarded when given more than {@link ZestyAPI.MAX_PAGE_ITEMS} * {@link ZestyAPI.MAX_POST_SEARCH_TOKENS}?
     * @returns {FormattedResponse<APIPost[]>} Post data
     * @todo Test accounting for receiving more than 320 ids.
     * @todo Doesn't work b/c URI is too long.
     * @todo Not useful since it would be more than the max page length anyways; would take multiple requests.
     */
    public async getMany(ids: number[], discardOverflow = true): Promise<FormattedResponse<APIPost>> {
        if (!Array.isArray(ids))
            return Endpoint.makeMalformedRequestResponse({
                message: "Given an 'array' of ids that is not an array.",
                url: this.api.domain + this.endpoint,
            });
        if (ids.length <= ZestyAPI.MAX_PAGE_ITEMS)
            return this.find({ tags: "id:" + ids.join(",") });
        if (ids.length > (ZestyAPI.MAX_PAGE_ITEMS * ZestyAPI.MAX_POST_SEARCH_TOKENS) && !discardOverflow)
            // throw MalformedRequestError.TooMany("tags");
            return Endpoint.makeMalformedRequestResponse({
                message: `Given *way* too many IDs (${ids.length}; max is ${ZestyAPI.MAX_PAGE_ITEMS} * ${ZestyAPI.MAX_POST_SEARCH_TOKENS} = ${ZestyAPI.MAX_PAGE_ITEMS * ZestyAPI.MAX_POST_SEARCH_TOKENS}); that's *absurd*, change what you're doing.`,
                url: this.api.domain + this.endpoint,
            });
        const idsArrays = [ids], givenCount = idsArrays[0]!.length, projected = Math.ceil(givenCount / ZestyAPI.MAX_PAGE_ITEMS);
        for (
            let l = idsArrays[0]!.length - ZestyAPI.MAX_PAGE_ITEMS, counter = discardOverflow ? 0 : -1;
            l > 0 &&
                counter < projected &&
                (discardOverflow ? true : counter < ZestyAPI.MAX_POST_SEARCH_TOKENS);
            l = idsArrays[0]!.length - ZestyAPI.MAX_PAGE_ITEMS, counter++
        ) {
            idsArrays.push(
                idsArrays[0]!.splice(
                    ZestyAPI.MAX_PAGE_ITEMS,
                    Math.min(ZestyAPI.MAX_PAGE_ITEMS, l),
                ),
            );
        }
        if (idsArrays.length > ZestyAPI.MAX_POST_SEARCH_TOKENS) {
            if (discardOverflow) {
                const discards = idsArrays.splice(ZestyAPI.MAX_POST_SEARCH_TOKENS, idsArrays.length - ZestyAPI.MAX_POST_SEARCH_TOKENS)
                console.warn("Provided too many ids; discarding the final %s ids", discards.reduce((p, e) => {p.push(...e); return p}, [] as number[]));
            }
            else
                throw new Error(`Logic failed; ${idsArrays.length - ZestyAPI.MAX_POST_SEARCH_TOKENS} too many tokens created.`);
        }
        return this.find({ tags: idsArrays.map(e => "~id:" + e.join(",")).join(" "), limit: ZestyAPI.MAX_PAGE_ITEMS, });
    }

    /**
     * Fetches data for a random post
     * @returns {FormattedResponse<APIPost>}Post data
     */
    public async random(): Promise<FormattedResponse<APIPost>> {
        return this.api.makeRequest(`posts/random.json`)
            .then(
                (response: QueueResponse) => {
                    if (!response.data.post) {
                        response.status.code = ResponseCode.NotFound;
                        response.status.message = ResponseStatusMessage.NotFound;
                        response.data = [];
                    } else response.data = [response.data.post];
                    return Endpoint.formatAPIResponse(response.status, response.data);
                },
                (error: QueueResponse) => Endpoint.formatAPIResponse(error.status, [])
            )
    }

    /**
     * Search for posts with specified tags.  
     * Note that the hard limit for this request is 39 tags.  
     * Page number and post limit can be specified as parameters.
     * @param {PostQueryParams} query Search parameters
     * @param {number | string} seed Random seed. Optional. Should be a number.
     * @returns {FormattedResponse<APIPost[]>} Post data
     */
    public async randomMany(query: PostQueryParams = {}, seed?: number | string): Promise<FormattedResponse<APIPost>> {

        if (query.tags) {
            if (!Array.isArray(query.tags)) query.tags = query.tags.trim().split(" ").filter(n => n);
        } else query.tags = [];

        query.tags.push("order:random");
        // TODO: Handle whitespace?
        if (seed) query.tags.push("randseed:" + seed);

        return this.find(query);
    }

    public async update(id: number, data: PostUpdateParams): Promise<FormattedResponse<APIPost>> {

        if (!this.api.isAuthSet) {
            return Endpoint.formatAPIResponse(
                {
                    code: ResponseCode.Unauthorized,
                    message: ResponseStatusMessage.Unauthorized,
                    url: null,
                },
                []
            )
        }

        return this.api.makeRequest(`posts/${id}.json`, {
            method: "PATCH",
            body: Util.Type.prefix("post", data),
        }).then(
            (response: QueueResponse) => {
                if (!response.data.post) {
                    response.status.code = ResponseCode.NotFound;
                    response.status.message = ResponseStatusMessage.NotFound;
                    response.data = [];
                } else response.data = [response.data.post];
                return Endpoint.formatAPIResponse(response.status, response.data);
            },
            (error: QueueResponse) => {
                return Endpoint.formatAPIResponse(error.status, []);
            }
        );
    }

    protected validateQueryParams(params: PostQueryParams = {}): PostQueryParams {
        const result = super.validateQueryParams(params) as PostQueryParams;

        if (!params.tags) result.tags = [];
        else if (typeof params.tags !== "object") result.tags = (params.tags + "").trim().split(" ").filter(n => n);
        else if (Array.isArray(params.tags)) result.tags = params.tags;
        else throw MalformedRequestError.Params();

        if (result.tags.length > ZestyAPI.MAX_POST_SEARCH_TOKENS)
            throw MalformedRequestError.TooMany("tags");

        return result as PostQueryParams;
    }
}

// #region Version Types
/**
 * Conditionally evaluates the type.
 *
 * * If the version is `1`:
 *    * `V1` (default `APIPost`)
 * * otherwise (version is `2`), if the mode is:
 *    * `"extended"`, `Extended` (default `ApiPostExtended`)
 *    * `"thumbnails"`, `Thumbnail` (default `ApiPostThumbnail`)
 *    * otherwise (mode is `basic` or undefined), `Basic` (default `ApiPostBasic`)
 */
type ModeSelect<
    Version extends 1 | 2 = 1,
    Mode extends PostMode | undefined = undefined,
    V1 = APIPost,
    Basic = ApiPostBasic,
    Extended = ApiPostExtended,
    Thumbnail = ApiPostThumbnail,
> = Version extends 1 ?
    V1 :
    (Version extends 2 ?
        (Mode extends "extended" ?
            Extended :
            (Mode extends "thumbnail" ? Thumbnail : Basic)
        ) :
        (V1 | Basic | Extended | Thumbnail)
    );
type Versioned<V1, V2, T extends 1 | 2 = 1> = T extends 1 ? V1 : T extends 2 ? V2 : V1 | V2;
type PostMode = "basic" | "extended" | "thumbnails";
interface PostModeParams<Version extends 1 | 2 = 1, Mode extends PostMode | undefined = "basic"> extends PrimitiveMap {
    mode?: Versioned<undefined, Mode, Version>,
    v1?: Versioned<true | undefined, false | undefined, Version>,
    v2?: Versioned<false | undefined, true, Version>,
}
// #endregion Version Types

interface PostQueryParams<Version extends 1 | 2 = 1, Mode extends PostMode | undefined = "basic"> extends QueryParams, PostModeParams<Version, Mode> {
    tags?: string | string[]
}

interface PostUpdateParams extends Partial<SimpleMap> {
    tag_string?: string,
    old_tag_string?: string,
    tag_string_diff?: string,

    rating?: "e" | "q" | "s",
    old_rating?: "e" | "q" | "s",

    parent_id?: number,
    old_parent_id?: number,

    source?: string,
    old_source?: string,
    source_diff?: string,

    description?: string,
    old_description?: string,

    edit_reason?: string,

    // Privileged+
    is_rating_locked?: boolean,

    // Janitor+
    is_note_locked?: boolean,
    bg_color?: string,

    // Admin
    is_status_locked?: boolean,
    is_comment_disabled?: boolean,
    locked_tags?: string,
    hide_from_anonymous?: boolean,
    hide_from_search_engines?: boolean,
}
