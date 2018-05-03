/* yocto-mongoose - Utility tool to manage mongoose connection and auto loading models. - V2.2.0 */

"use strict";var async=require("async"),glob=require("glob"),logger=require("yocto-logger"),_=require("lodash"),path=require("path"),Q=require("q");function Types(e,r){this.mongoose=r,this.logger=e}Types.prototype.load=function(t){var r=Q.defer(),e=glob.sync("types/*.js",{cwd:__dirname});return _.isEmpty(e)?(this.logger.info("[ Types.load ] - no custom Types found"),r.resolve()):async.each(e,function(r,o){try{var e=path.basename(r,".js");this.logger.info("[ Types.load ] - Load custom Types : "+e);var s=require("./"+r)(t);_.set(this.mongoose.Schema.Types,e,s),this.logger.debug("[ Types.load ] - custom Types added : "+e),o()}catch(e){this.logger.error("[ Types.load ] - Error when load custom Types at path "+r+", details : ",e),o(e)}}.bind(this),function(e){return e?r.reject(e):r.resolve()}),r.promise},module.exports=function(e,r){return(_.isUndefined(e)||_.isNull(e))&&(logger.warning("[ Types.constructor ] - Invalid logger given. Use internal logger"),e=logger),new Types(e,r)};