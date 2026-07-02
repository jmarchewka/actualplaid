const https = require("https");

/**
 * Sends a notification via Pushover.
 * Never throws: resolves with a result object describing what happened, so
 * callers can either ignore it (fire-and-forget) or inspect it (e.g. a test command).
 * @param {{PUSHOVER_TOKEN: string, PUSHOVER_USER_KEY: string}} appConfig
 * @param {{title: string, message: string}} notification
 * @returns {Promise<{ok: boolean, skipped: boolean, statusCode?: number, responseBody?: string, error?: string}>}
 */
function sendPushoverNotification(appConfig, { title, message }) {
    if (!appConfig.PUSHOVER_TOKEN || !appConfig.PUSHOVER_USER_KEY) {
        return Promise.resolve({ ok: false, skipped: true });
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
                let responseBody = "";
                response.on("data", (chunk) => { responseBody += chunk; });
                response.on("end", () => {
                    const ok = response.statusCode < 400;
                    if (!ok) {
                        console.error(`Failed to send Pushover notification: HTTP ${response.statusCode} ${responseBody}`);
                    }
                    resolve({ ok, skipped: false, statusCode: response.statusCode, responseBody });
                });
            }
        );
        request.on("error", (e) => {
            console.error("Failed to send Pushover notification:", e.message);
            resolve({ ok: false, skipped: false, error: e.message });
        });
        request.write(body);
        request.end();
    });
}

module.exports = {
    sendPushoverNotification,
}
