/**
 * @fileOverview Optimizely X Client for Node.js
 * @name Optimizely Client
 * @author Oleg Krivtsov <oleg@webmarketingroi.com.au>
 */

/** @access private */
var Promise = require("bluebird");
var rest = require('restler');
var queryString = require('query-string');

/** @const*/
var methodNamesToPromisify =
  "get post put del head patch json postJson putJson".split(" ");

var EventEmitterPromisifier = function(originalMethod) {
  // return a function
  return function promisified() {
    var args = [].slice.call(arguments);
    // Needed so that the original method can be called with the correct receiver
    var self = this;
    // which returns a promise
    return new Promise(function(resolve, reject) {
      // We call the originalMethod here because if it throws,
      // it will reject the returned promise with the thrown error
      var emitter = originalMethod.apply(self, args);

      emitter
        .on("success", function(data, response) {
          resolve({'payload':data, 'response': response});
        })
        .on("fail", function(data) {
          //Failed Responses including 400 status codes
          reject(data);
        })
        .on("error", function(err) {
          //Internal Error
          reject(err);
        })
        .on("abort", function() {
          reject(new Promise.CancellationError());
        })
        .on("timeout", function() {
          reject(new Promise.TimeoutError());
        });
    });
  };
};

console.log('argh!');

Promise.promisifyAll(rest, {
  filter: function(name) {
    return methodNamesToPromisify.indexOf(name) > -1;
  },
  promisifier: EventEmitterPromisifier
});
////////////////
//0. Constructor
////////////////
/**
 * @public
 * @Constructor
 * @name OptimizelyClient
 * @since 0.0.1
 * @description Optimizely Client Constructor
 * @param {object} authCredentials OAuth2 credentials with the following properties:
 * {
 *    @param {String} clientId 
 *    @param {String} clientSecret
 *    @param {String} refreshToken
 *    @param {String} accessToken
 * }
 * @return {OptimizelyClient} The newly created optimizely client.
 */
var OptimizelyClient = function(authCredentials) {
    this.authCredentials = authCredentials;
    
    this.baseUrl = "https://api.optimizely.com/v2/";
    
    this.baseHeaders = {
        'Authorization': 'Bearer ' + this.authCredentials.accessToken,
        'Content-Type': 'application/json'
    };
  }
  
  /**
 * Retrieves the access token by refresh token (if the access token has expired).
 */
OptimizelyClient.prototype.prepare = function() {

    if (this.authCredentials.refreshToken && this.isAccessTokenExpired()) {
        return this.getAccessTokenByRefreshToken();
    }
    
    return Promise.resolve(this);
};

/**
 * Returns true if the access token has expired.
 */
OptimizelyClient.prototype.isAccessTokenExpired = function() {
    if (!this.authCredentials.accessToken) {
        return true;
    }
    
    if (!this.authCredentials.expiresIn || !this.authCredentials.accessTokenTimestamp) {
        return true;
    }
    
    var expiresIn = this.authCredentials.expiresIn;
    var accessTokenTimestamp = this.authCredentials.accessTokenTimestamp;
    var unixTimestamp = Math.round(+new Date()/1000);
    
    if (accessTokenTimestamp + expiresIn < unixTimestamp) {
        return true;
    }
    
    return false;
}

/**
 * Retrieves the access token by refresh token.
 */
OptimizelyClient.prototype.getAccessTokenByRefreshToken = function() {
    
    if (!this.authCredentials.clientId) {
        throw new Error('Client ID not set');
    }
    
    if (!this.authCredentials.clientSecret) {
        throw new Error('Client secret not set');
    }
    
    if (!this.authCredentials.refreshToken) {
        throw new Error('Refresh token not set');
    }
    
    var url = "https://app.optimizely.com/oauth2/token?refresh_token="+this.authCredentials.refreshToken+ 
                "&client_id="+this.authCredentials.clientId+"&client_secret="+this.authCredentials.clientSecret+"&grant_type=refresh_token";
                
    return rest.postAsync(url, {method: 'post', headers: this.baseHeaders}).then(function(data){
        this.authCredentials.accessToken = data.payload.access_token;
        this.authCredentials.tokenType = data.payload.token_type;
        this.authCredentials.expiresIn = data.payload.expires_in;
        this.authCredentials.accessTokenTimestamp = Math.round(+new Date()/1000);
        
        this.baseHeaders = {
            'Authorization': 'Bearer ' + this.authCredentials.accessToken,
            'Content-Type': 'application/json'
        };
        
        return this;
    }.bind(this));            
}
  
/**
 * Private function that retrieves meta information from HTTP headers.
 */
function parseHttpHeaders(headers) {
    var meta = {};
    
    for (var headerName in headers) {
        var headerValue = headers[headerName];
        
        if (headerName=="x-ratelimit-limit") {
            meta.rateLimit = headerValue;
        } else if (headerName=="x-ratelimit-remaining") {
            meta.rateLimitRemaining = headerValue;
        } else if (headerName=="x-ratelimit-reset") {
            meta.rateLimitReset = headerValue;
        } else if (headerName=="link") {
            var regexp = /<(.+)>; rel=(.+),?/g;
            var match;
            do {
                match = regexp.exec(headerValue);
                if (match) {
                    var url = match[1];
                    var rel = match[2];
                    
                    var regexp2 = /[\?|&]page=(\d+)/;
                    var match2 = regexp2.exec(url);
                    if (match2) {
                        var page = match2[1];
                        if (rel=='prev') {
                            meta.prevPage = page;
                        } else if (rel=='next') {
                            meta.nextPage = page;
                        } else if (rel=='last') {
                            meta.lastPage = page;
                        }
                    }
                }
            } while (match);
        } 
    }
    
    return meta;
}  

  ////////////////
  //1. Projects
  ////////////////
  
 /**
 * @public
 * @name  OptimizelyClient#getProjects
 * @description Retrieves a list of projects from Optimizely
 * @param {object} options object with the following properties:
 * {
 *    @param {Number} [page]
 *    @param {Number} [per_page]
 * }
 * @return {promice} A promice fulfilled with the page of projects
 */
OptimizelyClient.prototype.getProjects = function(options) {
    var theUrl = this.baseUrl + 'projects?' + queryString.stringify(options);
    
    return this.prepare().then(function(oc) {
        return rest.getAsync(theUrl, {headers:oc.baseHeaders}).then(function(data) {
            return {
                url: theUrl,
                statusCode:data.response.statusCode, 
                rawHeaders: data.response.headers, 
                meta: parseHttpHeaders(data.response.headers), 
                payload:data.payload
            };
        });
    });
}

/**
 * @pubilc
 * @name OptimizelyClient#getProject
 * @description Retrieve a project from Optimizely
 * @param {object} options An object with the following properties:
 * {
 *   @param {string} id
 * }
 * @note the id may be passed as a string instead of a member of an object
 * @return {promise}  A promise fulfilled with the project
 */
OptimizelyClient.prototype.getProject = function(options) {
    if (typeof options === "string" || typeof options === "number") options = {
      id: options
    };
    options = options || {};
    options.id = String(options.id || "");
    if (!options.id) throw new Error("required: options.id");
    var theUrl = this.baseUrl + 'projects/' + options.id;
    return this.prepare().then(function(oc){
        return rest.getAsync(theUrl, {
            method: 'get',
            headers: oc.baseHeaders
        }).then(function(data){
            return {
                url: theUrl,
                statusCode:data.response.statusCode, 
                rawHeaders: data.response.headers, 
                meta: parseHttpHeaders(data.response.headers), 
                payload:data.payload
            };
        });
    });
  }

/**
 * @pubilc
 * @name OptimizelyClient#createProject
 * @description Create a project in Optimizely
 * @param {object} options An object describing the new project
 * @returns {promise} A promise fulfilled with the created project
 */
OptimizelyClient.prototype.createProject = function(options) {

    var postUrl = this.baseUrl + 'projects';

    return this.prepare().then(function(oc){
        return rest.postAsync(postUrl, {
            method: 'post',
            headers: oc.baseHeaders,
            data: JSON.stringify(options)});
    }).then(function(data){
        return {
            url: postUrl,
            statusCode: data.response.statusCode,
            rawHeaders: data.response.headers,
            meta: parseHttpHeaders(data.response.headers),
            payload: data.payload
        };
    });
  }
/**
 * @public
 * @name  OptimizelyClient#updateProject
 * @description  Update an Existing Project in Optimizely
 * @param  {object} options object with the project data
 * @return {promise}  A promise fulfilled with the updated project
 */
OptimizelyClient.prototype.updateProject = function(options) {
    options = options || {};
    options.id = options.id || false;
    if(!options.id) throw new Error('required: options.id');
    var putUrl = this.baseUrl + 'projects/' + options.id;
    return this.prepare().then(function(oc){
        return rest.putAsync(putUrl, {
            method: 'put',
            headers: oc.baseHeaders,
            data: JSON.stringify(options)
        });
    }).then(function(data){
        return {
            url: putUrl,
            statusCode: data.response.statusCode,
            rawHeaders: data.response.headers,
            meta: parseHttpHeaders(data.response.headers),
            payload: data.payload
        };
    });
  }

 
////////////////
//2. Experiments
////////////////

/**
 *@pubilc
 *@name OptimizelyClient#getExperiments
 *@description Retrieve all experiments associatd with a given project
 *@param {object} options An object with the following properties:
 *{
    @param {number} per_page
    @param {number} page
 *  @param {string} project_id
    @param {string} campaign_id
    @param {boolean} include_classic
 *}
 *@note the id may be passed as a string instead of a member of an object
 *@return {promise}  A promise fulfilled with the updated project
 */
OptimizelyClient.prototype.getExperiments = function(options) {
    if (typeof options === "string" || typeof options === "number") options = {
      project_id: options
    };
    options = options || {};
    options.project_id = String(options.project_id || "");
    if (!options.project_id) throw new Error("required: options.project_id");
    var theUrl = this.baseUrl + 'experiments?' + queryString.stringify(options);
    return this.prepare().then(function(oc){
        return rest.getAsync(theUrl, {
            method: 'get',
            headers: oc.baseHeaders
        });
    }).then(function(data){
        return {
            url: theUrl,
            statusCode: data.response.statusCode,
            rawHeaders: data.response.headers,
            meta: parseHttpHeaders(data.response.headers),
            payload: data.payload
        };
    });
}

/**
 *@pubilc
 *@name OptimizelyClient#getExperiment
 *@description Retrieve an experiment by id/object.id
 *@param {object} options An object with the following properties:
 *{
 *  @param id
 *}
 *@note the id may be passed as a string instead of a member of an object
 */
OptimizelyClient.prototype.getExperiment = function(options) {
    if (typeof options === "string" || typeof options === "number") options = {
      id: options
    };
    options = options || {};
    options.id = String(options.id || "");
    if (!options.id) throw new Error("required: options.id");
    var theUrl = this.baseUrl + 'experiments/' + options.id;
    return this.prepare().then(function(oc){
        return rest.getAsync(theUrl, {
          method: 'get',
          headers: this.baseHeaders
        });
    }).then(function(data){
        return {
            url: theUrl,
            statusCode: data.response.statusCode,
            rawHeaders: data.response.headers,
            meta: parseHttpHeaders(data.response.headers),
            payload: data.payload
        };
    });
  }

/**
 *@pubilc
 *@name OptimizelyClient#createExperiment
 *@description create an experiment in Optimizely
  @param {object} options object with query params
 *@param {object} experiment object with the experiment data
 *@return {promise}  A promise fulfilled with the updated project
 */
OptimizelyClient.prototype.createExperiment = function(options, experiment) {
    if (!options.action) throw new Error("Required: options.action");
    var postUrl = this.baseUrl + 'experiments?' + queryString.stringify(options);
    
    return this.prepare().then(function(oc) {
        return rest.postAsync(postUrl, {'headers':oc.baseHeaders, 'data': JSON.stringify(experiment)}).then(function(data) {
            console.log("%o", data.payload);
            return {
                url: postUrl,
                statusCode:data.response.statusCode, 
                rawHeaders: data.response.headers, 
                meta: parseHttpHeaders(data.response.headers), 
                payload:data.payload
            };
        });
    });
  }

/**
 *@pubilc
 *@name OptimizelyClient#updateExperiment
 *@description Update an experiment
 *@param {object} options An object with the query parameters
 *@param {object} experiment An object with the experiment data
 */
OptimizelyClient.prototype.updateExperiment = function(options, experiment) {
    var theUrl = this.baseUrl + 'experiments/' + options.id;
    delete options.id;
    theUrl += '?' + queryString.stringify(options);
    return this.prepare().then(function(oc){
        return rest.patchAsync(theUrl, {
          headers: oc.baseHeaders,
          data: JSON.stringify(experiment)
        });
    }).then(function(data){
        return {
            url: theUrl,
            statusCode: data.response.statusCode,
            rawHeaders: data.response.headers,
            meta: parseHttpHeaders(data.response.headers),
            payload: data.payload
        };
    });
  }
  
/**
 *@pubilc
 *@name OptimizelyClient#deleteExperiment
 *@description Delete an experiment by id/object.id
 *@param {object} options An object with the following properties:
 *{
 *  @param id
 *}
 *@note the id may be passed as a string/number instead of a member of an object
 */
OptimizelyClient.prototype.deleteExperiment = function(options) {
    if (typeof options === "string" || typeof options === "number") options = {
      id: options
    };
    options = options || {};
    options.id = String(options.id || "");
    if (!options.id) throw new Error("required: options.id");
    var theUrl = this.baseUrl + 'experiments/' + options.id;
    return this.prepare().then(function(oc){
        return rest.delAsync(theUrl, {
            method: 'delete',
            headers: oc.baseHeaders
        });
    }).then(function(data){
        return {
            url: theUrl,
            statusCode: data.response.statusCode,
            rawHeaders: data.response.headers,
            meta: parseHttpHeaders(data.response.headers),
            payload: data.payload
        };
    });
  }
  
/**
 * @public
 * @name  OptimizelyClient#getResults
 * @description get experiment results
 * @param {object} options An object with the query parameters
 */
OptimizelyClient.prototype.getExperimentResults = function(options) {
    if (!options.id) throw new Error("required: options.id");
    var theUrl = this.baseUrl + 'experiments/' + options.id;
    delete options.id;
    theUrl += '/results?' + queryString.stringify(options);
    
    return this.prepare().then(function(oc){
        return rest.getAsync(theUrl, {
            method: 'GET',
            headers: oc.baseHeaders
        });
    }).then(function(data){
        return {
            url: theUrl,
            statusCode: data.response.statusCode,
            rawHeaders: data.response.headers,
            meta: parseHttpHeaders(data.response.headers),
            payload: data.payload
        };
    });
  }

////////////////
//3. Audiences
////////////////

/**
 * @public
 * @name  OptimizelyClient#getAudiences
 * @description Retrieves a list of Audiences in a project from Optimizely
 * @param {object} options An object with the following properties:
 * {
 *   @param {string|number} id The Project ID
 * }
 * @return {promise} A promise fulfilled with an array of all Audiences
 *
 */
OptimizelyClient.prototype.getAudiences = function(options){
    if (typeof options === "string" || typeof options === "number") options = {
      id: options
    };
    options = options || {};
    options.id = options.id || "";
    if (!options.id) throw new Error("required: options.id");
    var theUrl = this.baseUrl + 'audiences?' + queryString.stringify(options);
    return this.prepare().then(function(oc){ 
        return rest.getAsync(theUrl, {
            method: 'get',
            headers: oc.baseHeaders
        });
    }).then(function(data){
        return {
            url: theUrl,
            statusCode: data.response.statusCode,
            rawHeaders: data.response.headers,
            meta: parseHttpHeaders(data.response.headers),
            payload: data.payload
        };
    });
  }
  
/**
 * @pubilc
 * @name OptimizelyClient#getAudience
 * @description Read an audience in Optimizely
 * @param {object} options An object with the following properties:
 * {
 *   @param {string|number} id The Audience ID
 * }
 * @returns {promise} A promise fulfilled with the Audience
 * @note the id may be passed as a string instead of a member of an object
 */
OptimizelyClient.prototype.getAudience = function(options) {
    if (typeof options === "string") options = {
      id: options
    };
    if (!options.id) throw new Error("Required: options.id");
    var theUrl = this.baseUrl + 'audiences/' + options.id;
    return this.prepare().then(function(oc){
        return rest.getAsync(theUrl, {
            method: 'get',
            headers: oc.baseHeaders
        });
    }).then(function(data){
        return {
            url: theUrl,
            statusCode: data.response.statusCode,
            rawHeaders: data.response.headers,
            meta: parseHttpHeaders(data.response.headers),
            payload: data.payload
        };
    });
  }
/**
 * @pubilc
 * @name OptimizelyClient#createAudience
 * @since 0.4.0
 * @description Create an Audience in Optimizely
 * @param {object} options An object with the audience description
 * @returns {promise} A promise fulfilled with the created project
 */
OptimizelyClient.prototype.createAudience = function(options) {
    options = options || {};
    if (!options.id) throw new Error("Required: options.id");

    var postUrl = this.baseUrl + 'audiences';
    return this.prepare().then(function(oc){
        return rest.postAsync(postUrl, {
            method: 'post',
            headers: oc.baseHeaders,
            data: JSON.stringify(options)
        });
    }).then(function(data){
        return {
            url: postUrl,
            statusCode: data.response.statusCode,
            rawHeaders: data.response.headers,
            meta: parseHttpHeaders(data.response.headers),
            payload: data.payload
        };
    });
  }
  
/**
 * @public
 * @name  OptimizelyClient#updateAudience
 * @since  0.4.0
 * @description  Update an Existing Project in Optimizely
 * @param  {object} options object with the audience data
 * @return {promise}  A promise fulfilled with the updated audience
 */
OptimizelyClient.prototype.updateAudience = function(options) {
    if(!options.id) throw new Error('required: options.id');
    var putUrl = this.baseUrl + 'audiences/' + options.id;
    return this.prepare().then(function(oc){
        return rest.putAsync(putUrl, {
            method: 'put',
            headers: oc.baseHeaders,
            data: JSON.stringify(options)
        });
    }).then(function(data){
        return {
            url: putUrl,
            statusCode: data.response.statusCode,
            rawHeaders: data.response.headers,
            meta: parseHttpHeaders(data.response.headers),
            payload: data.payload
        };
    });
  }

////////////////
//4. Campaigns
////////////////
  
/**
 * @public
 * @name  OptimizelyClient#getCampaigns
 * @description Retrieves a list of Campaigns in a project from Optimizely
 * @param {object} options An object with the following properties:
 * {
 *   @param {string|number} id The Project ID
 * }
 * @return {promise} A promise fulfilled with an array of Campaigns
 *
 */
OptimizelyClient.prototype.getCampaigns = function(options){
    var theUrl = this.baseUrl + 'campaigns?' + queryString.stringify(options);
    return this.prepare().then(function(oc){ 
        return rest.getAsync(theUrl, {
            method: 'get',
            headers: oc.baseHeaders
        });
    }).then(function(data){
        return {
            url: theUrl,
            statusCode: data.response.statusCode,
            rawHeaders: data.response.headers,
            meta: parseHttpHeaders(data.response.headers),
            payload: data.payload
        };
    });
  }
  
/**
 * @pubilc
 * @name OptimizelyClient#getCampaign
 * @description Read a Campaign in Optimizely
 * @param {object} options An object with the following properties:
 * {
 *   @param {string|number} id The Campaign ID
 * }
 * @returns {promise} A promise fulfilled with the Campaign
 * @note the id may be passed as a string instead of a member of an object
 */
OptimizelyClient.prototype.getCampaign = function(options) {
    if (typeof options === "string") options = {
      id: options
    };
    if (!options.id) throw new Error("Required: options.id");
    var theUrl = this.baseUrl + 'campaigns/' + options.id;
    return this.prepare().then(function(oc){
        return rest.getAsync(theUrl, {
            method: 'get',
            headers: oc.baseHeaders
        });
    }).then(function(data){
        return {
            url: theUrl,
            statusCode: data.response.statusCode,
            rawHeaders: data.response.headers,
            meta: parseHttpHeaders(data.response.headers),
            payload: data.payload
        };
    });
  }
/**
 * @pubilc
 * @name OptimizelyClient#createCampaign
 * @description Create a Campaign in Optimizely
 * @param {object} options An object with query parameters.
 * @param {object} campaign An object with the audience description
 * @returns {promise} A promise fulfilled with the created project
 */
OptimizelyClient.prototype.createCampaign = function(options, campaign) {
    
    var postUrl = this.baseUrl + 'campaigns?' + queryString.stringify(options);
    return this.prepare().then(function(oc){
        return rest.postAsync(postUrl, {
            method: 'post',
            headers: oc.baseHeaders,
            data: JSON.stringify(campaign)
        });
    }).then(function(data){
        return {
            url: postUrl,
            statusCode: data.response.statusCode,
            rawHeaders: data.response.headers,
            meta: parseHttpHeaders(data.response.headers),
            payload: data.payload
        };
    });
  }
  
/**
 * @public
 * @name  OptimizelyClient#updateCampaign
 * @since  0.4.0
 * @description  Update an Existing Campaign in Optimizely
 * @param {object} options An object with query parameters.
 * @param  {object} campaign object with the campaign data
 * @return {promise}  A promise fulfilled with the updated campaign
 */
OptimizelyClient.prototype.updateCampaign = function(options, campaign) {
    if(!options.campaign_id) throw new Error('required: options.campaign_id');
    var putUrl = this.baseUrl + 'campaigns/' + options.campaign_id;
    delete options.campaign_id;
    putUrl += "?" + queryString.stringify(options);
    return this.prepare().then(function(oc){
        return rest.putAsync(putUrl, {
            method: 'put',
            headers: oc.baseHeaders,
            data: JSON.stringify(campaign)
        });
    }).then(function(data){
        return {
            url: putUrl,
            statusCode: data.response.statusCode,
            rawHeaders: data.response.headers,
            meta: parseHttpHeaders(data.response.headers),
            payload: data.payload
        };
    });
  }
  
  /**
 *@pubilc
 *@name OptimizelyClient#deleteCampaign
 *@description Delete a Campaign by ID
 *@param {object} options An object with the following properties:
 *{
 *  @param id
 *}
 *@note the id may be passed as a string/number instead of a member of an object
 */
OptimizelyClient.prototype.deleteCampaign = function(options) {
    if (typeof options === "string" || typeof options === "number") options = {
      id: options
    };
    options = options || {};
    options.id = String(options.id || "");
    if (!options.id) throw new Error("required: options.id");
    var theUrl = this.baseUrl + 'campaigns/' + options.id;
    return this.prepare().then(function(oc){
        return rest.delAsync(theUrl, {
            method: 'delete',
            headers: oc.baseHeaders
        });
    }).then(function(data){
        return {
            url: theUrl,
            statusCode: data.response.statusCode,
            rawHeaders: data.response.headers,
            meta: parseHttpHeaders(data.response.headers),
            payload: data.payload
        };
    });
  }
  
/**
 * @public
 * @name  OptimizelyClient#getCampaignResults
 * @description get campaign results
 * @param {object} options An object with the query parameters
 */
OptimizelyClient.prototype.getCampaignResults = function(options) {
    if (!options.id) throw new Error("required: options.id");
    var theUrl = this.baseUrl + 'campaigns/' + options.id + '/results?' + queryString.stringify(options);
    
    return this.prepare().then(function(oc){
        return rest.getAsync(theUrl, {
            method: 'GET',
            headers: oc.baseHeaders
        });
    }).then(function(data){
        return {
            url: theUrl,
            statusCode: data.response.statusCode,
            rawHeaders: data.response.headers,
            meta: parseHttpHeaders(data.response.headers),
            payload: data.payload
        };
    });
  }
  
////////////////
// 5. Pages
////////////////
  
/**
 * @public
 * @name  OptimizelyClient#getPages
 * @description Retrieves a list of Pages in a project from Optimizely
 * @param {object} options An object with the following properties:
 * {
 *   @param {string|number} id The Project ID
 * }
 * @return {promise} A promise fulfilled with an array of Pages
 *
 */
OptimizelyClient.prototype.getPages = function(options){
    var theUrl = this.baseUrl + 'pages?' + queryString.stringify(options);
    return this.prepare().then(function(oc){ 
        return rest.getAsync(theUrl, {
            method: 'get',
            headers: oc.baseHeaders
        });
    }).then(function(data){
        return {
            url: theUrl,
            statusCode: data.response.statusCode,
            rawHeaders: data.response.headers,
            meta: parseHttpHeaders(data.response.headers),
            payload: data.payload
        };
    });
  }
  
/**
 * @pubilc
 * @name OptimizelyClient#getPage
 * @description Read a Page in Optimizely
 * @param {object} options An object with the following properties:
 * {
 *   @param {string|number} id The Page ID
 * }
 * @returns {promise} A promise fulfilled with the Page
 * @note the id may be passed as a string instead of a member of an object
 */
OptimizelyClient.prototype.getPage = function(options) {
    if (typeof options === "string") options = {
      id: options
    };
    if (!options.id) throw new Error("Required: options.id");
    var theUrl = this.baseUrl + 'pages/' + options.id;
    return this.prepare().then(function(oc){
        return rest.getAsync(theUrl, {
            method: 'get',
            headers: oc.baseHeaders
        });
    }).then(function(data){
        return {
            url: theUrl,
            statusCode: data.response.statusCode,
            rawHeaders: data.response.headers,
            meta: parseHttpHeaders(data.response.headers),
            payload: data.payload
        };
    });
  }
/**
 * @pubilc
 * @name OptimizelyClient#createPage
 * @description Create a Page in Optimizely
 * @param {object} options An object with query parameters.
 * @param {object} page An object with the Page description
 * @returns {promise} A promise fulfilled with the created Page
 */
OptimizelyClient.prototype.createPage = function(options, page) {
    
    var postUrl = this.baseUrl + 'pages?' + queryString.stringify(options);
    return this.prepare().then(function(oc){
        return rest.postAsync(postUrl, {
            method: 'post',
            headers: oc.baseHeaders,
            data: JSON.stringify(page)
        });
    }).then(function(data){
        return {
            url: postUrl,
            statusCode: data.response.statusCode,
            rawHeaders: data.response.headers,
            meta: parseHttpHeaders(data.response.headers),
            payload: data.payload
        };
    });
  }
  
/**
 * @public
 * @name  OptimizelyClient#updatePage
 * @description  Update an Existing Page in Optimizely
 * @param {object} options An object with query parameters.
 * @param  {object} campaign object with the Page data
 * @return {promise}  A promise fulfilled with the updated Page
 */
OptimizelyClient.prototype.updatePage = function(options, page) {
    if(!options.id) throw new Error('required: options.id');
    var putUrl = this.baseUrl + 'pages/' + options.id;
    return this.prepare().then(function(oc){
        return rest.putAsync(putUrl, {
            method: 'put',
            headers: oc.baseHeaders,
            data: JSON.stringify(options)
        });
    }).then(function(data){
        return {
            url: putUrl,
            statusCode: data.response.statusCode,
            rawHeaders: data.response.headers,
            meta: parseHttpHeaders(data.response.headers),
            payload: data.payload
        };
    });
  }
  
  /**
 *@pubilc
 *@name OptimizelyClient#deletePage
 *@description Delete a Page by ID
 *@param {object} options An object with the following properties:
 *{
 *  @param id
 *}
 *@note the id may be passed as a string/number instead of a member of an object
 */
OptimizelyClient.prototype.deletePage = function(options) {
    if (typeof options === "string" || typeof options === "number") options = {
      id: options
    };
    options = options || {};
    options.id = String(options.id || "");
    if (!options.id) throw new Error("required: options.id");
    var theUrl = this.baseUrl + 'pages/' + options.id;
    return this.prepare().then(function(oc){
        return rest.delAsync(theUrl, {
            method: 'delete',
            headers: oc.baseHeaders
        });
    }).then(function(data){
        return {
            url: theUrl,
            statusCode: data.response.statusCode,
            rawHeaders: data.response.headers,
            meta: parseHttpHeaders(data.response.headers),
            payload: data.payload
        };
    });
  }
  
////////////////
// 6. Events
////////////////
  
/**
 * @public
 * @name  OptimizelyClient#getEvents
 * @description Retrieves a list of Events in a project from Optimizely
 * @param {object} options An object with query parameters
 * @return {promise} A promise fulfilled with an array of Pages
 *
 */
OptimizelyClient.prototype.getEvents = function(options){
    var theUrl = this.baseUrl + 'events?' + queryString.stringify(options);
    return this.prepare().then(function(oc){ 
        return rest.getAsync(theUrl, {
            method: 'get',
            headers: oc.baseHeaders
        });
    }).then(function(data){
        return {
            url: theUrl,
            statusCode: data.response.statusCode,
            rawHeaders: data.response.headers,
            meta: parseHttpHeaders(data.response.headers),
            payload: data.payload
        };
    });
  }
  
/**
 * @pubilc
 * @name OptimizelyClient#getEvent
 * @description Read an Event in Optimizely
 * @param {object} options An object with the following properties:
 * {
 *   @param {string|number} id The Event ID
 * }
 * @returns {promise} A promise fulfilled with the Event
 * @note the id may be passed as a string instead of a member of an object
 */
OptimizelyClient.prototype.getEvent = function(options) {
    if (typeof options === "string") options = {
      id: options
    };
    if (!options.id) throw new Error("Required: options.id");
    var theUrl = this.baseUrl + 'events/' + options.id;
    return this.prepare().then(function(oc){
        return rest.getAsync(theUrl, {
            method: 'get',
            headers: oc.baseHeaders
        });
    }).then(function(data){
        return {
            url: theUrl,
            statusCode: data.response.statusCode,
            rawHeaders: data.response.headers,
            meta: parseHttpHeaders(data.response.headers),
            payload: data.payload
        };
    });
  }
  
/**
 * @pubilc
 * @name OptimizelyClient#createInPageEvent
 * @description Create an In-Page Event in Optimizely
 * @param {object} options An object with query parameters.
 * @param {object} page An object with the Event description
 * @returns {promise} A promise fulfilled with the created In-Page Event
 */
OptimizelyClient.prototype.createInPageEvent = function(options, page) {
    
    var postUrl = this.baseUrl + 'pages/' + options.page_id + '/events';
    return this.prepare().then(function(oc){
        return rest.postAsync(postUrl, {
            method: 'post',
            headers: oc.baseHeaders,
            data: JSON.stringify(page)
        });
    }).then(function(data){
        return {
            url: postUrl,
            statusCode: data.response.statusCode,
            rawHeaders: data.response.headers,
            meta: parseHttpHeaders(data.response.headers),
            payload: data.payload
        };
    });
  }

/**
 * @pubilc
 * @name OptimizelyClient#createCustomEvent
 * @description Create a Custom Event in Optimizely
 * @param {object} options An object with query parameters.
 * @param {object} page An object with the Event description
 * @returns {promise} A promise fulfilled with the created In-Page Event
 */
OptimizelyClient.prototype.createCustomEvent = function(options, page) {
    
    var postUrl = this.baseUrl + 'projects/' + options.project_id + '/custom_events';
    return this.prepare().then(function(oc){
        return rest.postAsync(postUrl, {
            method: 'post',
            headers: oc.baseHeaders,
            data: JSON.stringify(page)
        });
    }).then(function(data){
        return {
            url: postUrl,
            statusCode: data.response.statusCode,
            rawHeaders: data.response.headers,
            meta: parseHttpHeaders(data.response.headers),
            payload: data.payload
        };
    });
  }
  
/**
 * @public
 * @name  OptimizelyClient#updateInPageEvent
 * @description  Update an Existing In-Page Event in Optimizely
 * @param {object} options An object with query parameters.
 * @param  {object} event object with the Event data
 * @return {promise}  A promise fulfilled with the updated Event
 */
OptimizelyClient.prototype.updateInPageEvent = function(options, event) {
    if(!options.page_id) throw new Error('required: options.page_id');
    var putUrl = this.baseUrl + 'pages/' + options.page_id + '/events/' + options.event_id;
    return this.prepare().then(function(oc){
        return rest.putAsync(putUrl, {
            method: 'put',
            headers: oc.baseHeaders,
            data: JSON.stringify(options)
        });
    }).then(function(data){
        return {
            url: putUrl,
            statusCode: data.response.statusCode,
            rawHeaders: data.response.headers,
            meta: parseHttpHeaders(data.response.headers),
            payload: data.payload
        };
    });
  }

/**
 * @public
 * @name  OptimizelyClient#updateCustomEvent
 * @description  Update an Existing Custom Event in Optimizely
 * @param {object} options An object with query parameters.
 * @param  {object} event object with the Event data
 * @return {promise}  A promise fulfilled with the updated Event
 */
OptimizelyClient.prototype.updateCustomEvent = function(options, event) {
    if(!options.project_id) throw new Error('required: options.project_id');
    var putUrl = this.baseUrl + 'projects/' + options.project_id + '/custom_events/' + options.event_id;
    return this.prepare().then(function(oc){
        return rest.putAsync(putUrl, {
            method: 'put',
            headers: oc.baseHeaders,
            data: JSON.stringify(options)
        });
    }).then(function(data){
        return {
            url: putUrl,
            statusCode: data.response.statusCode,
            rawHeaders: data.response.headers,
            meta: parseHttpHeaders(data.response.headers),
            payload: data.payload
        };
    });
  }

  
 /**
 *@pubilc
 *@name OptimizelyClient#deleteInPageEvent
 *@description Delete an In-Page Event by ID
 *@param {object} options An object with the following properties:
 *{
 *  @param id
 *}
 *@note the id may be passed as a string/number instead of a member of an object
 */
OptimizelyClient.prototype.deleteInPageEvent = function(options) {
    if (!options.page_id) throw new Error("required: options.page_id");
    var theUrl = this.baseUrl + 'pages/' + options.page_id + '/events/' + options.event_id;
    return this.prepare().then(function(oc){
        return rest.delAsync(theUrl, {
            method: 'delete',
            headers: oc.baseHeaders
        });
    }).then(function(data){
        return {
            url: theUrl,
            statusCode: data.response.statusCode,
            rawHeaders: data.response.headers,
            meta: parseHttpHeaders(data.response.headers),
            payload: data.payload
        };
    });
  }

/**
 *@pubilc
 *@name OptimizelyClient#deleteCustomEvent
 *@description Delete a Custom Event by ID
 *@param {object} options An object with the following properties:
 *{
 *  @param id
 *}
 *@note the id may be passed as a string/number instead of a member of an object
 */
OptimizelyClient.prototype.deleteCustomEvent = function(options) {
    if (!options.project_id) throw new Error("required: options.project_id");
    var theUrl = this.baseUrl + 'projects/' + options.project_id + '/custom_events/' + options.event_id;
    return this.prepare().then(function(oc){
        return rest.delAsync(theUrl, {
            method: 'delete',
            headers: oc.baseHeaders
        });
    }).then(function(data){
        return {
            url: theUrl,
            statusCode: data.response.statusCode,
            rawHeaders: data.response.headers,
            meta: parseHttpHeaders(data.response.headers),
            payload: data.payload
        };
    });
  }
  
////////////////
//7. Attributes
////////////////
  
/**
 * @public
 * @name  OptimizelyClient#getAttributes
 * @description Retrieves a list of Attributes in a project from Optimizely
 * @param {object} options An object with the following properties:
 * {
 *   @param {string|number} id The Project ID
 * }
 * @return {promise} A promise fulfilled with an array of Attributes
 *
 */
OptimizelyClient.prototype.getAttributes = function(options){
    var theUrl = this.baseUrl + 'attributes?' + queryString.stringify(options);
    return this.prepare().then(function(oc){ 
        return rest.getAsync(theUrl, {
            method: 'get',
            headers: oc.baseHeaders
        });
    }).then(function(data){
        return {
            url: theUrl,
            statusCode: data.response.statusCode,
            rawHeaders: data.response.headers,
            meta: parseHttpHeaders(data.response.headers),
            payload: data.payload
        };
    });
  }
  
/**
 * @pubilc
 * @name OptimizelyClient#getAttribute
 * @description Read an Attribute in Optimizely
 * @param {object} options An object with the following properties:
 * {
 *   @param {string|number} id The Attribute ID
 * }
 * @returns {promise} A promise fulfilled with the Attribute
 * @note the id may be passed as a string instead of a member of an object
 */
OptimizelyClient.prototype.getAttribute = function(options) {
    if (typeof options === "string") options = {
      id: options
    };
    if (!options.id) throw new Error("Required: options.id");
    var theUrl = this.baseUrl + 'attributes/' + options.id;
    return this.prepare().then(function(oc){
        return rest.getAsync(theUrl, {
            method: 'get',
            headers: oc.baseHeaders
        });
    }).then(function(data){
        return {
            url: theUrl,
            statusCode: data.response.statusCode,
            rawHeaders: data.response.headers,
            meta: parseHttpHeaders(data.response.headers),
            payload: data.payload
        };
    });
  }
/**
 * @pubilc
 * @name OptimizelyClient#createAttribute
 * @description Create an Attribute in Optimizely
 * @param {object} attribute An object with the attribute description
 * @returns {promise} A promise fulfilled with the created attribute
 */
OptimizelyClient.prototype.createAttribute = function(attribute) {
    
    var postUrl = this.baseUrl + 'attributes';
    return this.prepare().then(function(oc){
        return rest.postAsync(postUrl, {
            method: 'post',
            headers: oc.baseHeaders,
            data: JSON.stringify(attribute)
        });
    }).then(function(data){
        return {
            url: postUrl,
            statusCode: data.response.statusCode,
            rawHeaders: data.response.headers,
            meta: parseHttpHeaders(data.response.headers),
            payload: data.payload
        };
    });
  }
  
/**
 * @public
 * @name  OptimizelyClient#updateAttribute
 * @since  0.4.0
 * @description  Update an Existing Attribute in Optimizely
 * @param {object} options An object with query parameters.
 * @param  {object} attribute object with the attribute data
 * @return {promise}  A promise fulfilled with the updated attribute
 */
OptimizelyClient.prototype.updateAttribute = function(options, attribute) {
    if(!options.id) throw new Error('required: options.id');
    var putUrl = this.baseUrl + 'attributes/' + options.id;
    return this.prepare().then(function(oc){
        return rest.putAsync(putUrl, {
            method: 'put',
            headers: oc.baseHeaders,
            data: JSON.stringify(attribute)
        });
    }).then(function(data){
        return {
            url: putUrl,
            statusCode: data.response.statusCode,
            rawHeaders: data.response.headers,
            meta: parseHttpHeaders(data.response.headers),
            payload: data.payload
        };
    });
  }
  
  /**
 *@pubilc
 *@name OptimizelyClient#deleteAttribute
 *@description Delete an Attribute by ID
 *@param {object} options An object with the following properties:
 *{
 *  @param id
 *}
 *@note the id may be passed as a string/number instead of a member of an object
 */
OptimizelyClient.prototype.deleteAttribute = function(options) {
    if (typeof options === "string" || typeof options === "number") options = {
      id: options
    };
    options = options || {};
    options.id = String(options.id || "");
    if (!options.id) throw new Error("required: options.id");
    var theUrl = this.baseUrl + 'attributes/' + options.id;
    return this.prepare().then(function(oc){
        return rest.delAsync(theUrl, {
            method: 'delete',
            headers: oc.baseHeaders
        });
    }).then(function(data){
        return {
            url: theUrl,
            statusCode: data.response.statusCode,
            rawHeaders: data.response.headers,
            meta: parseHttpHeaders(data.response.headers),
            payload: data.payload
        };
    });
  }
  
module.exports = OptimizelyClient;