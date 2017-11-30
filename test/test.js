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
var CAMPAIGNID = hat();
var PAGEID = hat();
var EVENTID = hat();
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
      .query(function(actualQuery){return true;})
      .reply(201, {
        "id": EXPERIMENTID,
        "project_id": PROJECTID,
        "audience_ids" : [
            1234,
            1212,
            1432
        ],
        "campaign_id" : 2000
      });
      
    it('should create an experiment', function(done) {
      
      var options = {
          'action' : 'publish'
      };
      
      var experiment = {
        "project_id": PROJECTID,
        "audience_ids" : [
            1234,
            1212,
            1432
        ],
        "campaign_id" : 2000
      }
      client.createExperiment(options, experiment)
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
        
    scope.get('/v2/experiments/' + EXPERIMENTID) //get
      .reply(200, {
        "id": EXPERIMENTID,
        "project_id": PROJECTID,
        "audience_ids" : [
            1234,
            1212,
            1432
        ],
        "campaign_id" : 2000
      });
      
    it('should retrieve an experiment', function(done) {
      var options = {
        "id": EXPERIMENTID
      }
      client.getExperiment(EXPERIMENTID)
        .then(
          function(data) {
            var experiment = data.payload;
            assert(experiment.id, EXPERIMENTID)
            done();
          },
          function(error) {
            done(error);
          }
        )
    });
    
    
    scope.put('/v2/experiments/' + EXPERIMENTID) //update
      .query(function(actualQuery){return true;})
      .reply(202, {
        "id": EXPERIMENTID,
        "project_id": PROJECTID,
        "audience_ids" : [
            1234,
            1212,
            1432
        ],
        "campaign_id" : 2000,
        "description": "New " + EXPERIMENTDESCRIPTION
      });
      
    it('should update an experiment', function(done) {
      var options = {
        "id": EXPERIMENTID,
        "action": "publish"
      };
      
      var experiment = {
        "description": "New " + EXPERIMENTDESCRIPTION
      };
      
      client.updateExperiment(options, experiment)
        .then(
          function(data) {
            var updatedExperiment = data.payload;
            assert.equal(updatedExperiment.description, experiment.description);
            done();
          },
          function(error) {
            done(error);
          }
        )
    });
    
    scope.get('/v2/experiments') //get multiple
      .query(function(actualQuery){return true;})
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
          function(data) {
            var experiments = data.payload;
            assert.equal(experiments[0].project_id, options.project_id);
            done();
          },
          function(error) {
            done(error);
          }
        )
    });
    
    scope.intercept('/v2/experiments/' + EXPERIMENTID, 'DELETE') 
      .reply(204, function(uri, requestBody) {
        return requestBody;
      });
      
    it('should delete an experiment', function(done) {
      var options = {
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
    
    scope.intercept('/v2/experiments/' + EXPERIMENTID + '/results', 'GET') 
      .query(function(actualQuery){return true;})
      .reply(200, function(uri, requestBody) {
        return requestBody;
      });
    it('should get experiment results', function(done) {
      var options = {
        "id": EXPERIMENTID
      };
      client.getExperimentResults(options)
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
  //Audience Tests
  //////////////////
  describe("Audiences", function() {
    
    scope.post('/v2/audiences') //create
        .reply(201, {
            "id": PROJECTID,
            "name": AUDIENCENAME
        });
    
    it('should create an audience', function(done) {
      var options = {
        "id": PROJECTID,
        "name": AUDIENCENAME
      }
      client.createAudience(options)
        .then(
          function(data) {
            assert.equal(data.payload.name, AUDIENCENAME);
            done();
          },
          function(error) {
            done(error);
          }
        )
    });
    
    scope.get('/v2/audiences/' + AUDIENCEID) //get
        .reply(200, {
            "project_id" : 1000,
            "archived" : false,
            "description" : "People that speak spanish and are in San Francisco",
            "name" : "Spanish speaking San Franciscans",
            "segmentation" : true,
            "created" : "2016-10-18T05:07:04.073Z",
            "id" : AUDIENCEID
        });
      
    it('should get an audience', function(done) {
      var options = {
        "id": AUDIENCEID
      }
      client.getAudience(options)
        .then(
          function(data) {
            assert.equal(data.payload.id, AUDIENCEID);
            done();
          },
          function(error) {
            done(error);
          }
        )
    });
    
    scope.put('/v2/audiences/' + AUDIENCEID) //update
        .reply(202, {
            "project_id" : 1000,
            "archived" : false,
            "description" : "New description",
            "name" : "Spanish speaking San Franciscans",
            "segmentation" : true,
            "created" : "2016-10-18T05:07:04.073Z",
            "id" : AUDIENCEID
        });
        
    it('should update a audience', function(done) {
      var options = {
        "id": AUDIENCEID,
        "description": "New description"
      }
      
      client.updateAudience(options)
        .then(
          function(data) {
            assert.equal(data.payload.description, "New description");
            done();
          },
          function(error) {
            done(error);
          }
        )
    });
    
    scope.get('/v2/audiences') //get 
        .query(function(actualQuery){return true;})
        .reply(200, function(uri, requestBody) {
          return [ {
                    "id": AUDIENCEID,
                    "name": AUDIENCENAME
                  } ];
        });
        
    it('should return a list of audiences', function(done){
      var options = {
        "id": PROJECTID
      }
      client.getAudiences(options).then(function(data){
        assert.equal(data.payload[0].id, AUDIENCEID);
        assert.equal(data.payload[0].name, AUDIENCENAME);
        done();
      }, function (error){
        done(error);
      })
    });
  })
  
  //////////////////
  //Campaign Tests
  //////////////////
  describe("Campaigns", function() {
    
    scope.post('/v2/campaigns') //create
        .query(function(actualQuery){return true;})
        .reply(201, {
            "project_id" : PROJECTID,
            "name" : "Landing Page Optimization",
            "page_ids" : [
              0
            ],
            "status" : "active",
            "type" : "a/b",
            "id" : CAMPAIGNID
        });
    
    it('should create a campaign', function(done) {
      var options = {
        "action": "publish"
      }
      var campaign = {
           "project_id" : PROJECTID,
            "name" : "Landing Page Optimization",
            "page_ids" : [
              0
            ],
            "type" : "a/b"
      };
      
      client.createCampaign(options, campaign)
        .then(
          function(data) {
            assert.equal(data.payload.name, "Landing Page Optimization");
            done();
          },
          function(error) {
            done(error);
          }
        )
    });
    
    scope.get('/v2/campaigns/' + CAMPAIGNID) //get
        .reply(200, {
            "project_id" : PROJECTID,
            "name" : "Landing Page Optimization",
            "page_ids" : [
              0
            ],
            "status" : "active",
            "type" : "a/b",
            "id" : CAMPAIGNID
        });
      
    it('should get a campaign', function(done) {
      var options = {
        "id": CAMPAIGNID
      }
      client.getCampaign(options)
        .then(
          function(data) {
            assert.equal(data.payload.id, CAMPAIGNID);
            done();
          },
          function(error) {
            done(error);
          }
        )
    });
    
    scope.put('/v2/campaigns/' + CAMPAIGNID) //update
        .query(function(actualQuery){return true;})
        .reply(202, {
            "project_id" : PROJECTID,
            "name" : "New name",
            "page_ids" : [
              0
            ],
            "status" : "active",
            "type" : "a/b",
            "id" : CAMPAIGNID
        });
        
    it('should update a campaign', function(done) {
      var options = {
        "campaign_id": CAMPAIGNID,
        "action" : "publish"
      }
      
      var campaign = {
          "name":"New name"
      };
      
      client.updateCampaign(options, campaign)
        .then(
          function(data) {
            assert.equal(data.payload.name, "New name");
            done();
          },
          function(error) {
            done(error);
          }
        )
    });
    
    scope.get('/v2/campaigns') //get 
        .query(function(actualQuery){return true;})
        .reply(200, function(uri, requestBody) {
          return [ {
                    "id": CAMPAIGNID,
                    "name": "Landing Page Optimization"
                  } ];
        });
        
    it('should return a list of campaigns', function(done){
      var options = {
        "id": PROJECTID
      }
      client.getCampaigns(options).then(function(data){
        assert.equal(data.payload[0].id, CAMPAIGNID);
        assert.equal(data.payload[0].name, "Landing Page Optimization");
        done();
      }, function (error){
        done(error);
      })
    });
    
    scope.intercept('/v2/campaigns/' + CAMPAIGNID, 'DELETE') 
      .reply(204, function(uri, requestBody) {
        return requestBody;
      });
      
    it('should delete a campaign', function(done) {
      var options = {
        "id": CAMPAIGNID
      };
      client.deleteCampaign(options)
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
  //Event Tests
  //////////////////
  describe("Events", function() {
    
    scope.post('/v2/pages/'+PAGEID+'/events') //create
        .query(function(actualQuery){return true;})
        .reply(201, {
            "archived" : true,
            "category" : "add_to_cart",
            "description" : "Item added to cart",
            "event_type" : "custom",
            "name" : "Add to Cart",
            "page_id" : PAGEID,
            "project_id" : PROJECTID,
            "id" : EVENTID,
            "is_classic" : false,
            "is_editable" : true
        });
    
    it('should create an in-page event', function(done) {
      var event = {
           "archived" : true,
            "category" : "add_to_cart",
            "description" : "Item added to cart",
            "event_type" : "custom",
            "name" : "Add to Cart",
            "page_id" : PAGEID,
            "project_id" : PROJECTID,
            "is_classic" : false,
            "is_editable" : true
      };
      
      client.createInPageEvent(event)
        .then(
          function(data) {
            assert.equal(data.payload.name, "Add to Cart");
            done();
          },
          function(error) {
            done(error);
          }
        )
    });
    
    scope.post('/v2/projects/'+PROJECTID+'/custom_events') //create
        .query(function(actualQuery){return true;})
        .reply(201, {
            "archived" : true,
            "category" : "add_to_cart",
            "description" : "Item added to cart",
            "event_type" : "custom",
            "name" : "Add to Cart",
            "project_id" : PROJECTID,
            "id" : EVENTID,
            "is_classic" : false,
            "is_editable" : true
        });
    
    it('should create a custom event', function(done) {
      var event = {
            "archived" : true,
            "category" : "add_to_cart",
            "description" : "Item added to cart",
            "event_type" : "custom",
            "name" : "Add to Cart",
            "project_id" : PROJECTID,
            "is_classic" : false,
            "is_editable" : true
      };
      
      client.createCustomEvent(event)
        .then(
          function(data) {
            assert.equal(data.payload.name, "Add to Cart");
            done();
          },
          function(error) {
            done(error);
          }
        )
    });
    
    scope.get('/v2/events/' + EVENTID) //get
        .reply(200, {
            "archived" : true,
            "category" : "add_to_cart",
            "description" : "Item added to cart",
            "event_type" : "custom",
            "name" : "Add to Cart",
            "project_id" : PROJECTID,
            "is_classic" : false,
            "is_editable" : true
        });
      
    it('should get an event', function(done) {
      var options = {
        "id": EVENTID
      }
      client.getEvent(options)
        .then(
          function(data) {
            assert.equal(data.payload.id, EVENTID);
            done();
          },
          function(error) {
            done(error);
          }
        )
    });
    
    scope.put('/v2/campaigns/' + CAMPAIGNID) //update
        .query(function(actualQuery){return true;})
        .reply(202, {
            "project_id" : PROJECTID,
            "name" : "New name",
            "page_ids" : [
              0
            ],
            "status" : "active",
            "type" : "a/b",
            "id" : CAMPAIGNID
        });
        
    it('should update a campaign', function(done) {
      var options = {
        "campaign_id": CAMPAIGNID,
        "action" : "publish"
      }
      
      var campaign = {
          "name":"New name"
      };
      
      client.updateCampaign(options, campaign)
        .then(
          function(data) {
            assert.equal(data.payload.name, "New name");
            done();
          },
          function(error) {
            done(error);
          }
        )
    });
    
    scope.get('/v2/campaigns') //get 
        .query(function(actualQuery){return true;})
        .reply(200, function(uri, requestBody) {
          return [ {
                    "id": CAMPAIGNID,
                    "name": "Landing Page Optimization"
                  } ];
        });
        
    it('should return a list of campaigns', function(done){
      var options = {
        "id": PROJECTID
      }
      client.getCampaigns(options).then(function(data){
        assert.equal(data.payload[0].id, CAMPAIGNID);
        assert.equal(data.payload[0].name, "Landing Page Optimization");
        done();
      }, function (error){
        done(error);
      })
    });
    
    scope.intercept('/v2/campaigns/' + CAMPAIGNID, 'DELETE') 
      .reply(204, function(uri, requestBody) {
        return requestBody;
      });
      
    it('should delete a campaign', function(done) {
      var options = {
        "id": CAMPAIGNID
      };
      client.deleteCampaign(options)
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
      .query(function(actualQuery){return true;})
      .reply(400, function(uri, requestBody) {
        return {
          status: 400,
          message: FUNNELENVYERROR,
          uuid: hat()
        };
      });
      
    it('should not create an experiment', function(done) {
      var options = {'action':'publish'};
      var experiment = {
        "project_id": PROJECTID,
        "edit_url": EDITURL,
        "custom_css": "/css comment/",
        "custom_js": "//js comment"
      }
    
    client.createExperiment(options, experiment)
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
    
    scope.get('/v2/experiments/' + EXPERIMENTID) //get
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
            assert.equal(error.message, FUNNELENVYERROR);
            done();
          }
        )
    });
    
    scope.put('/v2/experiments/' + EXPERIMENTID) //update
      .query(function(actualQuery){return true;})
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
            assert.equal(error.message, FUNNELENVYERROR);
            done();
          }
        )
    });
    
    scope.get('/v2/experiments') //get multiple
      .query(function(actualQuery){return true;})
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
            assert.equal(error.message, FUNNELENVYERROR);
            done();
          }
        )
    });
    
    scope.intercept('/v2/experiments/' + EXPERIMENTID, 'DELETE') 
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
  
  
});
