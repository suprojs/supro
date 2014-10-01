/*
 * running JavaScript inside backend
 * such effect can be impemented by any app module
 * but maybe this will have some more access to app internals (TODO)
 **/

module.exports = pingback

function pingback(api, cfg){// run external text here
var ui, App_backend_JS = 'App.backend.JS'// UI component

    api.app.use('/pingback'// backend API
   ,function mwPingBack(req, res, next){
    var ret = { success: false }

        if(req.session && req.session.can && req.session.can[App_backend_JS]){
            if(req.txt) try {
                new Function(
                   'ret, api, req, res, next', req.txt
                )(
                    ret, api, req, res, next
                )
                if(ret.async){
                    return null// user code must do all further response processing
                }
                ret.success = true
            } catch(ex){
                return next(ex.stack)// pass to the standard error handling middleware
            }
        } else {
            res.statusCode = 401
        }
        return res.json(ret)
    })

    api.app.use('/backend/JS.js'
   ,function mwPingBackUI(req, res, next){
    var component

        if(req.session && req.session.can && req.session.can[App_backend_JS]){
            component = ui
        } else {
            res.statusCode = 401
        }
        res.js(component)
    })

    ui = App_backend_JS + ' = (' + (
/*
 * == ExtJS code ==
 **/
function create_pingback(){
/* running JavaScript inside backend via App.backend.req()
 * usage:
 * > App.backend.JS(' ret.data = { val: 123 } ')
 * >>{"success":true,"data":{"val":123}}
 **/
var url = App.backendURL + '/pingback'
   ,appjs = { 'Content-Type': 'application/javascript; charset=utf-8' }

    return function run_js_code_on_backend(code, cb){
        App.backend.req(url, code,{
                callback: cb || default_callback
               ,headers: appjs
            }
        )
    }

    function default_callback(err, json){
        if(err) return console.error(err)

        console.dir(App.backend.JS.res = json)
        console.log('result is here: `App.backend.JS.res`')
    }
}
/*
 * -- ExtJS code ends here --
 **/).toString() + ')()'

    return { css: null, js:[ App_backend_JS ], cfg: cfg }
}
