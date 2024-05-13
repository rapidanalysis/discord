/**
 * @typedef {Object} RapidAnalysisResponse
 * @property {number} version
 * @property {string[]} output
 */

const fetch = require("node-fetch");

class RESTClient {
    #apiKey;

    /**
     * Constructs an instance of RESTClient
     * @constructor
     * @param {string} key 
     */
    constructor(key) {
        this.#apiKey = key;
    }

    /**
     * 
     * @param {("GET"|"POST"|"PUT"|"PATCH"|"DELETE"|"OPTIONS")} method - The HTTP method to use when fetching. 
     * @param {string} endpoint - The endpoint URL to be fetched. 
     * @param {Object} [body] - JSON payload to be sent when posting. 
     * @returns {Promise<RapidAnalysisResponse>} - The JSON response from the API. 
     */
    makeRequest(method, endpoint, body) {
        return new Promise((resolve, reject) => {
            fetch(`https://api.weburban.com/${endpoint}`, {
                method,
                body: JSON.stringify(body),
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "x-api-key": this.#apiKey
                }
            }).then(res => {
                if (!res.ok) {
                    res.json().then(json => reject(json.message));
                } else {
                    res.json().then(json => {
                        const fixedJson = Object.fromEntries(Object.entries(json).map(([key, value]) => {[key.toLowerCase(), value]}));
                        if (typeof fixedJson.output == "string") {
                            fixedJson.output = [fixedJson.output];
                        }
                        resolve(fixedJson);
                    });
                }     
            }).catch(err => reject(err));
        });
    }
}

module.exports = RESTClient;