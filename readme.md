# Optimizely X Node Client

Access the [Optimizely REST v2 API](opt-api) via javascript

### Installation

```bash
$ npm install optimizely-x-node-client
```

### Usage

```js
var OptimizelyClient = require('optimizely-x-node-client');

var authCredentials = {
    "clientId":"YOUR_CLIENT_ID",
    "clientSecret": "YOUR_CLIENT_SECRET",
    "accessToken":"YOUR_ACCESS_TOKEN",
    "refreshToken":"YOUR_REFRESH_TOKEN"
};

var oc = new OptimizelyClient(authCredentials);

oc.getProjects({page: 1, per_page:25}).then(function(data){ 
    console.log("%o", data.payload);
    return oc;
});
```
```

## Contributing

Please see [contributing.md](contributing.md).

## Copyright and license

Code copyright 2017 Web Marketing ROI. Released under the [Apache 2.0 License](http://www.apache.org/licenses/LICENSE-2.0).

[opt-api]:https://developers.optimizely.com/x/rest/v2/#attributes
