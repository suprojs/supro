/*
 * 'nodejs + connectjs': HTTP communication with backend (remote web browser)
 * for both `nw.js` and `browser` contexts
 */

;(function app_front_http(url){
var xhr = new XMLHttpRequest

    xhr.open('GET', (url || '') + '/app.config.extjs.json', true)
    xhr.onreadystatechange = load_config_then_check_ExtJS
    xhr.send()
    xhr = null
    return

    function load_config_then_check_ExtJS(res){
    var extjs_config, req = res.target

        if(4 != req.readyState) return

        if(200 != req.status) throw new Error(
            ~String(req.responseURL).indexOf('ext-') ?
            l10n.extjsNotFound : l10n.errload_config_read
        )

        if(/config/.test(req.responseURL) ||      // Firefox
          (!req.responseURL && req.responseText)){// node-webkit
        // check config request
            extjs_config = JSON.parse(req.responseText)

            if('1' === localStorage.devSUPRO){// development tools see 'app.htm'
                extjs_config.load = extjs_config.loadMiniInit = ''
            } else {// config has no 'mini' setup, but 'app-mini.htm' was requested
                extjs_config.load = extjs_config.loadMiniInit = 'lite'
            }

            extjs_config.load = (extjs_config.path + 'ext-'
            // load full or split ExtJS 'ext-all*js' || 'ext-lite*js' && 'ext-rest*js'
            + (extjs_config.load || 'all')
            // '*-debug': load standard ExtJS file
            // '*-nw': fast load files without whitespace and comments
            // 'ext-lite-nw.js': fastest load with concatinated init/login files
            + '-' + (extjs_config.loadMiniInit ? 'nw' : 'debug')
            + '.js'
            )

            if(url){
            // `nw` context
                url = App.cfg.extjs.path// flip path
                App.cfg.extjs = extjs_config
                App.cfg.extjs.path = url// restore it back
                App.cfg.extjs.appFolder = ('http://127.0.0.1:' +
                    App.cfg.backend.job_port
                )
                App.cfg.modules = extjs_config.modules,// final per auth/role app_modules load
                check_backend()
                return
            }
            // goto `browser` context below
        } else {// load after HEAD check request (only browser context)
            check_backend()
            return
        }

        extjs_config.appFolder || (extjs_config.appFolder = '.')
        App.cfg.extjs = extjs_config
        App.cfg.modules = extjs_config.modules// final per auth/role app_modules load
        App.cfg.backend = {// record start time
            time: new Date,
            msg: l10n.stsBackendXHR,
            op: l10n.stsCheck
        }

        if(window.Ext){// ExtJS is available (fast loading)
            check_backend()
            return
        }

        req.open(// check for network availability of ExtJS
            'HEAD'
           ,(url || '')// `nw.js` context
           + extjs_config.load// configured extjs file to load
           ,true
        )
        req.send()
        return

        /*
         * check if all is OK on backend startup
         * i.e. after backend start or restart admin or programmer must load UI
         * to run this check and see results
         */
        function check_backend(){
            req.open(
                'GET'
               ,(App.cfg.extjs.appFolder || '') + '/uncaughtExceptions'
               ,true
            )
            req.onreadystatechange = run_extjs_helper
            req.send()
        }

        function run_extjs_helper(res){
        var el

            if(4 != res.target.readyState) return
            // show backend 'uncaughtExceptions' if there are any
            if(res.target.responseText){
                el = document.getElementById('e')
                el.innerHTML = res.target.responseText
                el.style.display = 'block'
                el = void 0
            }
            App.extjs_helper()// setup is done, continue ExtJS loading
            return
        }
    }
})(App.cfg.backend && App.cfg.backend.url);/* `nw` context */
