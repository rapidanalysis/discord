class RESTClient {
    #apiKey;

    constructor(key) {
        this.#apiKey = key;
    }

    makeRequest(method, endpoint) {
        return new Promise((resolve, reject) => {
            fetch(`https://api.weburban.com/${endpoint}`, {
                method,
                headers: {
                    "x-api-key": this.#apiKey
                }
            }).then(res => {
                res.json().then(json => resolve(json));
            }).catch(err => reject(err));
        });
    }
}