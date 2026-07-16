export default class RequestError extends Error {
    public constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, RequestError.prototype);
    }
}

export class MalformedRequestError extends RequestError {
    public static prependType = false;
    public constructor(message?: string) {
        if (!message) message = "Unknown request error";
        super((MalformedRequestError.prependType ? "MalformedRequestError: " : "") + message);
    }

    public static Params(): MalformedRequestError {
        return new MalformedRequestError("Request parameters are malformed or missing");
    }

    public static TooMany(param: string): MalformedRequestError {
        return new MalformedRequestError("Parameter exceeds search limit: " + param)
    }

    public static NotImplemented(): MalformedRequestError {
        return new MalformedRequestError("Method not implemented");
    }
}
