import crossFetch, { Request as CrossRequest } from "cross-fetch";
import { ResponseCode, ResponseStatusMessage } from "../error/ResponseCode";
import APIResponse from "../responses/APIResponse";
import Logger from "./Logger";
import Util from "./Util";

// Bit of a hack, but it works
// If fetch is not available, falls back onto crossFetch
const wfFetch = global.fetch ? global.fetch : crossFetch;
const wfRequest = typeof global.fetch === "function" ? Request : CrossRequest;

export default class RequestQueue {

    private static queue: QueueItem[] = [];
    private static running = false;

    /**
     * Add a request to the queue.  
     * Requests are processed automatically, in the order they were added.
     * @param {string} requestInfo Target URL
     * @param {RequestInit} requestInit Additional request data
     * @param {number} timeout Timeout before the next request
     * @returns 
     */
    public static add(requestInfo: string, requestInit?: RequestInit, timeout = 500): Promise<QueueResponse> {
        // Hard limit on timeout to prevent being throttled
        if (timeout < 500) timeout = 500;

        return new Promise((resolve, reject) => {
            this.queue.push({
                request: new wfRequest(requestInfo, requestInit),
                success: resolve,
                failure: reject,
                timeout: timeout,
            });
            this.run();
        });
    }

    /**
     * Begins queue execution, if it's not running already
     */
    private static async run(): Promise<void> {
        if (this.running) return;
        this.running = true;

        let currentTask: QueueItem;
        // eslint-disable-next-line no-cond-assign
        while (currentTask = this.queue.shift()) {
            try {
                Logger.connect(currentTask.request.url);
                let response: Response;
                try {
                    response = await wfFetch(currentTask.request as any);
                } catch (error) {
                    response = {
                        status: ResponseCode.FetchError,
                        statusText: "An error occurred while fetching data",
                    } as any;
                }

                if (response.status !== ResponseCode.Success) {
                    currentTask.failure({
                        status: {
                            code: response.status,
                            url: currentTask.request.url,
                            message: response.statusText,
                        },
                        data: null,
                    });
                } else {

                    // HEAD requests have no response
                    if (currentTask.request.method == "HEAD") {
                        currentTask.success({
                            status: {
                                code: response.status,
                                url: currentTask.request.url,
                                message: response.statusText,
                            },
                            data: response.headers,
                        });
                        continue;
                    }

                    // Attempt to decode the JSON response
                    const data = await response.json();

                    // The response is incorrect, one way or another
                    // Typically it's because the site returns `success: false`
                    if (typeof data == "undefined" || (typeof data.success !== "undefined" && data.success === false)) {
                        currentTask.failure({
                            status: {
                                code: response.status,
                                url: currentTask.request.url,
                                message: response.statusText,
                            },
                            data: null,
                        });
                        continue;
                    }

                    // Request was successful, returning data
                    currentTask.success({
                        status: {
                            code: response.status,
                            url: currentTask.request.url,
                            message: response.statusText,
                        },
                        data: data,
                    });
                }
            } catch (error) {
                currentTask.failure({
                    status: {
                        code: ResponseCode.ParsingError,
                        url: currentTask.request.url,
                        message: ResponseStatusMessage.ProcessingError,
                    },
                    data: null,
                });
            }
            await Util.sleep(currentTask.timeout);
        }

        this.running = false;
    }
}

/**
 * Request that is awaiting execution.
 */
interface QueueItem {
    request: Request,
    success: (response: QueueResponse) => void,
    failure: (response: QueueResponse) => void,
    timeout: number,
}

/**
 * Response received from the API.  
 * Data is in a raw format, and likely needs to be reformatted
 */
export interface QueueResponse {
    status: ResponseStatus,
    data: any,
}

/**
 * Formatted variant of `QueueResponse`.  
 * Data has been reformatted to fit the APIResponse interface
 */
export interface FormattedResponse<T extends APIResponse> extends GenericResponse<T> {
    data: T[],
}
export interface GenericResponse<T> extends QueueResponse {
    data: T[],
}

/**
 * Basic response status.  
 * Should accompany every API response.
 */
export interface ResponseStatus {
    /** HTTP Response code */
    code: number;
    /** URL to which the request is made */
    url: string | null;
    /** Optional message, clarifying the HTTP code */
    message?: string;
    /** Extra data being passed in the response */
    extra?: string;
}

