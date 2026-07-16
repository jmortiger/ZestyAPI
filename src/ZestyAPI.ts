import Logger from "./components/Logger";
import RequestQueue from "./components/RequestQueue";
import Util from "./components/Util";
import { PrimitiveType } from "./components/UtilType";
import BlipsEndpoint from "./endpoints/Blips";
import CommentsEndpoint from "./endpoints/Comments";
import Favorites from "./endpoints/Favorites";
import ForumPostsEndpoint from "./endpoints/ForumPosts";
import ForumTopicsEndpoint from "./endpoints/ForumTopics";
import IQDBQueriesEndpoint from "./endpoints/IQDBQueries";
import NotesEndpoint from "./endpoints/Notes";
import PoolsEndpoint from "./endpoints/Pools";
import PostEventsEndpoint from "./endpoints/PostEvents";
import PostsEndpoint from "./endpoints/Posts";
import PostSets from "./endpoints/PostSets";
import PostVotes from "./endpoints/PostVotes";
import TagAliasesEndpoint from "./endpoints/TagAliases";
import TagImplicationsEndpoint from "./endpoints/TagImplications";
import TagsEndpoint from "./endpoints/Tags";
import UserFeedbacksEndpoint from "./endpoints/UserFeedbacks";
import UsersEndpoint from "./endpoints/Users";
import UtilityEndpoint from "./endpoints/Utility";
import WikiPagesEndpoint from "./endpoints/WikiPages";
import InitializationError from "./error/InitializationError";

/** @see ZestyAPI.MIN_RATE_LIMIT */ const MIN_RATE_LIMIT = 500;
/** @see ZestyAPI.MAX_IDENTIFIER_LENGTH */ const MAX_IDENTIFIER_LENGTH = 250;
/** @see ZestyAPI.MAX_PAGE_NUMBER */ const MAX_PAGE_NUMBER = 750;
/** @see ZestyAPI.MAX_PAGE_ITEMS */ const MAX_PAGE_ITEMS = 320;
/** @see ZestyAPI.MAX_POST_SEARCH_TOKENS */ const MAX_POST_SEARCH_TOKENS = 40;

export default class ZestyAPI {

    /**
     * The minimum accepted rate limit; if an attempt to use a lower rate limit
     * is made, it will be changed to this value.
     * @todo Test rate limit always being >= this.
     */
    public static get MIN_RATE_LIMIT(): typeof MIN_RATE_LIMIT { return MIN_RATE_LIMIT; }

    /**
     * The maximum length of the user agent, auth token, username, and API key. Will
     * throw auth errors if exceeded.
     * @todo Test errors being thrown.
     */
    public static get MAX_IDENTIFIER_LENGTH(): typeof MAX_IDENTIFIER_LENGTH { return MAX_IDENTIFIER_LENGTH; }

    /**
     * The maximum page value for a query; the server will not paginate beyond
     * this value.
     * @todo Ensure always overridden.
     */
    public static get MAX_PAGE_NUMBER(): typeof MAX_PAGE_NUMBER { return MAX_PAGE_NUMBER; }

    /**
     * The maximum number of items allowed on a page; the server will not return
     * more than this many items per page.
     * @todo Ensure always overridden.
     */
    public static get MAX_PAGE_ITEMS(): typeof MAX_PAGE_ITEMS { return MAX_PAGE_ITEMS; }

    /**
     * The maximum number of space-separated search tokens (discounting group
     * delimiters) allowed when making a post search; the server will not run
     * the search if more than this many items are used.
     * @todo Ensure always overridden.
     */
    public static get MAX_POST_SEARCH_TOKENS(): typeof MAX_POST_SEARCH_TOKENS { return MAX_POST_SEARCH_TOKENS; }

    private static instance: ZestyAPI;

    // IDEA: Make these all readonly, or give them public setters?
    private userAgent: string;
    private rateLimit: number;
    private domain: string;

    private authToken?: AuthToken;
    private authLogin?: AuthLogin;

    public readonly adjustIqdbRateLimit: boolean;

    // Endpoint declarations
    public Blips = new BlipsEndpoint(this);
    public Comments = new CommentsEndpoint(this);
    public Favorites = new Favorites(this);
    public ForumPosts = new ForumPostsEndpoint(this);
    public ForumTopics = new ForumTopicsEndpoint(this);
    public IQDBQueries = new IQDBQueriesEndpoint(this);
    public Notes = new NotesEndpoint(this);
    public Pools = new PoolsEndpoint(this);
    public Posts = new PostsEndpoint(this);
    public PostEvents = new PostEventsEndpoint(this);
    public PostSets = new PostSets(this);
    public PostVotes = new PostVotes(this);
    public Tags = new TagsEndpoint(this);
    public TagAliases = new TagAliasesEndpoint(this);
    public TagImplications = new TagImplicationsEndpoint(this);
    public Users = new UsersEndpoint(this);
    public UserFeedbacks = new UserFeedbacksEndpoint(this);
    public Utility = new UtilityEndpoint(this)
    public WikiPages = new WikiPagesEndpoint(this);

    private constructor(config: APIConfig = {}) {
        // User Agent
        if (!config.userAgent ||
            typeof config.userAgent !== "string" ||
            config.userAgent.length > MAX_IDENTIFIER_LENGTH
        ) throw InitializationError.UserAgent();
        this.userAgent = config.userAgent;

        // Rate Limit
        if (typeof config.rateLimit !== "number" || config.rateLimit < MIN_RATE_LIMIT)
            this.rateLimit = MIN_RATE_LIMIT;
        else this.rateLimit = config.rateLimit;

        // Domain
        config.domain ||= (Util.isBrowser && SupportedDomains.isSupportedDomain(window.location.origin)) ? window.location.origin : "https://e621.net";
        if (typeof config.domain !== "string")
            throw InitializationError.Domain("invalid type; not a string");
        // NOTE: If this needs to be a domain, this should be using `origin` instead of `href`.
        try { this.domain = new URL(config.domain).href; }
        catch { throw InitializationError.Domain("failed parsing"); }

        // Authentication
        if (config.authLogin) this.login(config.authLogin);
        else if (config.authToken) this.login(config.authToken);

        // Debug
        Logger.debug = !!config.debug;

        this.adjustIqdbRateLimit = (!!config.adjustIqdbRateLimit) && !this.isAuthSet;
    }

    /**
     * Get an instance of a E621 object, with access to various endpoints
     * @param {APIConfig} config Configuration object. Not necessary if `connect()` was called before.
     * @returns {ZestyAPI} E621 object
     */
    public static connect(config?: APIConfig): ZestyAPI {
        if (!this.instance) this.instance = new ZestyAPI(config);
        return this.instance;
    }

    /**
     * Purge current credentials & store given ones.
     * @param auth The authentication data to use for requests.
     *
     * NOTE: This will only purge old credentials after ensuring new ones are
     * facially valid.
     */
    public login(auth: AuthToken | AuthLogin): void {
        if (typeof auth === "string") {
            if (!auth || auth.length > MAX_IDENTIFIER_LENGTH)
                throw InitializationError.Auth("bad auth token; " + !auth ? "empty" : "too long");
            this.logout();
            this.authToken = auth;
            return;
        } else if (!auth.username || typeof auth.username !== "string" || auth.username.length > MAX_IDENTIFIER_LENGTH) {
            throw InitializationError.Auth("bad username; " + !auth.username ? "empty" : "too long/invalid type");
        } else if (!auth.apiKey || typeof auth.apiKey !== "string" || auth.apiKey.length > MAX_IDENTIFIER_LENGTH)
            throw InitializationError.Auth("bad API key; " + !auth.apiKey ? "empty" : "too long/invalid type");
        this.logout();
        this.authLogin = auth;
    }

    public logout(): void {
        this.authToken = undefined;
        this.authLogin = undefined;
    }

    /** Retrieve the auth token, or throw an error if not set. */
    public getAuthToken(): AuthToken {
        if (this.authToken === undefined) throw new Error("authToken is undefined.");
        return this.authToken;
    }
    /** Retrieve the auth token. */
    public get safeAuthToken(): AuthToken | undefined { return this.authToken; }
    /** Retrieve the login data, or throw an error if not set. */
    public getAuthLogin(): AuthLogin {
        if (this.authLogin === undefined) throw new Error("authLogin is undefined.");
        return this.authLogin;
    }
    /** Retrieve the login data. */
    public get safeAuthLogin(): AuthLogin | undefined { return this.authLogin; }

    public get isAuthSet(): boolean {
        return typeof this.authToken !== "undefined" || typeof this.authLogin !== "undefined";
    }

    /**
     * Method used to make requests to E621's API.  
     * It is strongly recommended not to use it directly, and to instead rely on endpoint methods.
     * @param {string} endpoint Endpoint address
     * @param {RequestConfig} config Request parameters
     * @returns {Promise<any>} Promise that is fulfilled when the request receives a response
     */
    public makeRequest(endpoint: string, config?: RequestConfig): Promise<any> {

        const requestInfo: RequestInit = {};
        requestInfo.headers = {};

        /* Validating the request config */
        config ||= {};

        // Request method
        requestInfo.method = config.method ||= "GET";

        // Query parameters and headers
        config.query ||= {};
        if (Util.isBrowser) config.query["_client"] = encodeURIComponent(this.userAgent);
        else {
            requestInfo.headers["User-Agent"] = this.userAgent;
            requestInfo.headers["X-User-Agent"] = this.userAgent;
        }

        // Request body
        config.body ||= {};
        if (requestInfo.method !== "GET" && requestInfo.method !== "HEAD") {
            if (this.authToken) config.body["authenticity_token"] = encodeURIComponent(this.authToken);
            // const bodyParams = APIQuery.flatten(config.body);
            if (Object.keys(config.body).length > 0) {
                const data = new FormData();
                for (const [key, value] of Object.entries(config.body))
                    data.append(key, value + "");
                requestInfo.body = data;
            }
        // TODO: Test this is properly set when using auth tokens over login.
        // For GET requests when solely using an auth token, adds authentication
        // in the header to enable access-based requests (e.g. one's own hidden
        // comments, staff resources, etc) & provide an identity for improved
        // IQDB throttling.
        } else if (!this.authLogin && this.authToken) {
            requestInfo.headers["X-CSRF-Token"] = this.authToken;
        }

        // Authentication
        if (this.authLogin) {
            // TODO Check if there is a difference in auth between browser and node
            requestInfo.headers["Authorization"] = `Basic ${Util.btoa(this.authLogin.username + ":" + this.authLogin.apiKey)}`;
        }

        // Timeout
        if ((config.rateLimit ||= this.rateLimit) < MIN_RATE_LIMIT)
            config.rateLimit = MIN_RATE_LIMIT;

        /* Compiling the data and adding it to the queue */

        let url = this.domain + endpoint;
        const queryParams = APIQuery.flatten(config.query);
        if (queryParams.length > 0) url += "?" + queryParams.join("&");

        return RequestQueue.add(url, requestInfo, config.rateLimit);
    }

}

if (typeof process === "undefined")
    (window as any).ZestyAPI = ZestyAPI;

enum SupportedDomains {
    e621 = "https://e621.net",
    e926 = "https://e926.net",
    // e6ai = "https://e6ai.net",
}
namespace SupportedDomains {
    export function isSupportedDomain(domain: string) {
        return !!SupportedDomains[domain];
    }
}

/**
 * @todo Expand with stuff like per-endpoint default values for limit & page.
 */
interface APIConfig {
    userAgent?: string,
    /** 
     * The time to wait between requests in milliseconds. If set beneath
     * {@link ZestyAPI.MIN_RATE_LIMIT}
     * , will be set to `MIN_RATE_LIMIT`.
     */
    rateLimit?: typeof ZestyAPI.MIN_RATE_LIMIT | number,
    /**
     * @todo e6ai support?
     */
    domain?: "https://e621.net" | "https://e926.net" | string,

    /**
     * The token given to authenticate user identity in the browser.
     * 
     * If practical, {@link authLogin} *might* be preferred; requires further
     * testing.
     * @todo Allow both to be provided.
     */
    authToken?: AuthToken;
    /**
     * The user's authentication details used to authenticate user identity in
     * all non-browser contexts.
     * 
     * If practical, this *might* be preferred over {@link authToken}; requires
     * further testing.
     * @todo Allow both to be provided.
     */
    authLogin?: AuthLogin;

    /** 
     * If true, the IQDB rate limit will be adjusted to 60 seconds when used
     * anonymously.
     */
    adjustIqdbRateLimit?: boolean;

    /**
     * @todo Make a debug *verbosity* (maybe even a verbosity map) instead of a toggle.
     */
    debug?: boolean;
}

type AuthToken = string;
interface AuthLogin {
    username: string;
    apiKey: string;
}

interface RequestConfig {
    method?: "GET" | "POST" | "HEAD" | "PATCH" | "DELETE",
    query?: APIQuery,
    body?: APIQuery,
    rateLimit?: number,
}

export interface APIQuery {
    [prop: string]: PrimitiveType;
}
namespace APIQuery {
    export function flatten(input: APIQuery): string[] {
        const result: string[] = [];
        for (const [key, value] of Object.entries(input)) {
            if (value === null || typeof value == "undefined") continue;
            result.push(key + "=" + value); // TODO URLEncode???
        }
        return result;
    }
}
