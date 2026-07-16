import { MalformedRequestError } from "../error/RequestError";
import { ResponseCode, ResponseStatusMessage } from "../error/ResponseCode";
import APIResponse from "../responses/APIResponse";
import ZestyAPI from "../ZestyAPI";
import { FormattedResponse, QueueResponse, ResponseStatus } from "./RequestQueue";
import Util from "./Util";
import { PrimitiveMap, PrimitiveType, StringMap } from "./UtilType";

export default class Endpoint<T extends APIResponse> {

    protected api: ZestyAPI;

    // Variables used in the inherited `find()` method.
    /**
     * Determines the URL of the endpoint (without `.json`).
     */
    protected endpoint = "unknown";
    /**
     * List of permitted search parameters.
     */
    protected searchParams: string[] = [];
    protected searchParamAliases: { [prop: string]: string } = {};

    constructor(api: ZestyAPI) {
        this.api = api;
    }

    public async find(search: SearchParams = {}): Promise<FormattedResponse<T>> {

        const query = this.splitQueryParams(search);
        let lookup: PrimitiveMap;
        try { lookup = this.validateParams(search, query); }
        catch (e) { return Endpoint.makeMalformedRequestResponse(); }

        return this.api.makeRequest(this.endpoint + ".json", { query: Endpoint.flattenParams(lookup) })
            .then(
                (response: QueueResponse) => {
                    if (response.data[this.endpoint]) {
                        response.status.code = ResponseCode.NotFound;
                        response.status.message = ResponseStatusMessage.NotFound;
                        response.data = [];
                    }
                    return Endpoint.formatAPIResponse(response.status, response.data);
                },
                (error: QueueResponse) => Endpoint.formatAPIResponse(error.status, [])
            );
    }

    /**
     * Parses the SearchParams and finds values that
     * need to be split off into QueryParams.
     * @param {SearchParams} search Search params
     * @returns {QueryParams} Query params
     * @todo Should the `limit` & `page` properties be `delete`d from `search`?
     */
    protected splitQueryParams(search: SearchParams = {}): QueryParams {
        const result: QueryParams = {};
        if (search.limit) result.limit = search.limit;
        if (search.page) result.page = search.page;
        return result;
    }

    /**
     * Validates both sets of parameters and returns a prepared
     * map that can be plugged into `flattenParams()`.
     * @param {SearchParams} search Search parameters
     * @param {QueryParams} query Query parameters
     * @returns Validated results
     * @throws {MalformedRequestError} If the errors in the parameters are irreconcilable
     */
    protected validateParams(search: SearchParams = {}, query: QueryParams = {}): PrimitiveMap {
        search = this.validateSearchParams(search);
        query = this.validateQueryParams(query);
        const result = Object.keys(query).length ? query : {};
        if (Object.keys(search).length) result["search"] = search;
        return result;
    }

    /**
     * Validates the search parameters for the `find()` methods.  
     * @param {SearchParams} params Search parameters
     * @returns {SearchParams} Validated parameters
     */
    protected validateSearchParams(params: SearchParams = {}): SearchParams {
        const results: SearchParams = {};
        if (!params) return results;

        // Replace param aliases
        for (const [antecedent, consequent] of Object.entries(this.searchParamAliases)) {
            if (params[antecedent]) params[consequent] = params[antecedent];
            delete params[antecedent];
        }

        // Find defined permitted params
        for (const one of this.searchParams)
            if (typeof params[one] !== "undefined")
                results[one] = params[one];

        return results;
    }

    /**
     * Validates the query parameters for the `find()` methods.
     * 
     * Restricts the {@link QueryParams.limit} from 1 to
     * {@link ZestyAPI.MAX_PAGE_ITEMS}, either restricts the
     * {@link QueryParams.page} from 1 to {@link ZestyAPI.MAX_PAGE_NUMBER} or
     * ensures it follows the id-based pagination format.
     *
     * @param {QueryParams} params Query parameters
     * @returns {QueryParams} Validated parameters
     */
    protected validateQueryParams(params: QueryParams = {}): QueryParams {
        const results: SearchParams = {};
        if (!params) return results;

        if (params.limit && typeof params.limit == "number")
            results.limit = Util.Math.clamp(Math.round(params.limit), 1, ZestyAPI.MAX_PAGE_ITEMS);

        if ((params.page = this.validatePage(params.page)))
            results.page = params.page;

        return results;
    }

    /**
     * Coerces the given value for the {@link QueryParams.page} parameter to a
     * valid one.
     *
     * @param page The value to validate.
     * @returns A value that's guaranteed to be a valid value for {@link QueryParams.page}.
     */
    public validatePage(page: QueryParams["page"]) {
        if (!page) return;
        if (typeof page === "number")
            return Util.Math.clamp(Math.round(page), 1, ZestyAPI.MAX_PAGE_NUMBER);
        else if (typeof page === "string" && (page = page.trim()) && (
                /^[ab]\d+$/.test(page) ||
                (page = (Number.parseInt(page) || 0)) > 0
            ))
            return page;
    }

    /**
     * Validates that the given value is valid for the {@link QueryParams.page}
     * parameter.
     * 
     * Unlike {@link validatePage}, this does no coercion at all; if the value
     * is not valid, you will get either `undefined` or an error will be throw,
     * depending on the value of `silent`.
     * @param page The value to validate.
     * @param {boolean} [silent=true] Should errors for invalid values be suppressed?
     * @returns The now-guaranteed valid initial value of `page`, or, if `silent`, `undefined`.
     * @throws {MalformedRequestError} If invalid & `silent` is not true, thrown with a detailed error message for each failing condition.
     */
    public validatePageStrict(page: QueryParams["page"], silent = true) {
        if (page) {
            if (typeof page === "number") {
                if (!Number.isInteger(page)) {
                    if (!silent)
                        throw new MalformedRequestError(`Invalid page parameter; "${page}" is a number that is not an integer.`);
                } else if (Util.Math.between(page, 1, ZestyAPI.MAX_PAGE_NUMBER))
                    return page;
                else if (!silent)
                    throw new MalformedRequestError(`Invalid page parameter; "${page}" is a number that is not an integer.`);
            } else if (typeof page === "string") {
                if (/^[ab]\d+$/.test(page))
                    return page;
                else if (!silent)
                    throw new MalformedRequestError(`Invalid page parameter; "${page}" is a string that does not conform to the format "^[ab]\\d+$".`);
            } else if (!silent)
                throw new MalformedRequestError(`Invalid page parameter; ${page} is not a string, number, nor undefined.`);
        }
        if (silent || page === undefined)
            return;
        let msg: string;
        switch (typeof page) {
            case "string":
                msg = `a string that does not conform to the format /^[ab]\\d+$/.`;
                break;
            case "number":
                if (isNaN(page)) msg = `a number of the value NaN.`;
                else msg = `zero, a number that does not conform to the requirement "1 <= x <= ${ZestyAPI.MAX_PAGE_NUMBER}"`;
                break;
            default:
                msg = `not a string, number, or undefined.`;
                break;
        }
        throw new MalformedRequestError(`Invalid page parameter; ${page} is ` + msg);
    }

    // * @param {boolean} _array True if the output expects an array, false otherwise. Deprecated.
    /**
     * Shortcut method for making a response in case the search parameters are malformed or missing
     * @returns API Response
     */
    protected static makeMalformedRequestResponse(opts: {
        code?: number,
        message?: string,
        url?: string | null
    } = {
        code: ResponseCode.MalformedRequest,
        message: ResponseStatusMessage.MalformedRequest,
    }): Promise<FormattedResponse<any>> {
        return Promise.resolve({
            status: {
                code: opts?.code || ResponseCode.MalformedRequest,
                message: opts?.message || ResponseStatusMessage.MalformedRequest,
                url: opts?.url || null,
            },
            data: [],
        });
    }

    /**
     * Converts a value in a SearchParams format to an object with string values
     * @param {PrimitiveMap} params Original object
     * @param {string} separator Array join separator
     * @param {StringMap} keyReplacement Substitutions for key names
     * @returns Flattened object
     */
    protected static flattenParams(params: PrimitiveMap, separator = ",", keyReplacement?: StringMap): StringMap {
        const result: StringMap = {};

        for (const [key, value] of Object.entries(params)) {
            processValue(result, key, value, keyReplacement, separator, []);
        }

        return result;

        function processValue(
            obj: StringMap,
            key: string,
            value: PrimitiveType | PrimitiveType[] | PrimitiveMap | undefined | null,
            keyReplacement: StringMap = {},
            separator = ",",
            keyStack: string[] = [],
        ): void {

            if (value === null || typeof value === "undefined" || value === "") return;
            if (keyReplacement[key]) key = keyReplacement[key];

            // Array
            if (Array.isArray(value)) {
                if (value.length == 0) return;
                value = Util.encodeArray(value);
                obj[formatKey(key, keyStack)] = value.join(separator);
                return;
            }

            // Primitive type
            if (typeof value !== "object") {
                value = Util.encode(value);
                obj[formatKey(key, keyStack)] = value;
                return;
            }

            // Object (recursive)
            keyStack.push(key);
            for (const [key2, value2] of Object.entries(value))
                processValue(obj, key2, value2, keyReplacement, separator, keyStack);

            function formatKey(key: string, keyStack: string[] = []) {
                if (keyStack.length == 0) return key;
                else {
                    let result = keyStack[0];
                    for (const parentKey of keyStack.slice(1))
                        result += "[" + parentKey + "]";
                    result += "[" + key + "]";
                    return result;
                }
            }
        }
    }

    /**
     * Validates the raw API response and returns a consistent response
     * @param {ResponseStatus} status First portion of the API response
     * @param {T[]} data Second part of the API response
     * @returns 
     */
    protected static formatAPIResponse<T extends APIResponse>(status: ResponseStatus, data: T[]): FormattedResponse<T> {
        if (!status.url) status.url = null;
        if (!data) data = [];
        return {
            status: status,
            data: data,
        };
    }
}

/**
 * `search[???]` parameters for the `find()` methods.
 *
 * By placing these parameters here, it enables us to properly adjust them for
 * the query string (for `GET`/`HEAD` requests) or the body.
 *
 * Empty by default. Extend this interface to add more.
 */
export interface SearchParams extends PrimitiveMap, QueryParams { }

/**
 * Query parameters for the `find()` methods.
 *
 * Includes the pagination parameters common to all endpoints.
 */
// export interface QueryParams<T extends number = 1> extends PrimitiveMap {
export interface QueryParams extends PrimitiveMap {
    /**
     * Number of posts on the page.  
     * Whole number between 1 & {@link ZestyAPI.MAX_PAGE_ITEMS}, defaults to 75.
     */
    limit?: number | 75 | typeof ZestyAPI.MAX_PAGE_ITEMS,
    /**
     * Page number. Two possible formats:  
     * - Whole number between 1 and {@link ZestyAPI.MAX_PAGE_NUMBER}
     * - String, prefixed with either `a` (after)` or `b` (before), followed by
     * positive whole number for the ID.
     *
     * Defaults to 1.
     */
    page?: number | string | 1 | typeof ZestyAPI.MAX_PAGE_NUMBER,
    // page?: number | `a${T}` | `b${T}`,
}
