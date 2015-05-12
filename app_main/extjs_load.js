/*
 * common part for `nw` && `connectjs` front ends
 * one global Application variable / namespace
 */

var App

;(function gc_wrapper(doc, w, l10n, con){
    App || (App = {
        // data
        cfg:{
            extjs: null,
            modules: null,
            backend: null
        },
        // error access for: launch button && window
        mod:{ btn: void 0, wnd: void 0 },
        backendURL: '',
        // singletons
        User: void 0,
        // components namespaces
        view: { },
        model: { },
        store: { },
        // public methods
        sts: add_app_status,
        undefine: sub_app_undefine,
        create: sub_app_create,
        unload: sub_app_unload,
        reload: sub_app_reload_devel_view,
        getHelpAbstract: get_help_abstract,
        // other
        extjs_helper: extjs_load
    })
    return

function Ext_application(){
    Ext.application({
        name: 'App',
        appFolder: App.cfg.extjs.appFolder,
        enableQuickTips: true,// true by default but this is not loaded in 'lite'
        controllers:[ 'Main' ],// loads `App.controller.Main`
        launch: launchApp
    })
}

function Ext_Error_handle(err){
    con.warn(err)
    err && err.msg && Ext.Msg.show({
        title: l10n.errun_title,
        buttons: Ext.Msg.OK,
        icon: Ext.Msg.ERROR,
        msg: '<b>' +
err.msg.slice(0, 177) + '...</b><br><br>sourceClass: <b>' +
err.sourceClass + '</b><br>sourceMethod: <b>' +
err.sourceMethod + '</b>'
    })
    return true
}

function launchApp(){
var tmp

    con.log('Ext.application.launch: OK')
    // add first System Status message
    tmp = App.cfg.backend
    App.sts(tmp.op, tmp.msg, l10n.stsOK, tmp.time)
    tmp.op = tmp.msg = tmp.time = void 0// GC

    // createViewport
    if(App.cfg.extjs.fading){
        tmp = Ext.getBody()
        // very strange composition to get gears to fadeOut and viewport to fadeIn
        tmp.fadeOut({duration: 777 ,callback:
        function fadingViewport(){
            Ext.fly('startup').remove()
            tmp.show()
            Ext.create('App.view.Viewport')
            tmp.fadeIn({
                easing: 'easeIn',
                duration: 1024
            })
            tmp = void 0
        }
        })
    } else {
        Ext.fly('startup').remove()
        Ext.create('App.view.Viewport')
    }

    // catch possible errors once before events from `wes`
    if('developer.local' != App.User.can.__name &&
       'admin.local'      != App.User.can.__name){
        return
    }
    if(App.um && App.um.wes){
        check_uncaughtExceptions()
    } else {//check periodically without `wes`
        setInterval(check_uncaughtExceptions, 2048)
    }
}

function extjs_load(){
var path, extjs, el, f

    if(App.cfg.backend.url){// `nw` context`
        App.backendURL = 'http://127.0.0.1:' + App.cfg.backend.job_port
    }
    App.extjs_helper = void 0// GC
    extjs = App.cfg.extjs
    path = extjs.path

    // direct DOM loading of base CSS
    el = doc.createElement('link')
    el.setAttribute('rel', 'stylesheet')
    el.setAttribute('href', path + 'resources/css/ext-all.css')
    doc.head.appendChild(el)
    if(extjs.launch && extjs.launch.css){
        for(f = 0; f < extjs.launch.css.length; ++f){
            el = doc.createElement('link')
            el.setAttribute('rel', 'stylesheet')
            el.setAttribute('href', App.backendURL + extjs.launch.css[f])
            doc.head.appendChild(el)
        }
    }
    con.log('config.extjs.load: "' + extjs.load + '"')

    if(!w.Ext){// ExtJS is not available yet (this is not a fast loading)
        // main script file was checked by HEAD request
        el = doc.createElement('script')
        el.setAttribute('type', 'application/javascript')
        el.setAttribute('charset', 'utf-8')
        el.setAttribute('src', App.backendURL + extjs.load)// see `load_config_then_check_ExtJS()`
        doc.head.appendChild(el), el = void 0
        // thus load and wait
        f = setInterval(wait_and_setup_extjs, 128)
        con.log('extjs_load: done, waiting for ExtJS')
        return
    }
    con.log('extjs_load: done, fast load')
    wait_and_setup_extjs()
    return

    /* settting up ExtJS for the Application */
    function wait_and_setup_extjs(){
        if(!w.Ext) return

        f && clearInterval(f)

        if(App.backendURL){// `nw` context`
           /*
            * patch ExtJS Loader to work from "file://" in `nw.js`/`node-webkit`
            * `App.cfg.backend.url` has external IP (for remote HTTP)
            **/
            Ext.Loader._getPath = Ext.Loader.getPath
            Ext.Loader.getPath = function getPath(className){
            // load from `App.backendURL = '127.0.0.1'`
                return '/' == className[0] ?
                    App.backendURL + className + '.js' :
                    Ext.Loader._getPath(className)
            }
        }
        Ext.Error.handle = Ext_Error_handle;// by Ext.Error.raise()

        // NOTE: Ext JSON decoding is useful for JS-as-JSON with `l10n` in values
        (Ext.encode = JSON.stringify) && con.log(
            'ExtJS Ext.encode: always native `JSON.stringify()`'
        )
        Ext.Loader.setConfig({
            enabled: true,
            garbageCollect: !!App.cfg.extjs.loadMiniInit,// fast load mini || true,
            preserveScripts: !App.cfg.extjs.loadMiniInit,// fast load mini || false
            disableCaching: true,// don't change; backend parsing uses '?' in `qs`
            scriptCharset: 'utf8',
            paths:{
                'Ext.uxo': App.cfg.extjs.appFolder + '/uxo',// todo: fix overrides
                'Ext.ux': path + 'examples/ux',
                'App': App.cfg.extjs.appFolder
            }
        })
        con.log(
            'ExtJS version: ' + Ext.getVersion('extjs') + '\n ' +
            'ExtJS locale: ' + l10n.lang + '\n ' +
            'ExtJS is at <' + path + '>'
        )

        var i, tmp, js2load

       /*
        * l10n: Access existing data via e.g.:
        * > l10n.docOpenAll
        * When developing to have some placeholders and viewable content without
        * need to fill of the `l10n` files use call:
        * > l10n('create_season')
        * The namespace of a module can be selected by:
        * > l10n._ns = 'so'; 'code with l10n("stuff")'; l10n._ns = ''
        * > l10n.so.stuff
        **/
        tmp = l10n
        l10n = w.l10n = l10n_provider
        l10n._ns = ''
        Ext.apply(l10n, tmp)

        /* patch ExtJS by its own l10n file */
        tmp = path + 'locale/ext-lang-' + l10n.lang + '.js'
        Ext.Loader.loadScript({
            url: tmp,
            //onLoad:this loading is not tied to further code
            onError: function fail_load_locale(){
                throw new Error('Error loading locale file:\n' + tmp)
            }
        })

        /* continue loading of the Application's initial parts if any */
        js2load = App.cfg.extjs.launch.js
        if(App.cfg.extjs.loadMiniInit){
            // initial classes are concatinated into extjs file using external tools
            js2load.splice(0)// GC
            extjs_launch()// no need to load anything
            return
        }
        // load initial classes/files (just for login stage)
        js2load.unshift('App.backend.Connection')// `req`<->`res` with backend
        i = 0
        tmp = Ext.fly('startup').dom.lastChild
        loadInitScripts()
        return

        function loadInitScripts(){
        var file

            tmp.innerHTML += '<br>' + (file = js2load[i++])// show progress
            file = Ext.Loader.getPath(file)
            con.log(file)

            Ext.Loader.loadScript({
                url: file,
                onLoad: onLoad,
                onError: onError
            })
        }

        function onLoad(){
            if(i >= js2load.length){// all is done
                tmp = void 0
                js2load.splice(0)// GC
                return extjs_launch()
            }
            return loadInitScripts()
        }

        function onError(){
            con.error('Error loading a file required by configuration!')
            if(i >= js2load.length){// all is done
                tmp = void 0
                js2load.splice(0)// GC
                return extjs_launch()
            }
            return loadInitScripts()
        }
    }

    function extjs_launch(){
        con.log(
'_readyTime - _startTime: ' + (new Date().getTime() - _startTime) + '\n' +
'ExtJS + App launch: OK'
        )
       /*
        * NOTE: viewport is being created after successful login
        *       if auth app_module was loaded
        **/
        if(App.User){
            App.User.loginView(extjs_rest)
            return
        }
        // no auth app module configured
        App.User = { can: { }}// dummy auth object
        extjs_rest()
    }

    function extjs_rest(elp){// load per user modules (if any) create Viewport finally
    var defLoad, files, el, i

        con.log('Load the rest...')// load the rest of js and classes

        defLoad = [ ]

        if(App.cfg.extjs.loadMiniInit){// fast load mini
            defLoad.push(path + 'ext-rest-nw')// ->'/extjs/ext-rest-nw.js'
        } else defLoad.push(
            'App.proxy.CRUD',
            'App.model.Base',          // loading Models manually, then [M]VC
            'App.model.Status',
            'App.store.Status',
            'App.store.CRUD',          // our CRUD for `Ext.data.*`
            'App.view.Window',         // provide core View Class(es)
            'App.view.Viewport'        // provide view.Desktop with status
        )

        if(App.User.modules){// per user/role UI module setup
            if((files = App.User.modules.css)) for(i = 0; i < files.length; ++i){
                el = doc.createElement('link')
                el.setAttribute('rel', 'stylesheet')
                el.setAttribute('href', App.backendURL + files[i])
                doc.head.appendChild(el)
            }
            el = App.User.modules.js
            if(el && el.length){
                files = defLoad.concat(el)
                el.splice(0)// GC
            }
        }
        el = void 0
        if(files.length){
            i = 0
            loadRestScripts()
        } else {
            Ext_application()
        }
        return

        function loadRestScripts(elp){
        var file

            file = files[i++]
            elp && (elp.innerHTML = file)// show progress in passed in element
            file = Ext.Loader.getPath(file)
            con.log(file)

            Ext.Loader.loadScript({
                url: file,
                onLoad: onLoad,
                onError: onError
            })
        }

        function onLoad(){
            if(i >= files.length){// all is done
                el = void 0
                return Ext_application()
            }
            return loadRestScripts()
        }

        function onError(){
            con.error('Error loading a file required by configuration!')
            if(i >= files.length){// all is done
                el = void 0
                return Ext_application()
            }
            return loadRestScripts()
        }
    }
}// extjs_load

function l10n_provider(msg){
var me, m, idx, tail

    me = (me = l10n._ns) ? l10n[me] : l10n

    idx = msg.indexOf(':')

    if(idx > 0){
        tail = msg.slice(idx + 1)
        msg = msg.slice(0, idx)

        return me && (m = me[msg]) ?
               m + '<br><br><div style="color:red;">' + tail + '</div>' :
               msg
    }

    return me && (m = me[msg]) ? m : msg
}

function sub_app_undefine(className){
    Ext.undefine(className)
    if(Ext.Boot){// ExtJS 5
        Ext.Boot.scripts[w.location.protocol + '//' + w.location.host + '/' +
            Ext.Loader.getPath(className)] = void 0
    } else {// ExtJS 4
        Ext.Loader.isFileLoaded[Ext.Loader.getPath(className)] = void 0
        delete Ext.Loader.isClassFileLoaded[className]
    }
}

function sub_app_create(ns, btn, cfg){
/*
 * There are classes with run time development reloading for
 * - controllers (e.g. 'App.userman.Chat'),
 * - slow classes definitions (all requires are loaded on `App`):
 *     Ext.define('App.view.Chat',...)
 * - and fast class setup (config only, full require load by shortcut):
 *     App.cfg['CarTracker.app.Application'] = { // fast init
 *     }
 * NOTE: syntax errors are better checked by IDE/external tools before sub app
 *       create or reload, thus ExtJS will not crash inside some class init stage
 *       which may lead to page/framework reload
 **/
    btn && (App.mod.btn = btn).setLoading(true)

    if(!(~ns.indexOf('.app.'))){
        ns = 'App.' + ns// if class name from "App" (this) namespace

        if(btn){// normal load && launch via button (not dev reload)
            if(Ext.ClassManager.classes[ns]){
                return run_module()
            }
            return Ext.Loader.require(ns, continueLoading)// initial loading
        }
    }

    return continueLoading()

    function continueLoading(){
        if(~ns.indexOf('.controller.')){
            App.getApplication().getController(ns)
            btn && btn.setLoading(false)
            return
        }

        // define a Class *only* once
        // use `override` to redefine it (e.g. when developing) in run time
        if(App.cfg[ns]){
            btn || Ext.undefine(ns)// no button -- development reload
            Ext.define(ns, App.cfg[ns], run_module)
            App.cfg[ns] = null// GC
            return
            /* Noticed: multiple `Ext.define('some.view')` is fine from (re)loaded JS file */
        }

        Ext.Msg.show({
           title: l10n.errun_title,
           buttons: Ext.Msg.OK,
           icon: Ext.Msg.ERROR,
           msg:
"Can't do <b style='color:#FF0000'>`App.create('" + ns + "')`</b>!<br><br>" +
"<b>`App.create()` is only used with `App.cfg['Class.name']` definitions<br>" +
"in app modules for fast initial App loading.</b>"
        })
        btn && btn.setLoading(false)
        return
    }

    function run_module(){
        if(~ns.indexOf('.app.')){
            Ext.application(ns)
        } else if(~ns.indexOf('.controller.')){
            App.getApplication().getController(ns)
        } else {// usually plain views
            Ext.create(ns, cfg)
        }
        btn && btn.setLoading(false)
    }
}

function sub_app_unload(panel){
var ai
try {
    panel.destroy && panel.destroy()// models, stores and backend can be reloaded there
    if(panel.__ctl){// in case of failed init manual destroying of controller
        ai = App.getApplication()
        ai.eventbus.unlisten(panel.__ctl)
        ai.controllers.removeAtKey(panel.__ctl)
        App.undefine(panel.__ctl)
    }
    panel = panel.$className
    App.undefine(panel)
    // NOTE:
    // though this unload is full, if JS crash was inside some e.g. panel layouting,
    // then all subsequent panels will be broken in UI/DOM,
    // even if after reloading there will be no JS syntax or runtime errors
} catch(ex){ }
}

function sub_app_reload_devel_view(panel, tool, event){
var url, url_l10n, wmId

    if(!panel.wmId){
        con.warn(url = "window doesn't support development mode")
        Ext.Msg.show({
            title: l10n.errun_title,
            buttons: Ext.Msg.OK,
            icon: Ext.Msg.ERROR,
            msg: url
        })
        return
    }
    wmId = panel.wmId
    App.unload(panel)

    url_l10n = App.backendURL + '/l10n/' + wmId
              .replace(/([^.]+)[.].*$/, l10n.lang + '_$1.js')

    Ext.Loader.loadScript({
        url: url_l10n
       ,onLoad: function l10n_reloaded(){
            url = App.backendURL + '/' + wmId.replace(/[.]/g, '/') + '.js'
            Ext.Loader.loadScript({
                url: url
               ,onLoad: view_loaded
               ,onError: function(){
                    con.error('view was not loaded')
               }
            })
        }
       ,onError: function() {
            con.error('l10n was not loaded')
       }
    })

    return

    function view_loaded(){
    var cfg

        if((cfg = App.cfg['App.' + wmId]) && cfg.__noctl){
            ctl_not_loaded()
            return
        }
        Ext.Loader.loadScript({
            url: url = url.replace(/[/]view[/]/, '/controller/')
           ,onLoad: ctl_loaded
           ,onError: ctl_not_loaded
        })
    }
    function ctl_loaded(){
        App.create(wmId.replace(/view[.]/, 'controller.'))
    }
    function ctl_not_loaded(){
        App.create(wmId, null,{
            constrainTo: Ext.getCmp('desk').getEl()
        })
    }
}

function get_help_abstract(panel, tool, event){
    con.warn('abstract method')
}

//global status logger
function add_app_status(op, args, res, time){
    op = {
        created: time ? time : new Date,
        op: op, args: args, res: res
    }
    if(App.store.Status){
        App.store.Status.insert(0, new App.model.Status(op))
    } else {
        con.log('App.sts', op)
    }
}

function check_uncaughtExceptions(){
    App.backend.req('/uncaughtExceptions',{/* dummy hash to get JSON */},
    function(err, data){
        con.log('uncaughtExceptions err: ', err)
        if(data && data.length){
            con.table(data)
            Ext.Msg.alert({
                buttons: Ext.Msg.OK,
                icon: Ext.Msg.ERROR,
                title: 'uncaught@global on start',
                msg: Ext.encode(data).replace(/\\n/g, '<br>'),
                fn: function(btn){
                    con.log(btn)
                    //if('yes' == btn)...
                }
            })
        }
    })
}

})(document, window, l10n, window.console);
