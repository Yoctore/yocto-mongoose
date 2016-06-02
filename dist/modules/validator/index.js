/* yocto-mongoose - Utility tool to manage mongoose connection and auto loading models. - V1.7.2 */
"use strict";function Validator(a){this.logger=a}var glob=require("glob"),logger=require("yocto-logger"),_=require("lodash"),Schema=require("mongoose").Schema,joi=require("joi");Validator.prototype.add=function(a,b,c,d){if(_.isString(b)&&_.isString(c)&&!_.isEmpty(b)&&!_.isEmpty(c)&&_.isObject(a)&&a instanceof Schema&&_.isString(d)&&!_.isEmpty(d)){var e=glob.sync(["**/",d,".js"].join(""),{cwd:b,realpath:!0,nocase:!0});if(e.length>0)return _.each(e,function(b){var d=require(b);_.has(d,c)&&_.isFunction(d[c])&&(this.logger.debug(["[ Validator.add ] - [",c,"] validator was founded.","Adding a new validate function on static property","for given schema"].join(" ")),a["static"]("validate",function(a){var b=d[c](this.enums);return joi.validate(a,b)}),a["static"]("getValidateSchema",function(){return d[c](this.enums)}))},this),a;this.logger.warning(["[ Validator.add ] - Given directory path for","Validators seems to be empty.","Cannot add validator on schema."].join(" "))}else this.logger.error(["[ Validator.add ] - cannot process invalid path / name","/ model name or schema given."].join(" "));return!1},module.exports=function(a){return(_.isUndefined(a)||_.isNull(a))&&(logger.warning("[ Validator.constructor ] - Invalid logger given. Use internal logger"),a=logger),new Validator(a)};