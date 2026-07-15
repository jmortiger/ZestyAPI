import { ResponseCode, ResponseStatusMessage } from "../error/ResponseCode";
import APIResponse from "../responses/APIResponse";
import ZestyAPI from "../ZestyAPI";
import { FormattedResponse, QueueResponse, ResponseStatus } from "./RequestQueue";
import Util from "./Util";
import { PrimitiveMap, PrimitiveType, StringMap } from "./UtilType";

export default class Endpoint<T extends APIResponse> {

    protected api: ZestyAPI;

    // Variables used in the inherited `find()` method.
    protected endpoint = "unknown";     // determines the URL of the endpoint (without .json)
    protected searchParams: string[] = [];      // list of permitted search parameters
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
     * @param {QueryParams} params Query parameters
     * @returns {QueryParams} Validated parameters
     */
    protected validateQueryParams(params: QueryParams = {}): QueryParams {
        const results: SearchParams = {};
        if (!params) return results;

        // Result limit
        // - Number between 1 and 320
        if (params.limit && typeof params.limit == "number")
            results.limit = Util.Math.clamp(params.limit, 1, 320);

        // Page number
        // - Number between 1 and 750
        // - OR number prefixed by `a` (after) or `b` (before)
        if (params.page) {
            if (typeof params.page == "number")
                results.page = Util.Math.clamp(params.page, 1, 750);
            else if (typeof params.page == "string" && /[ab]\d+/.test(params.page))
                results.page = params.page;
        }

        return results;
    }

    /**
     * Shortcut method for making a response in case the search parameters are malformed or missing
     * @param {bool} array True if the output expects an array, false otherwise
     * @returns API Response
     */
    protected static makeMalformedRequestResponse(): Promise<FormattedResponse<any>> {
        return Promise.resolve({
            status: {
                code: ResponseCode.MalformedRequest,
                message: ResponseStatusMessage.MalformedRequest,
                url: null,
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
     * @param {T} data Second part of the API response
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
 * Search parameters for the `find()` methods.  
 * Empty by default. Extend this interface to add more.
 */
export interface SearchParams extends PrimitiveMap, QueryParams { }

/**
 * Query parameters for the `find()` methods.  
 * Include the result limit and page number common for all endpoints
 */
export interface QueryParams extends PrimitiveMap {
    /**
     * Number of posts on the page.  
     * Number between 1 and 320, defaults to 75
     */
    limit?: number | 75 | 320,
    /**
     * Page number. Two possible formats:  
     * - Number between 1 and 750, defaults to 1
     * - String, prefixed with either `a` (after)` or `b` (before), followed by an ID
     */
    page?: number | string,
}
