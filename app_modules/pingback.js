/*
 * running JavaScript inside backend
 * such effect can be impemented by any app module
 * but maybe this will have some more access to app internals (TODO)
 *
 * Calling convention:
 * ```js
 * new Function(
 *    req.txt
 * )(ret, api, req, res, next)
 * ```
 * NOTE; sync. code must not do `res.json(res || data)` by itself and must
 *       set sync flag as: `ret._sync = true` (undefine `err`)
 * Chrome/DevTools/Snippets example:

function app_backend(){
// `ret.err` is set by default to this notice
// "`ret` was not handeled"
function api_js(){
    api.db.getCollection("_test").findOne(
    function(err, item){
        console.log(item)
        ret.data = item
        res.json((ret.err = void 0, ret))
    })
}
App.backend.JS('('+ api_js.toString() +')()')

//==== response: ====
//{ _id: 55a7b7a5d4e956d805c58c36,
//  f: 'sfdsdf',
//  asd: Thu Jul 16 2015 16:55:16 GMT+0300 (Jordan Standard Time)
//}
}
app_backend()// available in console

function app_back_sync(){
function api_js_sync(){
    ret.data = this.toString()
    console.log(ret)
    // flag
    ret._sync = true
}

App.backend.JS('('+ api_js_sync.toString() +')()')
}
app_back_sync()

 *
 **/

module.exports = pingback

function pingback(api, cfg){// run external text here
var ui, App_backend_JS = 'App.backend.JS'// UI component

    api.app.use('/pingback'// backend API
   ,function mwPingBack(req, res, next){
    var local, ret = { err: '`ret` was not handeled', _sync: void 0, data: void 0 }

        /*
         * XXX WARNING: uncomment this only for early wireframing and developing
         *               of API using this live reload in DevTools/Snippets
         *
         local = {
            cfg: cfg,
            require:{
                fs: require('fs')
            }
         }
         **/

        if(!req.session || // use auth module or not
           (req.session && req.session.can && req.session.can[App_backend_JS])){
            if(req.txt) try {
                ;;new Function(
                   'ret, api, local, req, res, next', req.txt
                )(
                    ret, api, local, req, res, next
                );;

                if(res._header || res.finished){
                    !ret._sync && log(
'!Error `App.backend.JS`:\n' +
'     code does `res.json()` and does not set `ret._sync = true`\n' +
'     or `next(err)` was called outside async code path'
                    )
                    return void 0
                }
                if(!ret._sync){// async: code must do all further response processing
                    return void 0
                }// making `res.json()` below
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

        do {
            if(req.session && req.session.can){// use auth
                if(!req.session.can[App_backend_JS]){
                    break// deny unauthorized
                }
            }// else or no auth module used -- allow
            component = ui
        } while(0)
        return res.js(component)
    })

    ui = App_backend_JS + ' = (' + (
/*
 * == ExtJS code ==
 **/
function create_pingback(){
/* running JavaScript inside backend via App.backend.req()
 * usage:
 * > App.backend.JS(' ret.data = { val: 123 } ')
 * >>{"err": "","data":{"val":123}}
 **/
var url = App.backendURL + '/pingback'
   ,appjs = { 'Content-Type': 'application/javascript; charset=utf-8' }

    if(!App.User || !App.User.can) Ext.Msg.show({
        title:'App.backend.JS',
        buttons: Ext.Msg.OK,
        icon: Ext.Msg.WARNING,
        msg:'<b>' + l10n.warn_js + '</b>'
    })

    return function run_js_code_on_backend(code, cb){
        App.backend.req(url, code,{
                callback: cb || default_callback
               ,headers: appjs
            }
        )
    }

    function default_callback(err, json){
        App.backend.JS.res = json
        console.dir(json)
        console.log('result is here: `App.backend.JS.res`')
        err && console.error(json && json.err)
    }
}
/*
 * -- ExtJS code ends here --
 **/).toString() + ')()'

    return { css: null, js:[ App_backend_JS ], cfg: cfg }
}
