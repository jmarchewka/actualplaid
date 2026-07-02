const https = require("https");

/**
 * Sends a notification via Pushover. Silently no-ops if Pushover isn't configured,
 * and logs (rather than throws) on failure, since a notification issue shouldn't fail an import.
 * @param {{PUSHOVER_TOKEN: string, PUSHOVER_USER_KEY: string}} appConfig
 * @param {{title: string, message: string}} notification
 */
function sendPushoverNotification(appConfig, { title, message }) {
    if (!appConfig.PUSHOVER_TOKEN || !appConfig.PUSHOVER_USER_KEY) {
        return Promise.resolve();
    }

    const body = new URLSearchParams({
        token: appConfig.PUSHOVER_TOKEN,
        user: appConfig.PUSHOVER_USER_KEY,
        title,
        message,
    }).toString();

    return new Promise((resolve) => {
        const request = https.request(
            {
                hostname: "api.pushover.net",
                path: "/1/messages.json",
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Content-Length": Buffer.byteLength(body),
                },
            },
            (response) => {
                response.on("data", () => {});
                response.on("end", () => {
                    if (response.statusCode >= 400) {
                        console.error(`Failed to send Pushover notification: HTTP ${response.statusCode}`);
                    }
                    resolve();
                });
            }
        );
        request.on("error", (e) => {
            console.error("Failed to send Pushover notification:", e.message);
            resolve();
        });
        request.write(body);
        request.end();
    });
}

module.exports = {
    sendPushoverNotification,
}
