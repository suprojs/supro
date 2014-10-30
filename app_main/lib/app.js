/*
 * Business logic HTTP API served by `connectjs` for node-webkit(local UI)
 * and for browsers(remote UI)
 */

module.exports = runApp

function runApp(cfg, uncaughtExceptions){
var api      = require('./api.js')
   ,sendFile = require('./middleware/sendFile.js')
   ,_404     = require('./middleware/404.js')
   ,connect  = api.connect = require('connect')
   ,app      = api.app = connect()
   ,mwConfig, Modules

    // provide api to assign final handlers
    if(cfg.backend.ctl_on_done){
        api.ctl_on_done = cfg.backend.ctl_on_done
        cfg.backend.ctl_on_done = null
    }
    /* `l10n` files middleware factory for app modules */
    api.mwL10n = require('./middleware/l10n.js')
    /* UI/ExtJS per-user/role config changer */
    api.set_mwConfig = set_mwConfig
    set_mwConfig()// setup the simplest one

    /* Add own middlewares */

    connect.sendFile = sendFile
    connect._404 = _404

    /* Application middleware setup */

    app.use(connect.cookieParser())
    app.use(connect.json())
    app.use(require('./middleware/postTextPlain.js'))

    /* ExtJS for HTTP users */
    remote_extjs_cfg()

    app.use('/app_back.js' , _404)// hide
    app.use('/app_front.js' , sendFile('app_front_http.js'))// switch to web UI

    require('../../app_modules/')(cfg, api)

    /* backend static files for HTTP users */
    app.use('/', connect['static'](__dirname + '/../', { index: 'app.htm' }))

    app.use('/uncaughtExceptions', mwUncaughtExceptions)
    app.use('/test.js', sendFile('test.js'))
    /* final stage: error path */
    app.use(require('./middleware/errorHandler.js'))
       .use(_404)// no middleware handled request
    .listen(cfg.backend.job_port, function app_is_up_and_running(){
        log('^ app is up and running\n' +
            new Date().toISOString()
        )
    })
    .timeout = (1 << 23)// default timeout for long events waitings requests

    if(api.getModules){// default reference to all (being loaded later) modules
        Modules = api.getModules()
    }

    return

    function set_mwConfig(mw){
        mwConfig = mw || addModulesConfigs

        return cfg// return global config to (any) auth module

        function addModulesConfigs(req, res){
        var i, j, k

            if(Modules){// default all-for-all setup (auth module overwrites this)
                cfg.extjs.modules = { }
                for(i in Modules){
                    k = Modules[i]
                    if(k.css) for(j = 0; j < k.css.length; ++j){
                        cfg.extjs.launch.css.push(k.css[j])
                    }
                    if(k.js)  for(j = 0; j < k.js.length; ++j){
                        cfg.extjs.launch.js .push(k.js[j])
                    }
                    cfg.extjs.modules[i] = { extjs:{ }}
                    for(j in k.cfg.extjs){
                        cfg.extjs.modules[i].extjs[j] = k.cfg.extjs[j]
                    }
                }
                Modules = null
            }

            return res.json(cfg.extjs)
        }
    }

    function use_mwConfig(req, res, next){
        return mwConfig(req, res, next)
    }

    function mwUncaughtExceptions(req, res, next){
        if(req.json){
            return res.json(uncaughtExceptions)
        }
        return res.txt(uncaughtExceptions.join('\n====\n'))
    }

    function remote_extjs_cfg(){
        if(cfg.backend.extjs.pathFile){
            cfg.extjs.path = require('fs').readFileSync(cfg.backend.extjs.pathFile)
                                          .toString().trim()
        }
        cfg.extjs.path = __dirname + '/../../' + cfg.extjs.path
        app.use('/extjs/',                  connect['static'](cfg.extjs.path))
        app.use('/extjs/docs/extjs-build/', connect['static'](cfg.extjs.path))
        cfg.extjs.path = 'extjs/'// switch local to external http path
        app.use('/app.config.extjs.json', use_mwConfig)// provide isolated cfg
    }
}
