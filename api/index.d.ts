export = RESTClient;
/**
 * @typedef {Object} RapidAnalysisResponse
 * @property {number} version
 * @property {string[]} output
 */
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
     * @returns {Promise<RapidAnalysisResponse>} - The JSON response from the API.
     */
    makeRequest(method: ("GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS"), endpoint: string, body?: any): Promise<RapidAnalysisResponse>;
    #private;
}
declare namespace RESTClient {
    export { RapidAnalysisResponse };
}
type RapidAnalysisResponse = {
    version: number;
    output: string[];
};
