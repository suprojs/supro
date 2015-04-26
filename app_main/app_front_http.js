/*
 *  'nodejs + connectjs': HTTP communication with backend (remote web browser)
 */

(function app_front_http(url){
var xhr = new XMLHttpRequest
    xhr.open('GET', (url ? url : '') + '/app.config.extjs.json', true)
    xhr.onreadystatechange = load_config_then_ExtJS
    xhr.send()
    xhr = null
    return

    function load_config_then_ExtJS(res){
    var extjs_config, req = res.target

        if(4 != req.readyState) return

        if(200 != req.status) throw new Error(
            ~String(req.responseURL).indexOf('ext-all') ?
            l10n.extjsNotFound : l10n.errload_config_read
        )

        if(/config/.test(req.responseURL) ||      // Firefox
          (!req.responseURL && req.responseText)){// node-webkit
            extjs_config = JSON.parse(req.responseText)
            if(url){
        // `nw` context
                url = App.cfg.extjs.path// flip path
                App.cfg.extjs = extjs_config
                App.cfg.extjs.path = url// restore it back
                App.cfg.extjs.appFolder = ('http://127.0.0.1:' +
                    App.cfg.backend.job_port
                )
                check_backend()
                return
            }
        // `browser` context
        } else {// load after HEAD check
            check_backend()
            return
        }

        App.cfg = {
            extjs: extjs_config,
            backend:{// record start time
                time: new Date,
                msg: l10n.stsBackendXHR,
                op: l10n.stsCheck
            }
        }

        req.open(// check for network availability of ExtJS
            'HEAD'
           ,(url || '') + App.cfg.extjs.path + 'ext-all-nw.js'
           ,true
        )
        req.send()
        return

        function check_backend(){
            req.open(// check if all is OK on backend startup
                'GET'
               ,(App.cfg.extjs.appFolder || '') + '/uncaughtExceptions'
               ,true
            )
            req.onreadystatechange = run_extjs_helper
            req.send()
        }

        function run_extjs_helper(res){
            if(4 != res.target.readyState) return

            if(res.target.responseText){// backend uncaughtExceptions
                throw new Error('!' + res.target.responseText)
            }
            App.extjs_helper()
            return
        }
    }
})(App.cfg && App.cfg.backend.url)
