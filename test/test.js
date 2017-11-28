var OptimizelyClient = require("../lib/OptimizelyClient");
var hat = require("hat")
var assert = require("assert");
var nock = require("nock");
var authCredentials = {
    "clientId":"76459304171",
    "clientSecret": "33nB8EY8NoSkQg9voK3LKk42Y1qCX776MMBfXAjdDU0",
    "accessToken":"2:mny3yrqk5Jm20FzVcwm2bmaFf2JSj0yx3USnEEoHMji5q4yArT7E",
    "refreshToken":"2:b1feae21497c4b01a632a40e64287d42",
    "tokenType":"bearer",
    "expiresIn":7300,
    "accessTokenTimestamp":Math.round(+new Date()/1000)
};
var stripPathEnd = function(path) {
  var index = path.lastIndexOf("/");
  return path.substr(index + 1);
}
var PROJECTID = hat();
var EXPERIMENTID = hat();
var VARIATIONID = hat();
var AUDIENCEID = hat();
var DIMENSIONID = hat();
var GOALSID = hat();
var PROJECTNAME = "PROJECTNAME";
var AUDIENCENAME = "AUDIENCENAME";
var DIMENSIONNAME = "DIMENSIONNAME";
var GOALSNAME = "GOALSNAME";
var EXPERIMENTDESCRIPTION = "DESCRIPTION OF EXPERIMENT";
var VARIATIONDESCRIPTION = "DESCRIPTION OF VARIATION";
var baseUrl = 'https://api.optimizely.com';
var EDITURL = 'https://www.google.com';
var FUNNELENVYERROR = "FunnelEnvy is not at fault. YOU did something bad.";
var FAILUREMESSAGE = "This should not be successful";
////////////////
//Mocs
////////////////
var scope = nock(baseUrl);
//Successful API Calls

////////////////
//Tests
////////////////
var client = new OptimizelyClient(authCredentials);

describe("Successful API Calls", function() {
  ////////////////
  //Project Tests
  ////////////////
  describe("Projects", function() {
      
    scope.post('/v2/projects') //create
      .reply(201, {
          'id' : 1523456,
          'account_id' : 54321,
          'name' : 'Some Optimizely Project',
          'is_classic' : true
      });
      
    it('should create a project', function(done) {
      var options = {
        'id' : 1523456,
        'account_id' : 54321,
        'name' : 'Some Optimizely Project',
        'is_classic' : true,
        'socket_token' : 'fwerw',            
        'web_snippet' : {
            "enable_force_variation" : false,
            "exclude_disabled_experiments" : false,
            "exclude_names" : true,
            "include_jquery" : true,
            "ip_anonymization" : false,
            "ip_filter" : "^206\\.23\\.100\\.([5-9][0-9]|1([0-4][0-9]|50))$",
            "library" : "jquery-1.11.3-trim",
            "project_javascript" : "alert(\"Active Experiment\")",
            "code_revision" : 123456,
            "js_file_size" : 5004
        }
      };
      
      client.createProject(options)
        .then(
          function(data) {
            var project = data.payload;
            assert.equal(project.id, 1523456);
            assert.equal(project.name, 'Some Optimizely Project');
            assert.equal(project.is_classic, true);
            assert.equal(project.account_id, "54321");
            done();
          },
          function(error) {
            done(error);
          }
        )
    });
    
    scope.get('/v2/projects/' + PROJECTID) //get
      .reply(200, {
          'id' : PROJECTID,
          'account_id' : 54321,
          'name' : 'Some Optimizely Project',
          'is_classic' : true
      });
      
    it('should retrieve a project', function(done) {
      var options = {
        "id": PROJECTID
      }
      client.getProject(options)
        .then(
          function(data) {
            assert.equal(data.payload.id, options.id);
            done();
          },
          function(error) {
            done(error);
          }
        )
    });
    
    scope.put('/v2/projects/' + PROJECTID) //update
      .reply(202, {
          'id' : PROJECTID,
          'account_id' : 54321,
          'name' : 'Some Optimizely Project 2',
          'is_classic' : true
      });
      
    it('should update a project', function(done){
      
      var newProjectName = 'Some Optimizely Project 2';
      
      var options = {
        'id': PROJECTID,
        'project_name': newProjectName
      }
      
      client.updateProject(options).then(function(data){
        assert.equal(data.payload.id, PROJECTID);
        assert.equal(data.payload.name, newProjectName);
        done();
      }, function (error){
        done(error);
      })
    });
    
    scope.get('/v2/projects') //get
      .query(function(actualFunction){return true;})
      .reply(200, [
        {
          'id' : PROJECTID,
          'account_id' : 54321,
          'name' : 'Some Optimizely Project',
          'is_classic' : true
        }
      ]);
      
    it('should return a list of projects', function(done){
      client.getProjects({page:0}).then(function(reply){
        assert.equal(reply.payload[0].id, PROJECTID);
        assert.equal(reply.payload[0].name, 'Some Optimizely Project');
        done();
      }, function (error){
        done(error);
      })
    })
  });
  //////////////////
  //Experiment Tests
  //////////////////
  describe("Experiments", function() {
    scope.post("/v2/experiments") //create
      .reply(201, {
          
      });
    it('should create an experiment', function(done) {
      var options = {
        "project_id": PROJECTID,
        "audience_ids" : [
            1234,
            1212,
            1432
        ],
        "campaign_id" : 2000
      }
      client.createExperiment(options)
        .then(
          function(data) {
            var experiment = data.payload;
            assert.equal(experiment.id, EXPERIMENTID);
            assert.equal(experiment.campaign_id, 2000);
            done();
          },
          function(error) {
            done(error);
          }
        )
    });
    scope.post('/projects/' + PROJECTID + "/experiments/") //create
      .reply(201, function(uri, requestBody) {
        requestBody = JSON.parse(requestBody);
        requestBody.id = EXPERIMENTID;
        return requestBody;
      });
    it('should create an experiment (with pushExperiment)', function(done) {
      var options = {
        "project_id": PROJECTID,
        "edit_url": EDITURL,
        "custom_css": "/*css comment*/",
        "custom_js": "//js comment"
      }
      client.pushExperiment(options)
        .then(
          function(experiment) {
            experiment = JSON.parse(experiment);
            assert.equal(experiment.id, EXPERIMENTID);
            assert.equal(experiment.edit_url, EDITURL);
            assert.equal(experiment.custom_css, "/*css comment*/");
            assert.equal(experiment.custom_js, "//js comment");
            done();
          },
          function(error) {
            done(error);
          }
        )
    });
    scope.get('/experiments/' + EXPERIMENTID) //get
      .reply(200, function(uri, requestBody) {
        return stripPathEnd(uri);
      });
    it('should retrieve an experiment', function(done) {
      var options = {
        "id": EXPERIMENTID
      }
      client.getExperiment(EXPERIMENTID)
        .then(
          function(id) {
            assert(id, options.id)
            done();
          },
          function(error) {
            done(error);
          }
        )
    });
    scope.put('/experiments/' + EXPERIMENTID) //update
      .reply(202, function(uri, requestBody) {
        requestBody.id = stripPathEnd(uri);
        return requestBody;
      });
    it('should update an experiment', function(done) {
      var options = {
        "id": EXPERIMENTID,
        "description": "New " + EXPERIMENTDESCRIPTION
      };
      client.updateExperiment(options)
        .then(
          function(experiment) {
            experiment = JSON.parse(experiment);
            assert.equal(experiment.description, options.description);
            done();
          },
          function(error) {
            done(error);
          }
        )
    });
    scope.put('/experiments/' + EXPERIMENTID) //update
      .reply(202, function(uri, requestBody) {
        requestBody.id = stripPathEnd(uri);
        return requestBody;
      });
    it('should update an experiment (with pushExperiment)', function(done) {
      var options = {
        "id": EXPERIMENTID,
        "description": "New " + EXPERIMENTDESCRIPTION
      };
      client.pushExperiment(options)
        .then(
          function(experiment) {
            experiment = JSON.parse(experiment);
            assert.equal(experiment.description, options.description);
            done();
          },
          function(error) {
            done(error);
          }
        )
    });
    scope.get('/projects/' + PROJECTID + '/experiments/') //get multiple
      .reply(200, function(uri, requestBody) {
        return [{
          "project_id": PROJECTID,
          "description": EXPERIMENTDESCRIPTION
        }];
      });
    it('should retrieve a list of experiments', function(done) {
      var options = {
        "project_id": PROJECTID
      }
      client.getExperiments(options)
        .then(
          function(experiments) {
            experiments = JSON.parse(experiments);
            assert.equal(experiments[0].project_id, options.project_id);
            done();
          },
          function(error) {
            done(error);
          }
        )
    });
    scope.get('/projects/' + PROJECTID + '/experiments/') //get by description
      .reply(200, function(uri, requestBody) {
        return [{
          "project_id": PROJECTID,
          "description": EXPERIMENTDESCRIPTION
        }];
      });
    it('should retrieve an experiment by description', function(done) {
      var options = {
        "project_id": PROJECTID,
        "description": EXPERIMENTDESCRIPTION
      };
      client.getExperimentByDescription(options)
        .then(
          function(experiment) {
            assert.equal(experiment.description,
              options.description);
            done();
          },
          function(error) {
            done(error);
          }
        )
    });
    scope.intercept('/experiments/' + EXPERIMENTID, 'DELETE') 
      .reply(204, function(uri, requestBody) {
        return requestBody;
      });
    it('should delete an experiment', function(done) {
      var options = {
        "project_id": PROJECTID,
        "id": EXPERIMENTID
      };
      client.deleteExperiment(options)
        .then(
          function(reply) {
            done();
          },
          function(error) {
            done(error);
          }
        )
    });
    scope.intercept('/experiments/' + EXPERIMENTID + '/results', 'GET') 
      .reply(200, function(uri, requestBody) {
        return requestBody;
      });
    it('should get results', function(done) {
      var options = {
        "id": EXPERIMENTID
      };
      client.getResults(options)
        .then(
          function(reply) {
            done();
          },
          function(error) {
            done(error);
          }
        )
    });
    scope.intercept('/experiments/' + EXPERIMENTID + '/stats', 'GET') 
      .reply(200, function(uri, requestBody) {
        return requestBody;
      });
    it('should get stats', function(done) {
      var options = {
        "id": EXPERIMENTID
      };
      client.getStats(options)
        .then(
          function(reply) {
            done();
          },
          function(error) {
            done(error);
          }
        )
    });
  });
  //////////////////
  //Variation Tests
  //////////////////
  describe("Variations", function() {
    scope.post('/experiments/' + EXPERIMENTID + '/variations/') //create
      .reply(201, function(uri, requestBody) {
        requestBody = JSON.parse(requestBody);
        requestBody.id = VARIATIONID;
        return requestBody;
      });
    it('should create a variation', function(done) {
      var options = {
        "experiment_id": EXPERIMENTID,
        "description": "Variation Description"
      }
      client.createVariation(options)
        .then(
          function(variation) {
            variation = JSON.parse(variation);
            assert.equal(variation.description,
              "Variation Description");
            done();
          },
          function(error) {
            done(error);
          }
        )
    });
    scope.post('/experiments/' + EXPERIMENTID + '/variations/') //create
      .reply(201, function(uri, requestBody) {
        requestBody = JSON.parse(requestBody);
        requestBody.id = VARIATIONID;
        return requestBody;
      });
    it('should create a variation (with pushVariation)', function(done) {
      var options = {
        "experiment_id": EXPERIMENTID,
        "description": "Variation Description"
      }
      client.pushVariation(options)
        .then(
          function(variation) {
            variation = JSON.parse(variation);
            assert.equal(variation.description,
              "Variation Description");
            done();
          },
          function(error) {
            done(error);
          }
        )
    });
    scope.get('/variations/' + VARIATIONID) //get
      .reply(200, function(uri, requestBody) {
        return stripPathEnd(uri);
      });
    it('should retrieve a variation', function(done) {
      client.getVariation(VARIATIONID)
        .then(
          function(id) {
            assert.equal(id, VARIATIONID);
            done();
          },
          function(error) {
            done(error);
          }
        )
    });
    scope.put('/variations/' + VARIATIONID) //update
      .reply(202, function(uri, requestBody) {
        requestBody = JSON.parse(requestBody);
        requestBody.id = VARIATIONID;
        return requestBody;
      });
    it('should update a variation', function(done) {
      var options = {
        "id": VARIATIONID,
        "description": "New " + "Variation Description"
      }
      client.updateVariation(options)
        .then(
          function(variation) {
            variation = JSON.parse(variation);
            assert.equal(variation.description,
              "New " + "Variation Description");
            done();
          },
          function(error) {
            done(error);
          }
        )
    });
    scope.put('/variations/' + VARIATIONID) //update
      .reply(202, function(uri, requestBody) {
        requestBody = JSON.parse(requestBody);
        requestBody.id = VARIATIONID;
        return requestBody;
      });
    it('should update a variation (with pushVariation)', function(done) {
      var options = {
        "id": VARIATIONID,
        "description": "New " + "Variation Description"
      };
      client.pushVariation(options)
        .then(
          function(variation) {
            variation = JSON.parse(variation);
            assert.equal(variation.description,
              "New " + "Variation Description");
            done();
          },
          function(error) {
            done(error);
          }
        )
    });
    scope.intercept('/variations/' + VARIATIONID, 'DELETE') 
      .reply(204, function(uri, requestBody) {
        return;
      });
    it('should delete a variation', function(done) {
      var options = {
        "id": VARIATIONID
      };
      client.deleteVariation(options)
        .then(
          function(reply) {
            done();
          },
          function(error) {
            done(error);
          }
        )
    });
  })
  //////////////////
  //Audience Tests
  //////////////////
  describe("Audiences", function() {
    /**
     * Set up the Audience Test Paths here
     */
    before(function(){
      scope.get('/audiences/' + AUDIENCEID) //get
        .reply(200, function(uri, requestBody) {
          return stripPathEnd(uri);
        });
      scope.post('/projects/' + PROJECTID + '/audiences/') //create
        .reply(201, function(uri, requestBody) {
          requestBody = JSON.parse(requestBody);
          requestBody.id = AUDIENCEID;
          return requestBody;
        });
      scope.put('/audiences/' + AUDIENCEID) //update
        .reply(202, function(uri, requestBody) {
          requestBody = JSON.parse(requestBody);
          requestBody.id = AUDIENCEID;
          return requestBody;
        });
      scope.get('/projects/' + PROJECTID + '/audiences/') //get 
        .reply(200, function(uri, requestBody) {
          return [ {
                    "id": AUDIENCEID,
                    "name": AUDIENCENAME
                  } ];
        });
    });
    /**
     * Describe the Audience functions here
     */
    it('should create an audience', function(done) {
      var options = {
        "id": PROJECTID,
        "name": AUDIENCENAME
      }
      client.createAudience(options)
        .then(
          function(audience) {
            audience = JSON.parse(audience);
            assert.equal(audience.name,
              AUDIENCENAME);
            done();
          },
          function(error) {
            done(error);
          }
        )
    });
    it('should get an audience', function(done) {
      var options = {
        "id": AUDIENCEID
      }
      client.getAudience(options)
        .then(
          function(id) {
            assert.equal(id, AUDIENCEID);
            done();
          },
          function(error) {
            done(error);
          }
        )
    });
    it('should update a audience', function(done) {
      var options = {
        "id": AUDIENCEID,
        "name": "New " + AUDIENCENAME
      }
      client.updateAudience(options)
        .then(
          function(audience) {
            audience = JSON.parse(audience);
            assert.equal(audience.name,
              "New " + AUDIENCENAME);
            done();
          },
          function(error) {
            done(error);
          }
        )
    });
    it('should return a list of audiences', function(done){
      var options = {
        "id": PROJECTID
      }
      client.getAudiences(options).then(function(reply){
        reply = JSON.parse(reply);
        assert.equal(reply[0].id, AUDIENCEID);
        assert.equal(reply[0].name, AUDIENCENAME);
        done();
      }, function (error){
        done(error);
      })
    });
  })
  //////////////////
  //Dimension Tests
  //////////////////
  describe("Dimensions", function() {
    /**
     * Set up the Audience Test Paths here
     */
    before(function(){
      scope.get('/dimensions/' + DIMENSIONID) //get
        .reply(200, function(uri, requestBody) {
          return stripPathEnd(uri);
        });
      scope.post('/projects/' + PROJECTID + '/dimensions/') //create
        .reply(201, function(uri, requestBody) {
          requestBody = JSON.parse(requestBody);
          requestBody.id = DIMENSIONID;
          return requestBody;
        });
      scope.put('/dimensions/' + DIMENSIONID) //update
        .reply(202, function(uri, requestBody) {
          requestBody = JSON.parse(requestBody);
          requestBody.id = DIMENSIONID;
          return requestBody;
        });
      scope.get('/projects/' + PROJECTID + '/dimensions/') //get 
        .reply(200, function(uri, requestBody) {
          return [ {
                    "id": DIMENSIONID,
                    "name": DIMENSIONNAME
                  } ];
        });
    });
    /**
     * Describe the Dimension functions here
     */
    it('should create a dimension', function(done) {
      var options = {
        "id": PROJECTID,
        "name": DIMENSIONNAME
      }
      client.createDimension(options)
        .then(
          function(dimension) {
            dimension = JSON.parse(dimension);
            assert.equal(dimension.name,
              DIMENSIONNAME);
            done();
          },
          function(error) {
            done(error);
          }
        )
    });
    it('should get a dimension', function(done) {
      var options = {
        "id": DIMENSIONID
      }
      client.getDimension(options)
        .then(
          function(id) {
            assert.equal(id, DIMENSIONID);
            done();
          },
          function(error) {
            done(error);
          }
        )
    });
    it('should update a dimension', function(done) {
      var options = {
        "id": DIMENSIONID,
        "name": "New " + DIMENSIONNAME
      }
      client.updateDimension(options)
        .then(
          function(dimension) {
            dimension = JSON.parse(dimension);
            assert.equal(dimension.name,
              "New " + DIMENSIONNAME);
            done();
          },
          function(error) {
            done(error);
          }
        )
    });
    it('should return a list of dimensions', function(done){
      var options = {
        "id": PROJECTID
      }
      client.getDimensions(options).then(function(reply){
        reply = JSON.parse(reply);
        assert.equal(reply[0].id, DIMENSIONID);
        assert.equal(reply[0].name, DIMENSIONNAME);
        done();
      }, function (error){
        done(error);
      })
    });
  })

  //////////////////
  //Goals Tests
  //////////////////
  describe("Goals", function() {
    /**
     * Set up the Goals Test Paths here
     */
    before(function(){
      scope.get('/projects/' + PROJECTID + '/goals/') //get 
        .reply(200, function(uri, requestBody) {
          return [ {
                    "id": GOALSID,
                    "name": GOALSNAME
                  } ];
        });

    });
    /**
     * Describe the Goals functions here
     */

    it('should return a list of goals', function(done){
      var options = {
        "id": PROJECTID
      }
      client.getGoals(options).then(function(reply){
        reply = JSON.parse(reply);
        assert.equal(reply[0].id, GOALSID);
        assert.equal(reply[0].name, GOALSNAME);
        done();
      }, function (error){
        done(error);
      })
    });
  })

})


////////////////////////
//Unsuccessful API Tests
////////////////////////
describe("Unsuccessful API Calls", function() {
  //////////////////
  //Project Tests
  //////////////////
  describe("Projects", function() {
    scope.post('/v2/projects') //create
      .reply(400, function(uri, requestBody) {
        return {
          status: 400,
          message: FUNNELENVYERROR,
          uuid: hat()
        };
      });
    it('should not create a project', function(done) {
      var options = {
        "description": "Description"
      }
      client.createProject(options)
        .then(
          function(variation) {
            done(FAILUREMESSAGE);
          },
          function(error) {
            assert.equal(error.message, FUNNELENVYERROR);
            done();
          }
        )
    });
    scope.get('/v2/projects/' + PROJECTID) //get
      .reply(400, function(uri, requestBody) {
        return {
          status: 400,
          message: FUNNELENVYERROR,
          uuid: hat()
        };
      });
    it('should not retrieve a project', function(done) {
      var options = {
        "id": PROJECTID
      }
      client.getProject(options)
        .then(
          function(data) {
            done(FAILUREMESSAGE);
          },
          function(error) {
            assert.equal(error.message, FUNNELENVYERROR);
            done();
          }
        )
    });
    scope.put('/v2/projects/' + PROJECTID) //update
      .reply(400, function(uri, requestBody) {
        requestBody.id = stripPathEnd(uri);
        return {
          status: 400,
          message: FUNNELENVYERROR,
          uuid: hat()
        };      
      });
    it('should not update a project', function(done){
      var newProjectName = PROJECTNAME + '2';
      var options = {
        'id': PROJECTID,
        'project_name': newProjectName
      }
      client.updateProject(options).then(function(reply){
        done(FAILUREMESSAGE);
      }, function (error){
        assert.equal(error.message, FUNNELENVYERROR);
        done();
      })
    });
    scope.get('/v2/projects') //get
      .query(function(actualQuery){return true})
      .reply(400, function(uri, requestBody) {
        return {
          status: 400,
          message: FUNNELENVYERROR,
          uuid: hat()
        };
      });
    it('should not return a list of projects', function(done){
      client.getProjects({page:0}).then(function(reply){
        done(FAILUREMESSAGE);
      }, function (error){
        assert.equal(error.message, FUNNELENVYERROR);
        done();
      });
    })
  });
  //////////////////
  //Experiment Tests
  //////////////////
  describe("Experiments", function() {
    scope.post('/v2/experiments') //create
      .reply(400, function(uri, requestBody) {
        return {
          status: 400,
          message: FUNNELENVYERROR,
          uuid: hat()
        };
      });
    it('should not create an experiment', function(done) {
      var options = {
        "project_id": PROJECTID,
        "edit_url": EDITURL,
        "custom_css": "/*css comment*/",
        "custom_js": "//js comment"
      }
      client.createExperiment(options)
        .then(
          function(variation) {
            done(FAILUREMESSAGE);
          },
          function(error) {
            error = JSON.parse(error);
            assert.equal(error.message, FUNNELENVYERROR);
            done();
          }
        )
    });
    scope.post('/projects/' + PROJECTID + "/experiments/") //create
      .reply(400, function(uri, requestBody) {
        return {
          status: 400,
          message: FUNNELENVYERROR,
          uuid: hat()
        };
      });
    it('should not create an experiment (with pushExperiment)', function(done) {
      var options = {
        "project_id": PROJECTID,
        "edit_url": EDITURL,
        "custom_css": "/*css comment*/",
        "custom_js": "//js comment"
      }
      client.pushExperiment(options)
        .then(
          function(variation) {
            done(FAILUREMESSAGE);
          },
          function(error) {
            error = JSON.parse(error);
            assert.equal(error.message, FUNNELENVYERROR);
            done();
          }
        )
    });
    scope.get('/experiments/' + EXPERIMENTID) //get
      .reply(400, function(uri, requestBody) {
        return {
          status: 400,
          message: FUNNELENVYERROR,
          uuid: hat()
        };
      });
    it('should not retrieve an experiment', function(done) {
      var options = {
        "id": EXPERIMENTID
      }
      client.getExperiment(EXPERIMENTID)
        .then(
          function(variation) {
            done(FAILUREMESSAGE);
          },
          function(error) {
            error = JSON.parse(error);
            assert.equal(error.message, FUNNELENVYERROR);
            done();
          }
        )
    });
    scope.put('/experiments/' + EXPERIMENTID) //update
      .reply(400, function(uri, requestBody) {
        requestBody.id = stripPathEnd(uri);
        return {
          status: 400,
          message: FUNNELENVYERROR,
          uuid: hat()
        };
      });
    it('should not update an experiment', function(done) {
      var options = {
        "id": EXPERIMENTID,
        "description": "New " + EXPERIMENTDESCRIPTION
      };
      client.updateExperiment(options)
        .then(
          function(variation) {
            done(FAILUREMESSAGE);
          },
          function(error) {
            error = JSON.parse(error);
            assert.equal(error.message, FUNNELENVYERROR);
            done();
          }
        )
    });
    scope.put('/experiments/' + EXPERIMENTID) //update
      .reply(400, function(uri, requestBody) {
        requestBody.id = stripPathEnd(uri);
        return {
          status: 400,
          message: FUNNELENVYERROR,
          uuid: hat()
        };
      });
    it('should not update an experiment (with pushExperiment)', function(done) {
      var options = {
        "id": EXPERIMENTID,
        "description": "New " + EXPERIMENTDESCRIPTION
      };
      client.pushExperiment(options)
        .then(
          function(variation) {
            done(FAILUREMESSAGE);
          },
          function(error) {
            error = JSON.parse(error);
            assert.equal(error.message, FUNNELENVYERROR);
            done();
          }
        )
    });
    scope.get('/projects/' + PROJECTID + '/experiments/') //get multiple
      .reply(400, function(uri, requestBody) {
        return {
          status: 400,
          message: FUNNELENVYERROR,
          uuid: hat()
        };
      });
    it('should not retrieve a list of experiments', function(done) {
      var options = {
        "project_id": PROJECTID
      }
      client.getExperiments(options)
        .then(
          function(variation) {
            done(FAILUREMESSAGE);
          },
          function(error) {
            error = JSON.parse(error);
            assert.equal(error.message, FUNNELENVYERROR);
            done();
          }
        )
    });
    scope.get('/projects/' + PROJECTID + '/experiments/') //get by description
      .reply(400, function(uri, requestBody) {
        return {
          status: 400,
          message: FUNNELENVYERROR,
          uuid: hat()
        };
      });
    it('should not retrieve an experiment by description', function(
      done) {
      var options = {
        "project_id": PROJECTID,
        "description": EXPERIMENTDESCRIPTION
      };
      client.getExperimentByDescription(options)
        .then(
          function(variation) {
            done(FAILUREMESSAGE);
          },
          function(error) {
            error = JSON.parse(error);
            assert.equal(error.message, FUNNELENVYERROR);
            done();
          }
        )
    });
    scope.intercept('/experiments/' + EXPERIMENTID, 'DELETE') 
      .reply(400, function(uri, requestBody) {
        return {
          status: 400,
          message: FUNNELENVYERROR,
          uuid: hat()
        };
      });
    it('should not delete an experiment', function(done) {
      var options = {
        "id": EXPERIMENTID
      };
      client.deleteExperiment(options)
        .then(
          function(reply) {
            done(error);
          },
          function(error) {
            error = JSON.parse(error);
            assert.equal(error.message, FUNNELENVYERROR);
            done();
          }
        )
    });
    scope.intercept('/experiments/' + EXPERIMENTID, 'DELETE') 
      .reply(400, function(uri, requestBody) {
        return {
          status: 400,
          message: FUNNELENVYERROR,
          uuid: hat()
        };
      });
  })
  //////////////////
  //Variation Tests
  //////////////////
  describe("Variations", function() {
    scope.post('/experiments/' + EXPERIMENTID + '/variations/') //create
      .reply(400, function(uri, requestBody) {
        return {
          status: 400,
          message: FUNNELENVYERROR,
          uuid: hat()
        };
      });
    it('should not create a variation', function(done) {
      var options = {
        "experiment_id": EXPERIMENTID,
        "description": "Variation Description"
      }
      client.createVariation(options)
        .then(
          function(variation) {
            done(FAILUREMESSAGE);
          },
          function(error) {
            error = JSON.parse(error);
            assert.equal(error.message, FUNNELENVYERROR);
            done();
          }
        )
    });
    scope.post('/experiments/' + EXPERIMENTID + '/variations/') //create
      .reply(400, function(uri, requestBody) {
        return {
          status: 400,
          message: FUNNELENVYERROR,
          uuid: hat()
        };
      });
    it('should not create a variation (with pushVariation)', function(done) {
      var options = {
        "experiment_id": EXPERIMENTID,
        "description": "Variation Description"
      }
      client.pushVariation(options)
        .then(
          function(variation) {
            done(FAILUREMESSAGE);
          },
          function(error) {
            error = JSON.parse(error);
            assert.equal(error.message, FUNNELENVYERROR);
            done();
          }
        )
    });
    scope.get('/variations/' + VARIATIONID) //get
      .reply(400, function(uri, requestBody) {
        return {
          status: 400,
          message: FUNNELENVYERROR,
          uuid: hat()
        };
      });
    it('should not retrieve a variation', function(done) {
      client.getVariation(VARIATIONID)
        .then(
          function(variation) {
            done(FAILUREMESSAGE);
          },
          function(error) {
            error = JSON.parse(error);
            assert.equal(error.message, FUNNELENVYERROR);
            done();
          }
        )
    });
    scope.put('/variations/' + VARIATIONID) //update
      .reply(400, function(uri, requestBody) {
        return {
          status: 400,
          message: FUNNELENVYERROR,
          uuid: hat()
        };
      })
    it('should not update a variation', function(done) {
      var options = {
        "id": VARIATIONID,
        "description": "New " + "Variation Description"
      }
      client.updateVariation(options)
        .then(
          function(variation) {
            done(FAILUREMESSAGE);
          },
          function(error) {
            error = JSON.parse(error);
            assert.equal(error.message, FUNNELENVYERROR);
            done();
          }
        )
    });
    scope.put('/variations/' + VARIATIONID) //update
      .reply(400, function(uri, requestBody) {
        return {
          status: 400,
          message: FUNNELENVYERROR,
          uuid: hat()
        };
      })
    it('should not update a variation (with pushVariation)', function(done) {
      var options = {
        "id": VARIATIONID,
        "description": "New " + "Variation Description"
      }
      client.pushVariation(options)
        .then(
          function(variation) {
            done(FAILUREMESSAGE);
          },
          function(error) {
            error = JSON.parse(error);
            assert.equal(error.message, FUNNELENVYERROR);
            done();
          }
        )
    });
    scope.intercept('/variations/' + VARIATIONID, 'DELETE') 
      .reply(400, function(uri, requestBody) {
        return {
          status: 400,
          message: FUNNELENVYERROR,
          uuid: hat()
        };
      });
    it('should not delete a variation', function(done) {
      var options = {
        "id": VARIATIONID
      };
      client.deleteVariation(options)
        .then(
          function(reply) {
            done(error);
          },
          function(error) {
            error = JSON.parse(error);
            assert.equal(error.message, FUNNELENVYERROR);
            done();
          }
        )
        
    });
  })
})
