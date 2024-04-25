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
     * @returns {Promise<Object>} - The JSON response from the API. 
     */
    makeRequest(method, endpoint, body) {
        return new Promise((resolve, reject) => {
            fetch(`https://api.weburban.com/${endpoint}`, {
                method,
                body,
                headers: {
                    "x-api-key": this.#apiKey
                }
            }).then(res => {
                res.json().then(json => resolve(json));
            }).catch(err => reject(err));
        });
    }
}

module.exports = RESTClient;