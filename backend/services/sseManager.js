/**
 * SSE Manager — Bharat JanSetu
 * Maintains a registry of connected official dashboards.
 * Broadcasts real-time events when complaints are created, updated, or escalated.
 * No external dependencies — pure Node.js streams.
 */

const clients = new Set();

/**
 * Register a new SSE client (official's browser connection)
 * @param {object} res - Express response object (kept open)
 */
export const addClient = (res) => {
    clients.add(res);
    console.log(`[SSE] Client connected. Total active: ${clients.size}`);
};

/**
 * Remove a disconnected client
 * @param {object} res - Express response object
 */
export const removeClient = (res) => {
    clients.delete(res);
    console.log(`[SSE] Client disconnected. Total active: ${clients.size}`);
};

/**
 * Broadcast an event to ALL connected official dashboards
 * @param {string} eventType - Event name (NEW_COMPLAINT | STATUS_UPDATE | ESCALATION)
 * @param {object} data - Payload to send
 */
export const broadcast = (eventType, data) => {
    if (clients.size === 0) return; // No one connected, skip
    const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
    clients.forEach(client => {
        try {
            client.write(payload);
        } catch (err) {
            // Client disconnected mid-write — clean up
            removeClient(client);
        }
    });
    console.log(`[SSE] Broadcast [${eventType}] to ${clients.size} client(s).`);
};
