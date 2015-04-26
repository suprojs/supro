/*
 * common part for `nw` && `connectjs` front ends
 */

var App // one global Application variable / namespace

(function gc_wrapper(doc, w, con){
    App = {
        cfg: null,
        mod:{ btn: void 0, wnd: void 0 },// error access for: launch button && window
        backendURL: '',

        sts: void 0,//add_app_status
        undefine: void 0,// sub_app_undefine
        create: void 0,// sub_app_create
        unload: void 0,// sub_app_unload
        reload: void 0,// sub_app_reload_devel_view
        getHelpAbstract: void 0,// get_help_abstract

        extjs_helper: extjs_load_gc_wrapped
    }
    return

/* init stuff must be garbage collected */

function extjs_load_gc_wrapped(){
var path, extjs, t

    extjs = App.cfg.extjs
    path = extjs.path
    css_load(path + 'resources/css/ext-all.css')

    if(extjs.launch && extjs.launch.css){
        for(t = 0; t < extjs.launch.css.length; ++t){
            css_load(extjs.launch.css[t], App.cfg.backend.url)
        }
    }

    extjs = doc.createElement('script')
    extjs.setAttribute('type', 'application/javascript')
    extjs.setAttribute('charset', 'utf-8')
    extjs.setAttribute('src', path + 'ext-all-nw.js')//`loadScriptFile()` fixed
    doc.head.appendChild(extjs)

    extjs = setInterval(function waiting_extjs(){
        if(!w.Ext) return// waiting if xhr HEAD check is done

        clearInterval(extjs)
        App.extjs_helper = css_load

        extjs = path + 'locale/ext-lang-' + l10n.lang + '.js'
        Ext.Loader.setConfig({
            enabled: true,
            garbageCollect: true,
            preserveScripts: false,
            scriptCharset: 'utf8',
            paths: {
                'Ext.ux': path + 'examples/ux'
            }
        })
        Ext.Loader.loadScript({
            url: extjs,
            onError: function fail_load_locale(){
                throw new Error('Error loading locale file:\n' + extjs)
            }
        })
        con.log(
            'ExtJS version: ' + Ext.getVersion('extjs') + '\n ' +
            'ExtJS locale: ' + l10n.lang + '\n ' +
            'ExtJS is at <' + path + '>'
        )

        if(App.cfg.backend.url){// `nw` context`
            App.backendURL = 'http://127.0.0.1:' + App.cfg.backend.job_port

           /* patch ExtJS Loader to work from "file://" in `nw.js`/`node-webkit`
            * also `debugSourceURL` removed in `ext-all-debug.js#loadScriptFile()`
            * it crushes `eval` there it's critical (plus there are more patches)
            *
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

        Ext.application({
            name: 'App',
            appFolder: App.cfg.extjs.appFolder || '.',
            controllers:[ 'Main' ],// loads App.controller.Main
            launch: extjs_launch
        })

        return
    }, 1024)
    con.log('extjs_load: done, waiting for ExtJS')

    return
}

function css_load(url, backend){
var el = doc.createElement('link')

    el.setAttribute('rel', 'stylesheet')
    el.setAttribute('href', (backend || '') + url)
    doc.head.appendChild(el)
    el = null
}

function extjs_launch(){
var t

    App.sts = add_app_status
    App.undefine = sub_app_undefine
    App.create = sub_app_create
    App.unload = sub_app_unload
    App.reload = sub_app_reload_devel_view
    App.getHelpAbstract = get_help_abstract

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
    t = l10n
    l10n = l10n_provider
    l10n._ns = ''
    Ext.apply(l10n, t)

    // NOTE: Ext JSON decoding is useful for JS-as-JSON with `l10n` in values
    con.log('ExtJS Ext.encode: always native `JSON.stringify()`')
    Ext.encode = JSON.stringify
    Ext.Error.handle = Ext_Error_handle// by Ext.Error.raise()

    Ext.state.Manager.setProvider(new Ext.state.LocalStorageProvider)
    // Start loading The Application
    Ext.Loader.setPath('Ext.uxo', App.app.appFolder + '/uxo')

    t = Ext.Array.push([
        'App.backend.Connection',  // `req`<->`res` with backend
        'App.model.Base',          // loading Models manually, then [M]VC
        'App.model.Status',
        'App.store.Status',
        'App.store.CRUD',          // our CRUD for `Ext.data.*`
        'App.view.Window',         // provide core View Class(es)
        'App.view.Viewport'        // provide view.Desktop with status
    ], App.cfg.extjs.launch.js || [ ])// more stuff from backend, if exists
    // create shorter ref. for extjs/ui config options of all app modules
    App.cfg.modules = App.cfg.extjs.modules

    var j, i = 0, l = Ext.fly('startup').dom.lastChild

    do {
        l.innerHTML += '<br>' + (j = t[i])// show progress
        Ext.Loader.syncRequire(j)
    } while(++i < t.length)

    if(false !== App.cfg.createViewport){// if no auth app_module
        App.User = { can: { }}// dummy auth object
        App.extjs_helper = null// mark for GC
        Ext.globalEvents.fireEvent('createViewport')
    }// else userman's: `App.um.controller.Login->createViewportAuth()`

    con.log('ExtJS + App launch: OK')
}

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
        Ext.Boot.scripts[window.location.protocol + '//' + window.location.host + '/' +
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
                    console.error('view was not loaded')
               }
            })
        }
       ,onError: function() {
            console.error('l10n was not loaded')
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

function Ext_Error_handle(err){
    Ext.Msg.show({
        title: l10n.errun_title,
        buttons: Ext.Msg.OK,
        icon: Ext.Msg.ERROR,
        msg: '<b>' +
err.msg.slice(0, 177) + '...</b><br><br>sourceClass: <b>' +
err.sourceClass + '</b><br>sourceMethod: <b>' +
err.sourceMethod + '</b>'
    })
    return !con.warn(err)
}

function add_app_status(op, args, res, time){//global status logger
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

})(document, window, window.console)
