/*
 * Authenticate a User using Login dialog
 *
 * @App.view.items_Bar: desktop shortcuts
 * @App.User: global user singleton
 * @App.um.view.Login: login dialog (with view-specific methods)
 * @controllerLogin: login logic; login modes/branches:
 *     1) initial page load and authentication; there is no backend session -> full
 *     2) page load; there is a backend session -> just button press
 *     3) when app is running backend restarts (session can be lost) -> relogin
 *     4) when more than one client tries to authenticates inside same session
 *        'conflict', status = 409, login is disabled
 */
;(function module_Login(App, l10n){

/* current l10n is required before view setup */
!l10n.um && Ext.syncRequire('/l10n/' + l10n.lang + '_um')

/*if(!l10n.um){// if not concatinated
 *    Ext.Loader.loadScript({// load l10n from root path
 *       url: '/l10n/' + l10n.lang + '_um',
 *       onError: function(){
 *           console.error('Error loading "/l10n/' + l10n.lang + '_um" file!')
 *       }
 *   })
 *}
**/

var callbackApp

/*
 *  setup top bar
 **/
App.view.items_Bar = Ext.Array.push(App.view.items_Bar || [ ],[
    '-'
    ,{
        iconCls: 'appbar-user-onli',// initial in backend by `App.um.wes()`
        id: 'um.usts'
       ,height: 28
       ,tooltip: '', text: ''// filled by controller after auth
       ,menu:{
            xtype: 'menu',
            plain: true,
            items:{
                xtype: 'buttongroup',
                title: l10n.userStatusMenu,
                columns: 1,
                items:(
    function mk_status_list(){
    var s = new Array(5) ,l = [ 'onli', 'away', 'busy', 'offl' ]

        for(var i = 0; i < 4; i++)  s[i] = {
            text: l10n.um.userStatuses[l[i]]
           ,itemId: l[i]
           ,width: '100%'
           //,icon: 'css/user-' +  l[i] + '.png'
           ,iconCls: 'appbar-user-' + l[i]
           ,handler: onStatusItemClick
        }
        s[i] = {
            text: l10n.um.users ,scale: 'large' ,iconCls: 'userman'
           ,handler:
            function open_userman_from_bar(){
            var tb
                // todo: make rbac check to do not show this at all
                if(!App.User.can['App.um.controller.Userman']) return App.denyMsg()

                if((tb = Ext.getCmp('wm').items.getByKey('um.view.Userman'))){
                    tb.toggle(true)//???? window activation
                } else {
                    App.create('um.controller.Userman')//XXX view creation
                }
                return this.up('button').hideMenu()
            }
        }

        return s

        function onStatusItemClick(item){
            item.up('button').setIconCls(item.iconCls).hideMenu()
            // send new 4-char status from 'appbar-user-????'
            Ext.globalEvents.fireEventArgs('usts@UI',[ item.iconCls.slice(12)])
        }
    }
                )()// buttongroup.items
            }// menu.items
        }// menu
    }// tbutton
    ,{
        iconCls: 'appbar-shutdown'
       ,height: 28 ,width: 28
       ,tooltip: l10n.um.shutdown
       ,handler: function(){
            Ext.globalEvents.fireEventArgs('logout')
        }
    }
])

// singleton controlling logic has one view and thus cached ui widgets
var view, user, role, pass, auth

/*
 * "The Model": auth user data singleton
 */

App.User = {
    can: null,// permissions; usage: `App.User.can['App.backend.JS'] && (run_that())`
    modules: null,// setup modules this role can use
    internalId: '',
    id: '',
    name: '',
    Roles: null,
    /* data methods */
    set: function(json){
    var me = App.User

        me.modules = json.modules
        me.can = json.can
        me.id = json.user.id
        me.name = json.user.name
        me.Roles = json.user.roles
    },
    reset: function (){
    var me = App.User

        me.can = me.modules = me.Roles = null
        me.internalId = me.id = me.name = ''
    },
    /* view launcher; real M - V - C in action */
    loginView: function(callback){
        view = new App.um.view.Login(callback)
    },
    /* request login one time; get current session and login info if exists */
    login: function login(newUserId, get_session_info){
        App.backend.req('/login', newUserId,{
            autoAbort: true,// multiple requests will cancel previouse one(s)
            callback: get_session_info// controller (i.e. caller) updates UI
        })
    },
    /* request authentication with provided requisits; setup `App.User` info */
    auth: function auth(user, role, pass, callback){
        App.backend.req('/auth',
            user + '\n' + role + '\n' + App.um.crypto.SHA1.hash(pass),
            function auth_cb(err, ret, res){
            var me = App.User, opt

                if(!err){
                    for(opt in ret.modules.extjs){// short and no auth cfg
                        App.cfg.modules[opt] = { extjs: ret.modules.extjs[opt]}
                    }
                    me.set(ret)
                }
                callback && callback(err, ret, res)// controller updates UI
            }
        )
    },
    logoutUI: logout,// switch for event handlers
    logout: logout
}

function logout(cb){
    App.backend.req('/logout', null, cb)
}

/*
 * "The View"
 */

var themeLogin = {
    width: 354,
    height: 304
}

Ext.define('App.um.view.Login',{
    extend: Ext.container.Container,
    xtype: 'app-login',
    id: 'login',
    layout: 'fit',
    constrain: true, floating: true,
    shadow: false,// mini: no extjs shadow, use CSS
    /* draggable: true, by 'login-dd' in constructor() */
    modal: false,
    form: null, dd: null,
    style: ''
+'opacity: 0; background-color: #FFFFFF;'
+'padding: 14px;'
+'width: ' + themeLogin.width + 'px; height: ' + themeLogin.height + 'px;'
+'box-shadow:0px 10px 20px #111;'
    ,items: [{
        xtype: 'component'
       ,style: 'width: 100%; height: 100%;'
       ,html:''
+'<div id="progress-bar"'
+'  style="background: url(css/progress-bar.gif) no-repeat center 33px;'
+'          opacity: 0;'
+'          text-align: center;'
+'          width: 100%;'
+'          height: 50px;">'

+'  <div style="text-shadow: #CCC 2px 3px 0;font: 2.2em serif; margin-bottom:22px;">'
+     l10n.um.auth
+'  </div>'
+'  <a href="/">' + l10n.reload + '</a>'
+'</div>'
+'<div id="login-view"'// background is in CSS (for correct and easy image path)
+'  style="position: relative; top: -50px; height: 244px;">'

+'  <div id="login-dd"'
+'    style="cursor: move; text-shadow: #CCC 2px 3px 0; font: 3em serif;">'
+     l10n.app
+'  </div>'
+   l10n.welcome

+'  <div id="login-form">'
+'  </div>'
+   l10n.um.loginInfo
+'  <br/><br/>&copy; 2014 olecom@gmail.com<br/>'
+'  <div id="l10n" style="background-color: #D3D3D3; padding-top: 4px; margin-top: 4px;">'
+'    &nbsp;<span class="ru">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>'
+'    &nbsp;<span class="en">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>'
+'    &nbsp;<span class="l10n-reset"><abbr title="' + l10n.um.l10nReset + '">&nbsp;&nbsp;&nbsp;</abbr></span>'
+'  </div>'
+'</div>'// login-view
    }],

    constructor: function constructorLogin(callback){
    var me = this, ddId
        //                           login      relogin
        me.callParent([callback ? void 0 : { modal: true }])
        /*
         * after initComponent()
         * Movable Container: make drag handler on top, not whole area
         * open code `Ext.panel.Panel.prototype.initSimpleDraggable.call(me)`
         */
        ddId = '#login-dd'
        me.dd = new Ext.util.ComponentDragger(me,{
            id: ddId.slice(1),
            el: me.el,
            constrain: me.constrain,
            constrainTo: me.constrainTo,
            delegate: ddId
        })
        me.relayEvents(me.dd,['dragstart', 'drag', 'dragend'])
        // ref. to function to be executed after login to finish `App` loading
        callbackApp = callback// if undefined do `relogin()` in `controllerLogin()`
        /* bind logic to the view */
        controllerLogin()
    },
    destroy: function(){
        Ext.destroy(this.dd, this.form)
        callbackApp = this.dd = this.form = void 0
        this.callParent()
    },
    /* methods */
    showUp: void 0,
    fadeOut: void 0,
    fadeInProgress: void 0,
    fadeOutProgress: void 0,

    initComponent: function initLoginView(){
    var me, form
       ,d = { duration: 1234, callback: void 0 }
       ,t = { duration: d.duration }
       ,a = { duration: t.duration, height: 99, callback: void 0 }

        view = me = this

        me.callParent()
        me.render(Ext.getBody())// 'cos `floating: true`

        me.showUp = function(){
            setTimeout(function(){// wait view layout a bit after form addition
                me.getEl().fadeIn(d)// the fancy show up
            }, 16)
        }
        /* view animating methods */
        me.fadeOut = function(cb){
            if(cb) d.callback = cb
            me.getEl().fadeOut(d)
            d.callback = void 0
        }

        me.fadeInProgress = function(cb){
            Ext.get('progress-bar').fadeIn(t)
            Ext.get('login-view').fadeOut(t)
            a.height = 99
            if(cb) a.callback = cb
            Ext.get('login').animate(a)
            a.callback = void 0
        }

        me.fadeOutProgress = function(cb){
            Ext.get('progress-bar').fadeOut(t)
            Ext.get('login-view').fadeIn(t)
            a.height = 297// <-> themeLogin.height
            if(cb) a.callback = cb
            Ext.get('login').animate(a)
            a.callback = void 0
        }
        /* [FAST LOAD]
         * optimized minimum to have form items in 'container'
         * it does NOT use basicForm, form panel, qtip, shadow
         **/
        form = me.form = Ext.widget({
            renderTo: 'login-form',
            xtype: 'container',// mini: no need of `basicForm`, `panel`, etc.
            width: '100%',
            margin: '20px 0 0 0',
            items:[{
                /* ExtJS 5 deprecated: 'Ext.form.field.Text'.triggers */
                xtype: 'triggerfield',
                triggerCls: 'login-shutdown',
                name: 'user',
                msgTarget: 'none',// mini: prevent default 'qtip'
                emptyText: l10n.um.loginUserBlank,
                width: 177,
                allowBlank: true,
                enableKeyEvents: true,
                hideTrigger: true
                //onTriggerClick: logic is in controller
            },{
                //the width of this field in the HBox layout is set directly
                //the other 2 items are given flex: 1, so will share the rest of the space
                xtype: 'combo',
                name: 'role',
                width: 177,
                queryMode: 'local',
                msgTarget: 'none',// mini: prevent default 'qtip'
                value: l10n.um.role,
                triggerAction: 'all',
                editable: false,
                displayField: 'role',
                valueField: '=',
                listConfig:{
                    shadow: false// mini: prevent default 'shadow'
                },
                store: Ext.create(Ext.data.Store,{
                    fields:[ 'role', '=' ]
                }),
                disabled: true
            },{
                xtype: 'textfield',
                name: 'pass',
                emptyText: '*******',
                width: 133,
                inputType: 'password',
                msgTarget: 'none',// mini: prevent default 'qtip'
                allowBlank: false,
                disabled: true
            },{
                xtype: 'button',
                width: 133,
                iconCls: 'ok',
                itemId: 'ok',
                text: l10n.um.loginOk,
                disabled: true
            }]
        })
        /* cached shortcuts to ui widgets */
        user = form.down('field[name=user]')
        role = form.down('field[name=role]')
        pass = form.down('field[name=pass]')
        auth = form.down('#ok')
    }
})

function controllerLogin(){
var login

    //if(!view){
    //    view = new App.um.view.Login
      //  login = true
    //} else {
      //  login = false// relogin
    //}

    view.el.select("#l10n > span").each(function l10n_changers(el){
        if(login){
            if(0 == el.dom.className.indexOf(l10n.lang)){
                el.dom.style.opacity = 0.5// fade out current flag
                el.dom.style.cursor = 'not-allowed'
            } else {
/* TODO: uninstall `l10n_set_and_change()` handler,
*        redo all with event delegate and no ExtJS put it into HTML spash */
                el.dom.onclick = l10nLangClick// install changer
            }
            return
        } else {// relogin: disable all
            el.dom.style.opacity = 0.5
            el.dom.style.cursor = 'not-allowed'
            return
        }
    })

    if(!callbackApp) return relogin()

    // data
    App.User.internalId = ''// reset to be used as User.id copy while offline
    // action
    user.disable()// mark to check existing session
    user.onTriggerClick = onSessionShutdownClick
    user.on({
        specialkey: gotoRoles,
        change: reqRole
    })
    role.on({
        change: enablePass
    })
    pass.on({
        specialkey: authenticate// one ENTER keypress auth in password
       ,change: enableAuth
    })
    auth.on({
        click: authenticate
    })
    /* only authenticated App has personal server events */
    Ext.globalEvents.on({
        'initwes@UI': handleInitBackendWaitEvents,
        'usts@UI': changeUserStatus,
        'wes4UI': backendEventsCtlLogin,
        logout: logoutCtl
    })// == analogous controller's sugar: `App.app.listen({ global:{`

    view.showUp()
    return App.User.login('?', getSessionInfo)// ask backend is a session there?
}

function l10nLangClick(){
    if('l10n-reset' !== this.className){
        localStorage.l10n = this.className.slice(0, 2)// first two
        reload()
        return
    }

    if(localStorage.l10n){
        delete localStorage.l10n
        Ext.Msg.alert({
            icon: Ext.Msg.INFO,
            buttons: Ext.Msg.OK,
            title: l10n.um.l10n,
            msg: l10n.um.l10nReset,
            callback: reload
        })
    }
}

function getSessionInfo(err, ret){
    if(err) return

    user.enable()// mark as ready
    user.focus()
    if(ret.can){
        App.User.set(ret)

        user.emptyText = ret.user.id
        user.applyEmptyText()
        user.setHideTrigger(false)

        role.suspendEvents()// prevent e.g. pass.enable()
        role.setValue(l10n.um.roles[ret.can.__name] || ret.can.__name)
        role.resumeEvents()
        if('developer.local' == ret.can.__name){//!!!devel helper
            console.log('[supro devel] fast pass for existing session')
            authenticate()// fast pass in
            return
        }
        auth.setText(l10n.um.loginCurrentSession)
        auth.enable()// auth is ok in this session
        auth.focus()// wait user to click
    }
}

// auth data actions
function onSessionShutdownClick(ev){
    App.User.logout()
    ev && Ext.Msg.alert({
        icon: Ext.Msg.INFO,
        buttons: Ext.Msg.OK,
        title: l10n.um.logoutTitle,
        msg: l10n.um.logoutMsg(App.User.name, App.User.can.__name, true),
        fn: function(){
            user.focus()
        }
    })
    App.User.reset()
    // disable auth first, thus no event can trigger auth
    auth.disable()
    auth.setText(l10n.um.loginOk)
    user.emptyText = l10n.um.loginUserBlank
    user.reset()
    user.setHideTrigger(true)
    role.store.removeAll(true)
    role.reset()
}

function reqRole(field, newUserId){
var defer

    if(defer) clearTimeout(defer)

    if(newUserId){
        if(!auth.disabled && newUserId != user.emptyText){
            onSessionShutdownClick()
        }
        defer = setTimeout(function deferReqRoles(){
            defer = 0
            if(!role.eventsSuspended) role.suspendEvents()
            role.reset()
            App.User.login(newUserId, function getSessionInfo(err, ret){
                if(err) return

                if(ret.can){
                    view.fadeOut(finishAuth)
                    return// auth is ok in this session
                }

                if(!ret.roles.length){// no user or roles
                    if(!role.disabled){// if UI has something already
                        auth.disable()
                        role.store.removeAll(true)
                        role.reset()
                        role.disable()
                        pass.reset()
                        pass.disable()
                    }
                    return
                }
                var models = new Array(ret.roles.length)
                   ,Role = role.store.model
                   ,i = 0, r

                for(; i < ret.roles.length; i++){
                    r = ret.roles[i]
                    models[i] = new Role({
                        role: l10n.um.roles[r] || r,
                        '=': r
                    })
                }
                role.store.loadRecords(models, false)
                role.resumeEvents()
                if(role.disabled){
                    role.enable()
                }
            })
        }, 512)
        return
    }
    if(!role.disabled){// empty user id
        auth.disable()
        role.store.removeAll(true)
        role.reset()
        role.disable()
        pass.reset()
        pass.disable()
    }
}

function authenticate(field, ev){
    if(ev && 'keydown' == ev.type && ev.getKey() != ev.ENTER) return

    // prevent session activation and stall on sudden page reload/crash
    /* NOTE: there is no way to match reload or window/tab close
     *       in the browser.
     *       Thus session is lost and relogin is required. But
     *       this can be automated by userscripts.
     *       In Chrome `Ext.EventManager.onWindowUnload()` works.
     *
     * nw.js/node-webkit: session is destroyed only on window `close`
     **/
    Ext.EventManager.onWindowUnload(doLogout)// `browser`
    if(App.backendURL){// `nw`
        App.w.on('close', function nw_close(){
            App.User.logoutUI()
            this.close(true)
        })
    }

    if(field){// from button call arguments: `field, ev`
        auth.eventsSuspended = 1// prevent multiple auth calls to backend
        auth.focus()
        view.fadeInProgress(doAuth)
    } else {// from direct call
        App.cfg.extjs.fading = false
        doAuth()// fast `developer.local`
    }
}

function doLogout(){
    App.User.logoutUI()
}

function doAuth(){
    App.User.auth(
        user.getValue(),
        role.getValue(),
        pass.getValue(),
        callbackAuth
    )
}

function callbackAuth(err, json, res){
    if(!err){
        return view.fadeOut(finishAuth)
    } else {
        App.User.logoutUI = Ext.emptyFn// prevent shutdown
        // reload if no session (e.g. backend reloaded)
        if(res.status && 402 === res.status) location.reload(true)
        if(res.status && 409 === res.status){// race inside session
            auth.setText(l10n.um.loginConflict)
            auth.disable()
            role.disable()
            pass.disable()
            user.disable()
            user.setHideTrigger(true)
            user.addCls('redwhite')
        } else {// continue (e.g. wrong password)
            auth.eventsSuspended = 0
            user.selectText()
        }
        return view.fadeOutProgress()
    }
}

function finishAuth(){
var bar = App.view.items_Bar, i, f

    callbackApp()// continue App start/loading

    destroy()// Login is done

    for(i = 0; i < bar.length; ++i){// search user status item
        f = bar[i]
        if('um.usts' == f.id){
            f.tooltip = l10n.um.userStatus + ':<br><b>' + App.User.id + '</b>'
            f.text = (
                '<i>' + App.User.name + '</i> (<b>' + App.User.can.__name + '</b>)'
            )
            break
        }
    }
    //!!! do not apply shutdown for now !!!
    App.User.logoutUI = Ext.emptyFn
}

function gotoRoles(_, ev){
var key = ev.getKey()

    if(key == ev.ENTER || key == ev.DOWN || key == ev.RIGHT){
        if(role.disabled){
            auth.focus()
        } else {
            role.focus().expand()
                setTimeout(function(){
            role.picker.highlightItem(role.picker.getNode(0));
                }, 32)
        }
    }
}

function enablePass(_, value){
    pass.enable()
        setTimeout(function(){
    pass.focus()}, 256)// defer focus after combo is collapsed
}

function enableAuth(_, value){
    value ? auth.enable() : auth.disable()
}

function relogin(){
    user.onTriggerClick = destroy
    user.emptyText = App.User.id.replace(/....([^ ]+) .*/, '$1')
    user.applyEmptyText()
    user.enable()
    user.setHideTrigger(false)

    role.setValue(l10n.um.roles[App.User.can.__name] || App.User.can.__name)

    // one ENTER keypress auth in password
    pass.on({ specialkey: reloginUser, change: enableAuth })
    auth.on({ click: reloginUser })
    enablePass()
    Ext.WindowManager.bringToFront(view)
    view.showUp()
}

function reloginUser(_, ev){
    if(ev && 'keydown' == ev.type && ev.getKey() != ev.ENTER) return

    auth.eventsSuspended = 1// prevent multiple auth calls to backend
    auth.focus()
    view.fadeInProgress(function reloginTry(){
    App.User.login(App.User.id, function(err, ret){
        enablePass()// focus pass after failed login
        return err ? setTimeout(reloginTry, 1024) :// if backend isn't ready yet
    App.User.auth(// get user 'offldev@::ffff:127.0.0.1 lhY1caqLsTBYirLR9EJMRFji'
        App.User.id.slice(4, App.User.id.indexOf('@')),// user == 'dev'
        App.User.can.__name,
        pass.getValue(), function(err, json, res){
            if(err){
                if(res.status && 402 === res.status){
                    App.denyMsg()
                } else if(res.status && 409 === res.status){
                    auth.disable()
                    auth.setText(l10n.um.loginConflict)
                    user.setHideTrigger(false)
                    role.disable()
                    pass.disable()
                }
                auth.eventsSuspended = 0
                return view.fadeOutProgress()
            }

    App.um.wes(App.User.internalId.slice(0,4))// saved status
    return view.fadeOut(destroy)
        }
    )})})
}

function destroy(){
/* in case of logout event from backend, this
 * `App.um.view.Login` is shown again without reloading of all Viewport
 * TODO: uninstall `l10n_set_and_change()` handler,
 *        redo all with event delegate and no ExtJS put it into HTML spash
 */
    view = view.destroy()// assign `undefined` to `view` for GC
}

/*
 * Application wide event handlers
 **/
function backendEventsCtlLogin(success, data){
var evn, cmp, s

    App.sts(
       'backend events',
        success ? data.length : data,// data || res.statusText
        success ? l10n.stsOK : l10n.stsHE,
        s = new Date
    )

    console.log('wes: ' + s)
    console.log(data)
    console.table(data)

    if('string' == typeof data) switch (data){// simple event
        case 'Disconnect':
        case 'Unauthorized':
        case 'Payment Required':
            if(view) return// event is firing again (still no login)

            (cmp = Ext.getCmp('um.usts')) && cmp.setIconCls('appbar-user-offl')
            view = new App.um.view.Login
        return
        default:return
    }

    for(evn = 0; evn < data.length; ++evn) switch (data[evn].ev){
        case 'Usts@um': if((cmp = Ext.getCmp('um.usts'))){
            if(cmp.iconCls.slice(12) != (s = data[evn].json.slice(0, 4))){
                cmp.setIconCls('appbar-user-' + s)
            }
        }
        break
        case 'uncaught@global':
            if(App.User.can['uncaught@global'] && Ext.Msg.hidden) Ext.Msg.alert(
                {
                    buttons: Ext.Msg.OK,
                    icon: Ext.Msg.ERROR,
                    title: 'uncaught@global',
                    msg: data[evn].json,
                    fn: function(btn){
                        //if('yes' == btn)...
                    }
                }
            )
        break
        case 'Disconnect':
            (cmp = Ext.getCmp('um.usts')) && cmp.setIconCls('appbar-user-offl')
        break
        case 'Unauthorized':
            view && view.destroy()
            view = new App.um.view.Login({ modal: true })
            Ext.WindowManager.bringToFront(view)
            //App.app.getController(App.um.controller.Login)
        break
        default:break
    }
}

function handleInitBackendWaitEvents(msg){
    App.sts(
        msg,
       'init backend Wait EventS',
        l10n.stsOK,
        new Date
    )
}

function changeUserStatus(status){
    App.um.wes(status)
}

function logoutCtl(){
    Ext.Msg.alert({
        buttons: Ext.Msg.YESNO,
        icon: Ext.Msg.QUESTION,
        title: l10n.um.logoutTitle,
        msg: l10n.um.logoutMsg(
            App.User.name,
            l10n.um.roles[App.User.can.__name] || App.User.can.__name
        ),
        fn: function(btn){
            if('yes' == btn){
                App.app && App.app.suspendEvents(false)
                Ext.globalEvents.suspendEvents(false)
                App.User.logout(reload)
            }
        }
    })
}

function reload(){
    location.reload(true)
}

App.denyMsg = function denyMsg(){
    Ext.Msg.alert({
        icon: Ext.Msg.WARNING,
        buttons: Ext.Msg.OK,
        title: l10n.um.auth,
        msg: l10n.um.deny,
        fn: function(){ }
    })
}

})(App, l10n);
