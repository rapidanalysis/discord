export = RESTClient;
declare class RESTClient {
    /**
     * Constructs an instance of RESTClient
     * @constructor
     * @param {string} key
     */
    constructor(key: string);
    /**
     *
     * @param {("GET"|"POST"|"PUT"|"PATCH"|"DELETE"|"OPTIONS")} method - The HTTP method to use when fetching.
     * @param {string} endpoint - The endpoint URL to be fetched.
     * @param {Object} [body] - JSON payload to be sent when posting.
     * @returns {Promise<Object>} - The JSON response from the API.
     */
    makeRequest(method: ("GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS"), endpoint: string, body?: any): Promise<any>;
    #private;
}
