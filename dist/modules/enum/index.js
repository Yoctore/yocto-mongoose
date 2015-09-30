/* yocto-mongoose - Utility tool to manage mongoose connection and auto loading models. - V1.0.4 */
"use strict";function Enums(a){this.logger=a,this.enums=[]}var _=require("lodash"),fs=require("fs"),glob=require("glob"),joi=require("joi"),logger=require("yocto-logger");Enums.prototype.load=function(a){try{if(!_.isString(a)||_.isEmpty(a))throw"Invalid path given.";var b=joi.array().items(joi.object().required().keys({name:joi.string().required().empty(""),value:joi.array().required().min(1)})),c=glob.sync("**/*.json",{cwd:a,realpath:!0});_.each(c,function(a){var c=JSON.parse(fs.readFileSync(a,"utf-8")),d=joi.validate(c,b);_.isNull(d.error)?this.enums.push(d.value):this.logger.warning(["[ Enums.load.parse ] -  Cannot load item for [",a,"]",d.error].join(" "))},this),this.enums=_.uniq(_.flatten(this.enums),"name")}catch(d){return this.logger.error(["[ Enums.load ] - Cannot load path from given enum path.",d].join(" ")),!1}return!0},Enums.prototype.get=function(a){if(_.isString(a)&&!_.isEmpty(a)){if(_.isArray(this.enums)&&!_.isEmpty(this.enums))return _.result(_.find(this.enums,"name",a),"value")||[];this.logger.warning("[ Enums.get ] - enums list is empty. try to load enums before get")}else this.logger.warning("[ Enums.get ] - given name is empty or not a string.");return[]},module.exports=function(a){return(_.isUndefined(a)||_.isNull(a))&&(logger.warning("[ Enums.constructor ] - Invalid logger given. Use internal logger"),a=logger),new Enums(a)};