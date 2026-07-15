export default class InitializationError extends Error {
    private static msgFmt(message?: string) { return message ? `(${message})` : ""; }
    public constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, InitializationError.prototype);
    }

    public static UserAgent(message?: string): InitializationError {
        return new InitializationError(
            "UserAgent missing or malformed" + this.msgFmt(message),
        );
    }

    public static Domain(message?: string): InitializationError {
        return new InitializationError(
            "Domain name missing or malformed" + this.msgFmt(message),
        );
    }

    public static Auth(message?: string): InitializationError {
        return new InitializationError(
            "Authentication parameters malformed" + this.msgFmt(message),
        );
    }
}
