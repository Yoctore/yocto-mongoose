/* yocto-mongoose - Utility tool to manage mongoose connection and auto loading models. - V2.2.0 */

"use strict";var _=require("lodash"),logger=require("yocto-logger"),utils=require("yocto-utils"),traverse=require("traverse");function Crypt(t,e){this.logger=t,this.algorithm="aes256",this.hashKey="",this.Types=e}Crypt.prototype.encrypt=function(t){if(t&&!this.isAlreadyCrypted(t)){this.logger.verbose(["[ YMongoose.cryto.encrypt ] - Starting encrypt process with algo [",this.algorithm,"] for data ",utils.obj.inspect(t)].join(" "));var e=utils.crypto.encrypt(this.hashKey,t,this.algorithm);if(e)return this.logger.verbose(["[ YMongoose.cryto.encrypt ] - Value was successfuly crypted to ",utils.obj.inspect(e)].join(" ")),e}return t},Crypt.prototype.decrypt=function(t){if(t){this.logger.verbose(["[ YMongoose.cryto.decrypt ] - Starting decrypt process with algo [",this.algorithm,"] for data ",utils.obj.inspect(t)].join(" "));var e=utils.crypto.decrypt(this.hashKey,t,this.algorithm);if(e)return this.logger.verbose(["[ YMongoose.cryto.decrypt ] - Value is crypted so decrypted value is",utils.obj.inspect(e)].join(" ")),e}return t},Crypt.prototype.isAlreadyCrypted=function(t){if(t&&(this.logger.verbose(["[ YMongoose.cryto.isAlreadyCrypted ] - Checking if given data [",utils.obj.inspect(t),"] is already crypted"].join(" ")),utils.crypto.decrypt(this.hashKey,t,this.algorithm)))return this.logger.verbose(["[ YMongoose.cryto.isAlreadyCrypted ] - Given data",utils.obj.inspect(t),"is already crypted. Skipping this process !"].join(" ")),!0;return!1},Crypt.prototype.setAlgorithmAndKey=function(t){return this.algorithm=_.get(t,"hashType")||this.algorithm,this.hashKey=_.get(t,"hashKey")||this.hashKey,this},Crypt.prototype.prepare=function(r){return r&&_.isObject(r)?_.isDate(r)||_.isRegExp(r)?r:_.isArray(r)?_.map(r,this.prepare.bind(this)):_.has(r,"isJoi")?r:_.reduce(Object.keys(r),function(t,e){return t[e]=this.prepare(r[e]),t=this.addDefaultSettersAndGetters(r,e,t),t=this.processAndCheckTypeForSetterAndGetters(r,e,t)}.bind(this),{}):r},Crypt.prototype.addDefaultSettersAndGetters=function(t,e,r){return _.has(t[e],"ym_crypt")&&_.get(t[e],"ym_crypt")&&(_.set(r[e],"set",function(t){return this.encrypt(t)}.bind(this)),_.set(r[e],"get",function(t){return this.decrypt(t)}.bind(this))),r},Crypt.prototype.processAndCheckTypeForSetterAndGetters=function(r,i,t){return _.has(r[i],"type")&&(_.isArray(_.get(r[i],"type"))?_.set(t[i],"get",function(t){return _.isUndefined(t)||_.isEmpty(t)?t:this.remapNestedArray(t.toObject())}.bind(this)):_.isPlainObject(_.get(r[i],"type"))&&_.each(["set","get"],function(e){_.set(t[i],e,function(t){return _.isPlainObject(t)&&(t=this.walkDeepPlainObject(t,_.get(r[i],"type"),"set"===e)),t}.bind(this))}.bind(this))),t},Crypt.prototype.walkDeepPlainObject=function(s,n,t){return _.map(traverse(s).paths(),function(t){var e=1<_.size(t)?[t.join(".type."),"ym_crypt"].join("."):[t].join(".ym_crypt");e=(e=e.replace(/(type\.\d\.type)/g,"type.0")).replace(/(\.\d\.)/g,".0.");var r=_.result(n,e);if(_.isBoolean(r)&&r){var i=_.result(s,t);i=this.isAlreadyCrypted(i)?this.decrypt(i):this.encrypt(i),_.set(s,t,i)}}.bind(this)),s},Crypt.prototype.remapNestedArray=function(t,i,s){return i=!_.isUndefined(i)&&i,s=!_.isUndefined(s)&&s,_.map(t,function(t){return!this.Types.ObjectId.isValid(t)&&_.isPlainObject(t)?_.mapValues(t,function(t,e){if(_.isArray(t)&&!_.isEmpty(t))return this.remapNestedArray(t,i,s);var r=i?"encrypt":"decrypt";return _.includes(["_id","__v"],e)||s?t:this[r](t)}.bind(this)):t}.bind(this))},module.exports=function(t,e){return(_.isUndefined(t)||_.isNull(t))&&(logger.warning("[ Crypt.constructor ] - Invalid logger given. Use internal logger"),t=logger),new Crypt(t,e)};