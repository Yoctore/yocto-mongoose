/* yocto-mongoose - Utility tool to manage mongoose connection and auto loading models. - V2.3.0 - Fri Oct 12 2018 12:16:28 GMT+0400 (+04)*/

"use strict";var glob=require("glob"),logger=require("yocto-logger"),_=require("lodash"),Schema=require("mongoose").Schema,joi=require("joi"),utils=require("yocto-utils"),stackTrace=require("stack-trace");function Method(e){this.logger=e}Method.prototype.add=function(o,e,t,i,s){if(_.isString(e)&&_.isArray(t)&&!_.isEmpty(e)&&!_.isEmpty(t)&&_.isObject(o)&&o instanceof Schema&&_.isString(i)&&!_.isEmpty(i)){var n=glob.sync(["**/",i,".js"].join(""),{cwd:e,realpath:!0,nocase:!0});if(0<n.length)return _.each(n,function(e){var r=require(e);_.each(t,function(t){var e=joi.object().keys({type:joi.string().required().empty().valid(["static","method","post","pre"]),name:joi.string().required().empty(),event:joi.optional().when("type",{is:"post",then:joi.string().required().empty().valid(["init","validate","save","remove","count","find","findOne","findOneAndRemove","findOneAndUpdate","update"])}),redis:joi.object().optional().keys({enable:joi.boolean().required().default(!1),expire:joi.number().optional().min(0).default(0)})}),i=joi.validate(t,e);if(_.isNull(i.error))if(_.has(r,t.name)&&_.isFunction(r[t.name])){if(this.logger.debug(["[ Method.add ] - Method [",t.name,"] founded adding new","method"===t.type?"instance":t.type,"method for given schema"].join(" ")),"post"!==t.type&&"pre"!==t.type||!_.isString(t.event)||_.isEmpty(t.event))o[t.type](t.name,function(){return r[t.name].apply(this,arguments)});else{this.logger.debug(["[ Method.add ] - Adding [",t.type," ] hook on current schema for event [",t.event,"]"].join(" "));var n=this.logger;"post"===t.type?o.post(t.event,function(){return r[t.name].apply(this,_.flatten([arguments,n]))}):o.pre(t.event,function(e){return r[t.name].apply(this,_.flatten([arguments,n])),_.isFunction(e)?e():e})}t.redis&&(_.isArray(o.redisExpireTimeByKey)||(o.redisExpireTimeByKey=[]),_.has(t.redis,"enable")&&t.redis.enable&&(o.redisExpireTimeByKey.push(_.set({},t.name,t.redis.expire)),o.static("redis",function(){var e=stackTrace.get()[1];_.isObject(e)&&(e=(e=e.getFunctionName()).replace("exports.",""));var t=_.result(_.find(this.schema.redisExpireTimeByKey,e),e);return _.has(o,"statics.crypto")&&_.isFunction(o.statics.crypto)&&_.set(s,"crypto",o.statics.crypto),{instance:s,expire:t||0}})))}else this.logger.warning(["[ Method.add ] - Cannot found method [",t.name,"] for current model"].join(" "));else this.logger.error(["[ Method.add ] - Cannot add method for item",utils.obj.inspect(t),i.error].join(" "))}.bind(this))}.bind(this)),o;this.logger.warning(["[ Method.add ] - Given directory path for","Methods seems to be empty.","Cannot add method on schema."].join(" "))}else this.logger.error("[ Method.add ] - cannot process invalid path / name or schema given.");return!1},module.exports=function(e){return(_.isUndefined(e)||_.isNull(e))&&(logger.warning("[ Method.constructor ] - Invalid logger given. Use internal logger"),e=logger),new Method(e)};