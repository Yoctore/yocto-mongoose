/* yocto-mongoose - Utility tool to manage mongoose connection and auto loading models. - V1.4.5 */
"use strict";function YMongoose(a){this.logger=a,this.mongoose=mongoose,this.paths={model:"",validator:"",method:"",enums:""},this.crud=!1,this.loaded=!1,this.modules={crud:require("./modules/crud")(a),validator:require("./modules/validator")(a),method:require("./modules/method")(a),enums:require("./modules/enum")(a),elastic:require("./modules/utils/elastic")(a)}}var logger=require("yocto-logger"),mongoose=require("mongoose"),_=require("lodash"),path=require("path"),fs=require("fs"),glob=require("glob"),joi=require("joi"),async=require("async"),Schema=mongoose.Schema,Q=require("q"),elastic=require("mongoosastic"),utils=require("yocto-utils");mongoose.Promise=require("q").Promise,YMongoose.prototype.isConnected=function(){return this.mongoose.connection.readyState===this.mongoose.Connection.STATES.connected},YMongoose.prototype.isDisconnected=function(){return this.mongoose.connection.readyState===this.mongoose.Connection.STATES.disconnected},YMongoose.prototype.connect=function(a,b){var c=Q.defer();return this.logger.info(["[ YMongoose.connect ] -","Try to create a database connection on [",a,"]"].join(" ")),this.mongoose.connection.on("open",function(){this.logger.info(["[ YMongoose.connect ] - Connection successful on",a].join(" ")),c.resolve()}.bind(this)),this.mongoose.connection.on("error",function(a){this.logger.error(["[ YMongoose.connect ] - Connection failed.","Error is :",a.message].join(" ")),c.reject(a)}.bind(this)),_.isString(a)&&!_.isEmpty(a)?(b=_.isObject(b)&&!_.isEmpty(b)?b:{},this.mongoose.connect(a,b)):(this.logger.error("[ YMongoose.connect ] - Invalid url, cannot connect."),c.reject()),c.promise},YMongoose.prototype.disconnect=function(){var a=Q.defer();return this.logger.info("[ YMongoose.disconnect ] - Try to disconnect all connections"),this.isConnected()?this.mongoose.disconnect(function(b){b?(this.logger.error(["[ YMongoose.disconnect ] - Disconnect failed.","Error is :",b.message].join(" ")),a.reject(b)):(this.logger.info("[ YMongoose.disconnect ] - Disconnect successful."),a.resolve())}.bind(this)):(this.logger.warning("[ YMongoose.disconnect ] - Cannot disconnect orm is not connected."),a.reject()),a.promise},YMongoose.prototype.elasticHosts=function(a){a=_.isArray(a)?a:[a||{host:"127.0.0.1",port:9200,protocol:"http"}];var b=joi.array().required().items(joi.object().keys({host:joi.string().required().empty().ip({version:["ipv4","ipv6"]})["default"]("127.0.0.1"),port:joi.number().required()["default"](9200),protocol:joi.string().optional().valid(["http","https"])["default"]("http"),auth:joi.string().optional().empty()})["default"]({host:"127.0.0.1",port:9200,protocol:"http"}))["default"]([{host:"127.0.0.1",port:9200,protocol:"http"}]),c=joi.validate(a,b);return c.error?(this.logger.warning(["[ YMongoose.elasticHosts ] - Invalid host config given :",c.error].join(" ")),!1):(this.modules.elastic.enableHosts(c.value),!0)},YMongoose.prototype.models=function(a){return this.logger.debug("[ YMongoose.models ] - Try to set model defintion path."),this.setPath(a)},YMongoose.prototype.validators=function(a){return this.logger.debug("[ YMongoose.validators ] - Try to set validator defintion path."),this.setPath(a,"validator")},YMongoose.prototype.methods=function(a){return this.logger.debug("[ YMongoose.methods ] - Try to set methods defintion path."),this.setPath(a,"method")},YMongoose.prototype.enums=function(a){return this.logger.debug("[ YMongoose.enums ] - Try to set enums defintion path."),this.setPath(a,"enums")},YMongoose.prototype.setPath=function(a,b){var c={model:{ext:"json",name:"model"},validator:{ext:"js",name:"validator"},method:{ext:"js",name:"method"},enums:{ext:"json",name:"enums"}},d=_.find(c,"name",b);if(!_.isUndefined(d)&&_.isObject(d)&&_.isString(a)&&!_.isEmpty(a)){a=path.isAbsolute(a)?a:path.normalize([process.cwd(),a].join("/"));try{fs.accessSync(a,fs.R_OK);var e=fs.statSync(a);if(!e.isDirectory())throw[a,"is not a valid directory."].join(" ");var f=glob.sync(["**/*.",d.ext].join(""),{cwd:a});0===f.length&&this.logger.warning(["[ YMongoose.setPath ] - Given directory path for",[d.name,"enums"!==d.name?"s":""].join(""),"seems to be empty.","Don't forget to ad your",d.ext,"file before load call"].join(" ")),this.paths[d.name]=a,this.logger.debug(["[ YMongoose.setPath ] -",_.capitalize([d.name,"enums"!==d.name?"s":""].join("")),"path was set to :",this.paths[d.name]].join(" "))}catch(g){return this.logger.error(["[ YMongoose.setPath ] - Set path for",[d.name,"enums"!==d.name?"s":""].join(""),"failed.",g].join(" ")),this.disconnect(),!1}return!0}return this.logger.error(["[ YMongoose.setPath ] - Cannot set directory for [",b,"]","Invalid directory given or cannot retreive types rules"].join(" ")),!1},YMongoose.prototype.isLoaded=function(){return this.loaded},YMongoose.prototype.isReady=function(a){return a&&(this.isConnected()||this.logger.error("[ YMongoose.isReady ] - Connection is not ready."),_.isEmpty(this.paths.model)&&this.logger.error("[ YMongoose.isReady ] - Model definition path is not set."),_.isEmpty(this.paths.validator)&&this.logger.error("[ YMongoose.isReady ] - Validator definition path is not set."),_.isEmpty(this.paths.method)&&this.logger.error("[ YMongoose.isReady ] - Methods definition path is not set."),_.isEmpty(this.paths.enums)&&this.logger.warning("[ YMongoose.isReady ] - Enum definition path is not set.")),this.isConnected()&&!_.isEmpty(this.paths.model)&&!_.isEmpty(this.paths.validator)&&!_.isEmpty(this.paths.method)},YMongoose.prototype.addModel=function(a){var b=Q.defer();if(this.isReady(!0)){_.isObject(a)&&!_.isEmpty(a)&&_.has(a,"model")&&_.has(a.model,"properties")&&_.has(a.model,"name")||(this.logger.error("[ YMongoose.addModel ] - Cannot create model. Invalid data given"),b.reject()),this.logger.debug(["[ YMongoose.addModel ] - Creating model [",a.model.name,"]"].join(" "));var c=!1;if(_.has(a.model,"elastic")&&_.isObject(a.model.elastic)&&this.modules.elastic.configIsReady()&&_.isBoolean(a.model.elastic.enable)&&a.model.elastic.enable){this.logger.debug(["[ YMongoose.addModel ] - Elastic mode is enabled for this model.","Adding default index on all properties to false"].join(" "));var d=this.modules.elastic.addDefaultIndexes(_.cloneDeep(a.model.properties));_.merge(d,a.model.properties),c=!0}var e=new Schema(a.model.properties);if(c&&(this.logger.debug(["[ YMongoose.addModel ] - Elastic mode is enabled for this model.","Adding mongoosastic plugin to current schema"].join(" ")),e.plugin(elastic,_.merge({hosts:this.modules.elastic.getHosts()},_.omit(a.model.elastic.options,["hosts","host","port","protocol","auth"])))),e.elastic=c,_.has(a.model,"crud")&&_.has(a.model.crud,"enable")&&_.isObject(a.model.crud)&&a.model.crud.enable){this.logger.debug(["[ YMongoose.addModel ] - Crud mode is enabled.","Try to add default methods"].join(" "));var f=this.createCrud(e,a.model.crud.exclude);f&&(this.logger.debug(["[ YMongoose.addModel ] - Adding Crud method success"].join(" ")),e=f)}if(!_.isUndefined(a.model.validator)&&!_.isNull(a.model.validator)&&_.isString(a.model.validator)&&!_.isEmpty(a.model.validator)){this.logger.debug(["[ YMongoose.addModel ] - A validator is defined.","Try to add a validate method."].join(" "));var g=this.createValidator(e,a.model.validator,a.model.name.toLowerCase());g&&(this.logger.debug(["[ YMongoose.addModel ] - Adding validate method success"].join(" ")),e=g)}if(!_.isUndefined(a.model.fn)&&!_.isNull(a.model.fn)&&_.isArray(a.model.fn)&&!_.isEmpty(a.model.fn)){this.logger.debug(["[ YMongoose.addModel ] - External methods are defined.","Try to add them."].join(" "));var h=this.createMethod(e,a.model.fn,a.model.name.toLowerCase());h&&(this.logger.debug(["[ YMongoose.addModel ] - Adding external methods success"].join(" ")),e=h)}_.isEmpty(this.paths.enums)||(this.modules.enums.load(this.paths.enums)?this.logger.debug("[ YMongoose.addModel ] - loading enums value success"):this.logger.warning("[ YMongoose.addModel ] - loading enums value failed")),e["static"]("enums",function(){return this.modules.enums}.bind(this));var i=this.mongoose.model(a.model.name,e);c?(this.logger.debug(["[ YMongoose.addModel ] - Elastic mode is enabled for this model.","Create mapping to current model"].join(" ")),i.createMapping(function(a,c){a?this.logger.error(["[ YMongoose.addModel ] - Elastic create mapping error :",a].join(" ")):this.logger.debug(["[ YMongoose.addModel ] - Elastic create mapping success :",utils.obj.inspect(c)].join(" ")),a?b.reject():b.resolve()}.bind(this))):b.resolve()}else b.reject();return b.promise},YMongoose.prototype.createCrud=function(a,b){return this.isReady(!0)?a instanceof Schema?this.modules.crud.add(a,b):(this.logger.warning([" [ YMongoose.createCrud ] - Cannot process."," given schema is not an instanceof Schema"].join(" ")),!1):!1},YMongoose.prototype.createValidator=function(a,b,c){return this.isReady(!0)?a instanceof Schema?this.modules.validator.add(a,this.paths.validator,b,c):(this.logger.warning([" [ YMongoose.createValidator ] - Cannot process."," given schema is not an instanceof Schema"].join(" ")),!1):!1},YMongoose.prototype.createMethod=function(a,b,c){return this.isReady(!0)?a instanceof Schema?this.modules.method.add(a,this.paths.method,b,c):(this.logger.warning([" [ YMongoose.createMethod ] - Cannot process."," given schema is not an instanceof Schema"].join(" ")),!1):!1},YMongoose.prototype.load=function(){var a=Q.defer(),b=this,c=[],d={total:0,processed:0},e=glob.sync("**/*.json",{cwd:this.paths.model,realpath:!0}),f=joi.object().keys({model:joi.object().keys({name:joi.string().required(),properties:joi.object().required(),crud:joi.object().required().keys({enable:joi["boolean"]().required(),exclude:joi.array().required().empty()}).allow("enable","exclude"),validator:joi.string().optional()}).unknown()}).unknown(),g=async.queue(function(a,b){var c=joi.validate(a.data,f);if(this.logger.debug(["----------------------------","Processing : [",a.file,"]","----------------------------"].join(" ")),!_.isNull(c.error)){var e=["Invalid schema for [",a.file,"] Error is :",c.error].join(" ");return this.logger.error(["[ YMongoose.load.queue ] -",e].join(" ")),b(e)}this.addModel(a.data).then(function(){d.processed++,b()})["catch"](function(){b(["Cannot create model for  [",a.file,"]"].join(" "))})}.bind(this),100);return g.drain=function(){this.logger.debug(["---------------------------- [","Process Queue Complete.","] ----------------------------"].join(" ")),this.logger.debug(["[ YMongoose.load.queue.drain ] - Statistics -","[ Added on queue :",d.total,d.total>1?"items":"item","] -","[ Processed :",d.processed,d.processed>1?"items":"item","] -","[ Errors :",c.length,c.length>1?"items":"item","]"].join(" ")),this.loaded=d.processed===d.total,b.loaded?(this.logger.info("[ YMongoose.load ] - All Model was processed & loaded."),a.resolve()):(this.logger.error(["[ YMongoose.load ] -","All item was NOT correctly processed.","Check your logs."].join(" ")),a.reject(),this.disconnect())}.bind(this),_.each(e,function(f){var h=f.replace(path.dirname(f),"");try{var i=JSON.parse(fs.readFileSync(f,"utf-8"));d.total++,g.push({file:h,data:i},function(a){a&&(b.logger.error(["[ YMongoose.load ] - Cannot add item to queue for [",h,"]"].join(" ")),c.push(a))})}catch(j){if(this.logger.warning(["[ YMongoose.load ] - cannot add item to queue.","Error is : [",j,"] for [",h,"]"].join(" ")),_.last(e)===f&&0===d.total){var k="All loaded data failed during JSON.parse(). Cannot continue.";this.logger.error(["[ YMongoose.load ] -",k].join(" ")),a.reject(k),this.disconnect()}}},this),a.promise},YMongoose.prototype.getModel=function(a,b){if(this.isReady(!0)&&this.isLoaded()&&_.isString(a)&&!_.isEmpty(a))try{var c=this.mongoose.model(a);return _.isBoolean(b)&&b?new c:c}catch(d){return this.logger.error("[ YMongoose.getModel ] - Model not found. Invalid schema name given."),this.logger.debug(["[ YMongoose.getModel ] -",d].join(" ")),!1}return this.logger.error("[ YMongoose.getModel ] - Cannot get model. Invalid schema name given."),!1},module.exports=function(a){return(_.isUndefined(a)||_.isNull(a))&&(logger.warning("[ YMongoose.constructor ] - Invalid logger given. Use internal logger"),a=logger),new YMongoose(a)};