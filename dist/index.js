/* yocto-mongoose - Utility tool to manage mongoose connection and auto loading models. - V2.2.0 */

"use strict";var logger=require("yocto-logger"),mongoose=require("mongoose"),_=require("lodash"),path=require("path"),fs=require("fs"),glob=require("glob"),joi=require("joi"),async=require("async"),Schema=mongoose.Schema,Q=require("q"),elastic=require("mongoosastic"),utils=require("yocto-utils"),elasticClient=require("elasticsearch"),modCrud=require("./modules/crud"),modValidator=require("./modules/validator"),modMethod=require("./modules/method"),modEnums=require("./modules/enum"),modElastic=require("./modules/utils/elastic"),modRedis=require("./modules/utils/redis"),modCrypt=require("./modules/crypto"),modTypes=require("./modules/types");function YMongoose(e){this.logger=e,this.mongoose=mongoose,this.paths={model:"",validator:"",method:"",enums:""},this.crud=!1,this.loaded=!1,this.modules={crud:modCrud(e),validator:modValidator(e),method:modMethod(e),enums:modEnums(e,mongoose.Types),elastic:modElastic(e),redis:modRedis(e),crypt:modCrypt(e,mongoose.Types),modTypes:modTypes(e,mongoose)}}mongoose.Promise=require("q").Promise,YMongoose.prototype.isConnected=function(){return this.mongoose.connection.readyState===this.mongoose.Connection.STATES.connected},YMongoose.prototype.isDisconnected=function(){return this.mongoose.connection.readyState===this.mongoose.Connection.STATES.disconnected},YMongoose.prototype.connect=function(e,o){var t=Q.defer();return this.logger.info(["[ YMongoose.connect ] -","Try to connect on [",e,"]"].join(" ")),this.mongoose.connection.on("open",function(){this.logger.info(["[ YMongoose.connect ] - Connection succeed on",e].join(" ")),t.resolve()}.bind(this)),this.mongoose.connection.on("error",function(e){this.logger.error(["[ YMongoose.connect ] - Connection failed.","Error is :",e.message].join(" ")),t.reject(e)}.bind(this)),_.each(["connecting","connected","disconnecting","disconnected"],function(e){this.mongoose.connection.on(e,function(){this.logger.debug(["[ YMongoose.connect ] - Mongoose is :",_.capitalize(e)].join(" "))}.bind(this))}.bind(this)),_.isString(e)&&!_.isEmpty(e)?(o=_.isObject(o)&&!_.isEmpty(o)?o:{},_.has(o,"server.sslCA")&&_.isString(o.server.sslCA)&&(o.server.sslCA=[fs.readFileSync(path.normalize(process.cwd()+"/"+o.server.sslCA))]),_.has(o,"server.sslKey")&&_.isString(o.server.sslKey)&&(o.server.sslKey=[fs.readFileSync(path.normalize(process.cwd()+"/"+o.server.sslKey))]),_.has(o,"server.sslCert")&&_.isString(o.server.sslCert)&&(o.server.sslCert=[fs.readFileSync(path.normalize(process.cwd()+"/"+o.server.sslCert))]),this.isDisconnected()&&this.mongoose.connect(e,o)):(this.logger.error("[ YMongoose.connect ] - Invalid url, cannot connect."),t.reject()),t.promise},YMongoose.prototype.disconnect=function(){var o=Q.defer();return this.logger.info("[ YMongoose.disconnect ] - Try to disconnect all connections"),this.isConnected()?this.mongoose.disconnect(function(e){e?(this.logger.error(["[ YMongoose.disconnect ] - Disconnect failed.","Error is :",e.message].join(" ")),o.reject(e)):(this.modules.redis.disconnect(),this.mongoose.connection.close(function(e){e?(this.logger.error(["[ YMongoose.disconnect ] - Connection close failed.","Error is :",e.message].join(" ")),o.reject(e)):(this.logger.info("[ YMongoose.disconnect ] - Closing connection succeed."),o.resolve())}.bind(this)))}.bind(this)):(this.logger.warning("[ YMongoose.disconnect ] - Cannot disconnect orm is not connected."),o.reject()),o.promise},YMongoose.prototype.enableElasticsearch=function(e,o){e=_.isArray(e)?e:[e||{host:"127.0.0.1",port:9200,protocol:"http"}];var t=joi.array().required().items(joi.object().keys({host:joi.string().required().empty().default("127.0.0.1"),port:joi.number().required().default(9200),protocol:joi.string().optional().valid(["http","https"]).default("http"),auth:joi.string().optional().empty()}).default({host:"127.0.0.1",port:9200,protocol:"http"})).default([{host:"127.0.0.1",port:9200,protocol:"http"}]),s=joi.validate(e,t);return s.error?(this.logger.warning(["[ YMongoose.elasticHosts ] - Invalid host config given :",s.error].join(" ")),!1):this.modules.elastic.enableHosts(s.value,o)},YMongoose.prototype.enableRedis=function(e,o,t,s){return this.modules.redis.connect(e,o,s,t)},YMongoose.prototype.getRedis=function(){return this.modules.redis},YMongoose.prototype.models=function(e){return this.logger.debug("[ YMongoose.models ] - Try to set model defintion path."),this.setPath(e,"model")},YMongoose.prototype.validators=function(e){return this.logger.debug("[ YMongoose.validators ] - Try to set validator defintion path."),this.setPath(e,"validator")},YMongoose.prototype.methods=function(e){return this.logger.debug("[ YMongoose.methods ] - Try to set methods defintion path."),this.setPath(e,"method")},YMongoose.prototype.enums=function(e){return this.logger.debug("[ YMongoose.enums ] - Try to set enums defintion path."),this.setPath(e,"enums")},YMongoose.prototype.setPath=function(e,o){var t=_.find({model:{ext:"json",name:"model"},validator:{ext:"js",name:"validator"},method:{ext:"js",name:"method"},enums:{ext:"json",name:"enums"}},["name",o]);if(!_.isUndefined(t)&&_.isObject(t)&&_.isString(e)&&!_.isEmpty(e)){e=path.isAbsolute(e)?e:path.normalize([process.cwd(),e].join("/"));try{if(fs.accessSync(e,fs.R_OK),!fs.statSync(e).isDirectory())throw[e,"is not a valid directory."].join(" ");var s=glob.sync(["**/*.",t.ext].join(""),{cwd:e});0===_.size(s)&&this.logger.warning(["[ YMongoose.setPath ] - Given directory path for",[t.name,"enums"!==t.name?"s":""].join(""),"seems to be empty.","Don't forget to ad your",t.ext,"file before load call"].join(" ")),this.paths[t.name]=e,this.logger.debug(["[ YMongoose.setPath ] -",_.capitalize([t.name,"enums"!==t.name?"s":""].join("")),"path was set to :",this.paths[t.name]].join(" "))}catch(e){return this.logger.error(["[ YMongoose.setPath ] - Set path for",[t.name,"enums"!==t.name?"s":""].join(""),"failed.",e].join(" ")),this.disconnect(),!1}return!0}return this.logger.error(["[ YMongoose.setPath ] - Cannot set directory for [",o,"]","Invalid directory given or cannot retreive types rules"].join(" ")),!1},YMongoose.prototype.isLoaded=function(){return this.loaded},YMongoose.prototype.isReady=function(e){return e&&(this.isConnected()||this.logger.error("[ YMongoose.isReady ] - Connection is not ready."),_.isEmpty(this.paths.model)&&this.logger.error("[ YMongoose.isReady ] - Model definition path is not set."),_.isEmpty(this.paths.validator)&&this.logger.error("[ YMongoose.isReady ] - Validator definition path is not set."),_.isEmpty(this.paths.method)&&this.logger.error("[ YMongoose.isReady ] - Methods definition path is not set."),_.isEmpty(this.paths.enums)&&this.logger.warning("[ YMongoose.isReady ] - Enum definition path is not set.")),this.isConnected()&&!_.isEmpty(this.paths.model)&&!_.isEmpty(this.paths.validator)&&!_.isEmpty(this.paths.method)},YMongoose.prototype.addModel=function(e){var t=Q.defer();if(this.isReady(!0)){_.isObject(e)&&!_.isEmpty(e)&&_.has(e,"model")&&_.has(e.model,"properties")&&_.has(e.model,"name")||(this.logger.error("[ YMongoose.addModel ] - Cannot create model. Invalid data given"),t.reject()),this.logger.debug(["[ YMongoose.addModel ] - Creating model [",e.model.name,"]"].join(" "));var o=!1;if(_.has(e.model,"elastic")&&_.isObject(e.model.elastic)&&this.modules.elastic.configIsReady()&&_.isBoolean(e.model.elastic.enable)&&e.model.elastic.enable){this.logger.debug(["[ YMongoose.addModel ] - Elastic mode is enabled for this model.","Adding default index on all properties to false"].join(" "));var s=this.modules.elastic.addDefaultIndexes(_.cloneDeep(e.model.properties));_.merge(s,e.model.properties),o=!0}this.modules.crypt.setAlgorithmAndKey(e.model.crypto);var i=new Schema(e.model.properties);if(i=this.modules.crypt.setupHook(i,e.model.properties,e.model.name),_.has(e.model,"compound")&&_.isArray(e.model.compound)&&!_.isEmpty(e.model.compound)&&(this.logger.debug("[ YMongoose.addModel ] - Compound is defined try to add indexes"),_.each(e.model.compound,function(e){this.logger.debug(["[ YMongoose.addModel ] - Try to add compound indexes with :",utils.obj.inspect(e)].join(" ")),i.index(e)}.bind(this))),i.static("crypto",function(){return this.modules.crypt.saveModelProperties(e.model.properties)}.bind(this)),o){this.logger.debug(["[ YMongoose.addModel ] - Elastic mode is enabled for this model.","Adding mongoosastic plugin to current schema"].join(" "));var n=new elasticClient.Client(_.merge(_.merge({hosts:this.modules.elastic.getHosts()},_.omit(e.model.elastic.options,["hosts","host","port","protocol","auth"])),this.modules.elastic.getOptions()));i.plugin(elastic,{esClient:n})}if(i.elastic=o,_.has(e.model,"crud")&&_.has(e.model.crud,"enable")&&_.isObject(e.model.crud)&&e.model.crud.enable){this.logger.debug(["[ YMongoose.addModel ] - Crud mode is enabled.","Try to add default methods"].join(" "));var r=!1;e.model.crud.redis&&e.model.crud.redis.include&&(r={value:e.model.crud.redis.include,expire:e.model.crud.redis.expire});var d=this.createCrud(i,e.model.crud.exclude,r);d&&(this.logger.debug(["[ YMongoose.addModel ] - Adding Crud method success"].join(" ")),i=d)}if(!_.isUndefined(e.model.validator)&&!_.isNull(e.model.validator)&&_.isString(e.model.validator)&&!_.isEmpty(e.model.validator)){this.logger.debug(["[ YMongoose.addModel ] - A validator is defined.","Try to add a validate method."].join(" "));var a=this.createValidator(i,e.model.validator,e.model.name.toLowerCase());a&&(this.logger.debug(["[ YMongoose.addModel ] - Adding validate method success"].join(" ")),i=a)}if(!_.isUndefined(e.model.fn)&&!_.isNull(e.model.fn)&&_.isArray(e.model.fn)&&!_.isEmpty(e.model.fn)){this.logger.debug(["[ YMongoose.addModel ] - External methods are defined.","Try to add them."].join(" "));var l=this.createMethod(i,e.model.fn,e.model.name.toLowerCase());l&&(this.logger.debug(["[ YMongoose.addModel ] - Adding external methods success"].join(" ")),i=l)}_.isEmpty(this.paths.enums)||(this.modules.enums.load(this.paths.enums)?this.logger.debug("[ YMongoose.addModel ] - loading enums value success"):this.logger.warning("[ YMongoose.addModel ] - loading enums value failed")),i.static("enums",function(){return this.modules.enums}.bind(this));var c=this.mongoose.model(e.model.name,i);o?(this.logger.debug(["[ YMongoose.addModel ] - Elastic mode is enabled for this model.","Create mapping to current model"].join(" ")),c.createMapping(function(e,o){e?this.logger.error(["[ YMongoose.addModel ] - Elastic create mapping error :",e].join(" ")):this.logger.debug(["[ YMongoose.addModel ] - Elastic create mapping success :",utils.obj.inspect(o)].join(" ")),e?t.reject():t.resolve()}.bind(this))):t.resolve()}else t.reject();return t.promise},YMongoose.prototype.createCrud=function(e,o,t){return!!this.isReady(!0)&&(e instanceof Schema?this.modules.crud.add(e,o,t,this.modules.redis):(this.logger.warning([" [ YMongoose.createCrud ] - Cannot process."," given schema is not an instanceof Schema"].join(" ")),!1))},YMongoose.prototype.createValidator=function(e,o,t){return!!this.isReady(!0)&&(e instanceof Schema?this.modules.validator.add(e,this.paths.validator,o,t):(this.logger.warning([" [ YMongoose.createValidator ] - Cannot process."," given schema is not an instanceof Schema"].join(" ")),!1))},YMongoose.prototype.createMethod=function(e,o,t){return!!this.isReady(!0)&&(e instanceof Schema?this.modules.method.add(e,this.paths.method,o,t,this.modules.redis):(this.logger.warning([" [ YMongoose.createMethod ] - Cannot process."," given schema is not an instanceof Schema"].join(" ")),!1))},YMongoose.prototype.load=function(){var n=Q.defer(),o=[],r={total:0,processed:0},e=glob.sync("**/*.json",{cwd:this.paths.model,realpath:!0}),i=joi.object().keys({model:joi.object().keys({name:joi.string().required(),properties:joi.object().required(),crud:joi.object().required().keys({enable:joi.boolean().required(),exclude:joi.array().required().empty(),redis:joi.object().optional().keys({enable:joi.boolean().required().default(!1),expire:joi.number().optional().min(0).default(0),include:joi.array().items(joi.string().empty().valid(["get","getOne"]))})}).allow("enable","exclude"),validator:joi.string().optional(),crypto:joi.object().optional().keys({hashType:joi.string().required().empty().valid("aes256"),hashKey:joi.string().required().empty().min(32)}).default({hashType:"aes256",hashKey:""}),compound:joi.array().optional().items(joi.object().required().unknown().empty({}))}).unknown()}).unknown(),t=async.queue(function(e,o){var t=joi.validate(e.data,i);if(this.logger.debug(["----------------------------","Processing : [",e.file,"]","----------------------------"].join(" ")),!_.isNull(t.error)){var s=["Invalid schema for [",e.file,"] Error is :",t.error].join(" ");return this.logger.error(["[ YMongoose.load.queue ] -",s].join(" ")),o(s)}this.addModel(t.value).then(function(){r.processed++,o()}).catch(function(){o(["Cannot create model for  [",e.file,"]"].join(" "))})}.bind(this),100);t.drain=function(){this.logger.debug([_.repeat("-",28),"[ Process Queue Complete ]",_.repeat("-",28)].join(" ")),this.logger.info("[ YMongoose.load ] - All Model was processed & loaded."),this.loaded=r.processed===r.total,this.loaded?n.resolve():(this.logger.error(["[ YMongoose.load ] -","All item was NOT correctly processed.","Check your logs."].join(" ")),n.reject(),this.disconnect())}.bind(this);var d=[];return this.modules.modTypes.load(this.modules).then(function(){async.each(e,function(e,o){var t=e.replace(path.dirname(e),"");try{var s=JSON.parse(fs.readFileSync(e,"utf-8"));d.push({file:t,data:s}),r.total++,o()}catch(e){var i=["Cannot add item to queue. Error is : [",e,"] for [",t,"]"].join(" ");this.logger.error(["[ YMongoose.load ] -",i].join(" ")),n.reject(i),this.disconnect()}}.bind(this),function(){t.push(d,function(e){e&&(this.logger.error(["[ YMongoose.load ] - Cannot add an item to queue [",e,"]"].join(" ")),o.push(e))}.bind(this))}.bind(this))}.bind(this)).catch(function(e){this.logger.error(["[ YMongoose.load.Types ] - Error when loading custom Types [",e,"]"].join(" ")),n.reject(e)}.bind(this)),n.promise},YMongoose.prototype.getModel=function(e,o){if(this.isReady(!0)&&this.isLoaded()&&_.isString(e)&&!_.isEmpty(e))try{var t=this.mongoose.model(e);return t.Types=mongoose.Types,_.isBoolean(o)&&o?new t:t}catch(e){return this.logger.error("[ YMongoose.getModel ] - Model not found. Invalid schema name given."),this.logger.debug(["[ YMongoose.getModel ] -",e].join(" ")),!1}return this.logger.error("[ YMongoose.getModel ] - Cannot get model. Invalid schema name given."),!1},module.exports=function(e){return(_.isUndefined(e)||_.isNull(e))&&(logger.warning("[ YMongoose.constructor ] - Invalid logger given. Use internal logger"),e=logger),new YMongoose(e)};