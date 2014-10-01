/*
 * Application modules loader
 **/

module.exports = app_modules

function app_modules(cfg, api){
var m, mpath
   ,err = ''
   ,fs = require('fs')
   ,modules = { }// private list of modules

    api.getModules = get_modules
    for(m in cfg.modules){
        mpath = './' + m
        try {
            if(fs.statSync(__dirname + '/' + m).isDirectory()){
                // check e.g.: app_modules/userman/app_back_userman.js
                mpath += '/app_back_' + m
            }
        } catch(ex){/* will try to load file e.g.: app_modules/pingback.js */}
        mpath += '.js'
        try {// to load the module
            modules[m] = require(mpath)(api, cfg.modules[m])
        } catch(ex){
            err += mpath.replace(/[.]js/, '[.js]') + ':\n!!!' + ex.stack + '\n'
        }
    }
    return err && log('Error loading app module(s) from `config`:\n', err)

    function get_modules(){
        return modules
    }
}
