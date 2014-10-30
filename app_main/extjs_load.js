/*
 * common part for `nw` && `connectjs` front ends
 */

var app// FIXME: check if this can be just `App`, one global var is needed

(function gc_wrapper(doc, w, con){
    app = {
        config: null,
        btn: null,// quick launch buttons to access when error
        extjs_helper: extjs_load_gc_wrapped
    }
    return

/* init stuff must be garbage collected */

function extjs_load_gc_wrapped(){
var path, extjs, t

    extjs = app.config.extjs
    path = extjs.path
    css_load(path + 'resources/css/ext-all.css')

    if(extjs.launch && extjs.launch.css){
        for(t = 0; t < extjs.launch.css.length; ++t){
            css_load(extjs.launch.css[t], app.config.backend.url)
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
        app.extjs_helper = css_load
        extjs = path + 'locale/ext-lang-' + l10n.lang + '.js'
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
        Ext.Loader.setPath('Ext.ux', path + 'examples/ux')

        if(app.config.backend.url){// `nw` context`
           /* patch ExtJS Loader to work from "file://" in `node-webkit`
            * also `debugSourceURL` removed in `ext-all-debug.js#loadScriptFile()`
            * it crushes `eval` there it's critical (plus there are more patches)
            *
            * `app.config.backend.url` has external IP (for remote HTTP)
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
            appFolder: app.config.extjs.appFolder || '.',
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

    // global `App` object is available now
    if(app.backend_check){
        App.doCheckBackend = app.backend_check
        App.doRestartBackend = app.backend_restart
        App.doTerminateBackend = app.backend_terminate
        App.doShutdownBackend = app.backend_shutdown

        delete app.backend_check
        delete app.backend_restart
        delete app.backend_terminate
        delete app.backend_shutdown
    }
    App.cfg = app.config
    App.backendURL = App.cfg.backend.url ?
                    'http://127.0.0.1:' + App.cfg.backend.job_port : ''
    App.create = sub_app_create
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
        'App.model.Base',          // loading Models manually, then [M]VC
        'App.backend.Connection',  // `req`<->`res` with backend
        'App.store.CRUD',          // our CRUD for `Ext.data.*`
        'App.view.Window',         // provide core View Class(es)
        'App.view.Viewport',
        'App.view.desktop.Status'  // provide status
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
        app.extjs_helper = null// mark for GC
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

function sub_app_create(ns, btn, cfg){
/*
 * There are classes with run time development reloading for
 * - controllers (e.g. 'App.userman.Chat'),
 * - slow classes definitions (all requires are loaded on `App`):
 *     Ext.define('App.view.Chat',...)
 * - and fast class setup (config only, full require load by shortcut):
 *     App.cfg['CarTracker.app.Application'] = { // fast init
 *     }
 **/
    btn && (app.btn = btn).setLoading(true)

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

function sub_app_reload_devel_view(panel, tool, event){
var url, url_l10n

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

    panel.destroy()// models, stores and backend can be reloaded there

    url_l10n = App.backendURL + '/l10n/' + panel.wmId
              .replace(/([^.]+)[.].*$/, l10n.lang + '_$1.js')

    Ext.Loader.loadScript({
        url: url_l10n
       ,onLoad: function l10n_reloaded(){
            Ext.Loader.removeScriptElement(url_l10n)
            url = App.backendURL + '/' + panel.wmId.replace(/[.]/g, '/') + '.js'
            Ext.Loader.loadScript({
                url: url
               ,onLoad: view_loaded
            })
        }
    })

    return

    function view_loaded(){
        Ext.Loader.removeScriptElement(url)

        if((url_l10n = App.cfg['App.' + panel.wmId]) && url_l10n.__noctl){
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
        Ext.Loader.removeScriptElement(url)
        App.create(panel.wmId.replace(/view[.]/, 'controller.'))
    }
    function ctl_not_loaded(){
        Ext.Loader.removeScriptElement(url)
        App.create(panel.wmId, null,{
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

})(document, window, window.console)
