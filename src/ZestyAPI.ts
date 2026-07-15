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

export default class ZestyAPI {

    private static instance: ZestyAPI;

    private userAgent: string;
    private rateLimit: number;
    private domain: string;

    private authToken: AuthToken;
    private authLogin: AuthLogin;

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
        if (!config.userAgent || typeof config.userAgent !== "string" || config.userAgent.length > 250)
            throw InitializationError.UserAgent();
        else this.userAgent = config.userAgent;

        // Rate Limit
        if (!config.rateLimit || typeof config.rateLimit !== "number" || config.rateLimit < 500)
            this.rateLimit = 500;
        else this.rateLimit = config.rateLimit;

        // Domain
        if (!config.domain) config.domain = "https://e621.net";
        else if (typeof config.domain !== "string")
            throw InitializationError.Domain();
        try { this.domain = new URL(config.domain).href; }
        catch { throw InitializationError.Domain(); }

        // Authentication
        if (config.authToken) this.login(config.authToken);
        else if (config.authLogin) this.login(config.authLogin);

        // Debug
        if (config.debug) Logger.debug = true;
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

    public login(auth: AuthToken | AuthLogin): void {
        this.logout();
        if (typeof auth == "string") {
            if (auth.length > 250) throw InitializationError.Auth();
            else this.authToken = auth;
        } else {
            if (!auth.username || typeof auth.username !== "string" || auth.username.length > 250
                || !auth.apiKey || typeof auth.apiKey !== "string" || auth.apiKey.length > 250)
                throw InitializationError.Auth();
            else this.authLogin = auth;
        }
    }

    public logout(): void {
        this.authToken = undefined;
        this.authLogin = undefined;
    }

    public getAuthToken(): AuthToken { return this.authToken; }
    public getAuthLogin(): AuthLogin { return this.authLogin; }
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

        const requestInfo = {};
        requestInfo["headers"] = {};

        /* Validating the request config */
        if (!config) config = {};

        // Request method
        if (!config.method) config.method = "GET";
        requestInfo["method"] = config.method;

        // Query parameters and headers
        if (!config.query) config.query = {};
        if (Util.isBrowser) config.query["_client"] = encodeURIComponent(this.userAgent);
        else {
            requestInfo["headers"]["User-Agent"] = this.userAgent;
            requestInfo["headers"]["X-User-Agent"] = this.userAgent;
        }

        // Request body
        if (!config.body) config.body = {};
        if (config.method !== "GET") {
            if (this.authToken) config.body["authenticity_token"] = encodeURIComponent(this.authToken);
            // const bodyParams = APIQuery.flatten(config.body);
            if (Object.keys(config.body).length > 0) {
                const data = new FormData();
                for (const [key, value] of Object.entries(config.body))
                    data.append(key, value + "");
                requestInfo["body"] = data;
            }
        }

        // Timeout
        if (!config.rateLimit) config.rateLimit = this.rateLimit;
        else if (config.rateLimit < 500) config.rateLimit = 500;

        // Authentication
        if (this.authLogin) {
            // TODO Check if there is a difference in auth between browser and node
            requestInfo["headers"]["Authorization"] = `Basic ${Util.btoa(this.authLogin.username + ":" + this.authLogin.apiKey)}`;
        }

        /* Compiling the data and adding it to the queue */

        let url = this.domain + endpoint;
        const queryParams = APIQuery.flatten(config.query);
        if (queryParams.length > 0) url += "?" + queryParams.join("&");

        return RequestQueue.add(url, requestInfo, config.rateLimit);

    }

}

if (typeof process === "undefined")
    (window as any).ZestyAPI = ZestyAPI;

interface APIConfig {
    userAgent?: string,
    rateLimit?: 500 | number,
    domain?: "https://e621.net" | "https://e926.net" | string,

    authToken?: AuthToken;
    authLogin?: AuthLogin

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
