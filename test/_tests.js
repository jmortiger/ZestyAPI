const ZestyAPI = require("../dist/ZestyAPI");

process?.loadEnvFile?.(process.env.ENV_FILE || "../.env.test");
// TODO: Set up environment file with auth.
const E621 = ZestyAPI.connect({
    userAgent: process.env.USER_AGENT || "ZestyAPI/Example",
    authLogin: (process.env.USERNAME && process.env.API_KEY) ? {
        username: process.env.USERNAME,
        apiKey: process.env.API_KEY,
    } : undefined,
    authToken: process.env.AUTH_TOKEN,
    debug: process.env.DEBUG,
});

module.exports = E621;
