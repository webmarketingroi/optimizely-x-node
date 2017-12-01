# Optimizely X Node Client

A JavaScript/Node wrapper library for the Optimizely REST API v2.0 (https://developers.optimizely.com/rest/v2/), 
proudly created and open sourced by Optimizely Solutions Partner, [Web Marketing ROI](https://webmarketingroi.com.au).

### Installation

```bash
$ npm install optimizely-x-node-client
```

### Usage

```js
// Require the optimizely-x-node-client package
var OptimizelyClient = require('optimizely-x-node-client');

// Define OAuth 2 credentials in the form of an object.
// If you use the "OAuth 2.0 authorization code" grant, use the following object.
var authCredentials = {
    "clientId" : "YOUR_CLIENT_ID",
    "clientSecret" : "YOUR_CLIENT_SECRET",
    "accessToken" : "YOUR_ACCESS_TOKEN",
    "refreshToken" : "YOUR_REFRESH_TOKEN"
};

// Or, if you use the "OAuth 2.0 implicit grant" or "Optimizely personal 
// token", use the following object. Please note that personal tokens are not
// recommended to use in production environments.
var authCredentials = {
    "accessToken" : "YOUR_ACCESS_TOKEN",
};

// Create an instance of the OptimizelyClient. You can do that using the following lines of code:
var oc = new OptimizelyClient(authCredentials);

// Do something with the client. The client uses Bluebird Promises as return values of its methods. 

// For example, get the first page of projects, 25 projects per page
oc.getProjects({page: 1, per_page:25}).then(function(data){
    // Extract projects from the result. 
    // The result (the data variable) is an object containing the following fields:
    // - `url` - the URL of the request
    // - `statusCode` - the response status code (e.g. 200)
    // - `headers` - the response headers
    // - `meta` - parsed headers (used for pagination and rate limiting)
    // - `payload` - the array of projects

    // Dump the list of projects to the console
    console.log("%o", data.payload);
    
    // When the client makes a request, it may get the new access token by the refresh token 
    // (if the existing access token already expired). When you are done with the client, 
    // you may save the (updated) oc.authCredentials to a file or database for later consuming by the client.
    // If you don't save the new credentials/consume them to the client, the client will retrieve the new 
    // access token with each request (unneeded work). 
    var fs = require('fs');
    fs.writeFile("auth_credentials.json", JSON.stringify(oc.authCredentials), function(err) {
        if(err) {
            return console.log(err);
        }
    });
    
    return oc;
}.bind(oc));
```

## More Examples

### Creating a Project

```
var newProject = {
    "name" : "Some Project",
    "account_id" : 12345,
    "confidence_threshold" : 0.9,
    "platform" : "web",
    "status" : "active",
    "web_snippet" : {
      "enable_force_variation" : false,
      "exclude_disabled_experiments" : false,
      "exclude_names" : true,
      "include_jquery" : true,
      "ip_anonymization" : false,
      "ip_filter" : "^206\\.23\\.100\\.([5-9][0-9]|1([0-4][0-9]|50))$",
      "library" : "jquery-1.11.3-trim",
      "project_javascript" : "alert(\"Active Experiment\")"
    }
};

oc.createProject(newProject)
  .then(function(data) {
      // The following will dump the data of the newly create project
      console.log("%o", data.payload);
  });
```
  
### Reading a Project

```
oc.getProject({id: 123456})
  .then(function(data) {
      // The following will output the data of the project with ID 123456
      console.log("%o", data.payload);
  });
```

## Running Unit Tests

This library uses Mocha for testing. To run unit tests, use the following command:

`npm test`

If you want to run integration tests against a real Optimizely account, rename `test/auth_credentials.json.dist` 
to `test/auth_credentials.json` and type your credentials in that file. Then, create the 
`OPTIMIZELY_X_NODE_TEST_INTEGRATION` environment variable as follows

```
export OPTIMIZELY_X_NODE_TEST_INTEGRATION=1
```

and then run unit tests.

## Copyright and license

Code copyright 2017 Web Marketing ROI. Released under the [Apache 2.0 License](http://www.apache.org/licenses/LICENSE-2.0).

