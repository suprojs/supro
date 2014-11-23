/*
 * Application modules loader
 **/

module.exports = app_modules

function app_modules(cfg, api){
var m, mpath
   ,err = ''
   ,fs = require('fs')
   ,modules = { }// private list of modules
   ,a ,app_use = [ ]

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
            if(modules[m].app_use){
                if(app_use){
                    app_use.push(modules[m].app_use)
                } else log(
'!Error app module[' + m + ']: `cfg.app_use` is used if this module is loaded before auth one (e.g. "userman")'
                )
            }
            if(api.rbac && app_use){// handle modules loaded before 'auth' one
                for(a = 0; a < app_use.length; ++a){
                    app_use[a]()
                }// use pending middlewares after `mwBasicAuthorization()`
                app_use = null
            }
        } catch(ex){
            pushUncaughtException(ex.stack)
            err += mpath.replace(/[.]js/, '[.js]') + ':\n!!!' + ex.stack + '\n'
        }
    }
    if(api.rbac){
        api.rbac(modules)// init RBAC from modules
    } else {
        for(a = 0; a < app_use.length; ++a){
            app_use[a]()
        }// use pending middlewares if no auth module was used
    }
    return err && log('Error loading app module(s) from `config`:\n', err)

    function get_modules(){
        return modules
    }
}
