# Optimizely X Node Client

Access the [Optimizely REST v2 API](https://developers.optimizely.com/x/rest/v2/index.html) via javascript

### Installation

```bash
$ npm install optimizely-x-node-client
```

### Usage

```js
var OptimizelyClient = require('optimizely-x-node-client');

// Define OAuth 2 credentials in the form of an object
var authCredentials = {
    "clientId" : "YOUR_CLIENT_ID",
    "clientSecret" : "YOUR_CLIENT_SECRET",
    "accessToken" : "YOUR_ACCESS_TOKEN",
    "refreshToken" : "YOUR_REFRESH_TOKEN"
};

// Create the Optimizely X client
var oc = new OptimizelyClient(authCredentials);

// Get the first page of projects, 25 projects per page
oc.getProjects({page: 1, per_page:25}).then(function(data){ 
    // The result (data) is an object containing the following fields:
    // - `url` - the URL of the request
    // - `headers` - the response headers
    // - `meta` - parsed headers (used for pagination and request limiting)
    // - `payload` - the array of projects

    // Dump the list of projects to the console
    console.log("%o", data.payload);
    return oc;
});
```

## Copyright and license

Code copyright 2017 Web Marketing ROI. Released under the [Apache 2.0 License](http://www.apache.org/licenses/LICENSE-2.0).

