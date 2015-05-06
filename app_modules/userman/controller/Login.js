(function gc_controller_Login(l10n){
// is done under M V C pattern
Ext.define('App.um.controller.Login',{
    extend: Ext.app.Controller,

    init: function controllerLoginInit(){
    var user, role, pass, auth
       ,me = this, defer

        if(!App.um.view.Login){
            App.um.view.Login = new App.um.view.LoginWindow
            defer = 0// login
        } else {
            defer = 1// relogin
        }

        App.um.view.Login.el.select("#l10n > span").each(function l10n_changers(el){
            if(!defer){// login
                if(0 == el.dom.className.indexOf(l10n.lang)){
                    el.dom.style.opacity = 0.5// fade out current flag
                    el.dom.style.cursor = 'not-allowed'
                } else {
                    el.dom.onclick = l10n_set_and_change// install changer
                }
                return
            } else {// relogin: disable all
                el.dom.style.opacity = 0.5
                el.dom.style.cursor = 'not-allowed'
                return
            }
        })

        if(defer) return me.relogin()

        App.cfg.createViewport = false// tell `Main`, me will fire `createViewport`
        // UI refs
        user = App.um.view.Login.user
        role = App.um.view.Login.role
        pass = App.um.view.Login.pass
        auth = App.um.view.Login.auth
        // data
        App.User = App.um.model.User// must be required first from app module
        App.User.internalId = ''// reset to be used as User.id copy while offline
        // action
        user.disable()// mark to check existing session
        user.onTriggerClick = onSessionShutdownClick
        user.on({
            /* using `ref`s, but this is equivalent to:
                this.listen component:{
                     'field[name=user]':{
                        specialkey: gotoRoles
                }
             * or *
                this.control({
                    'field[name=user]':{
                        specialkey: gotoRoles
                }
             */
            specialkey: gotoRoles,
            change: reqRole
        })
        role.on({
            change: me.enablePass
        })
        pass.on({
            specialkey: authenticate// one ENTER keypress auth in password
           ,change: me.enableAuth
        })
        auth.on({
            click: authenticate
        })

        App.app.listen({// bind to the Application controller as this one
            global:{    // is destroyed after Login
                'initwes@UI': handleInitBackendWaitEvents,
                'usts@UI': changeUserStatus,
                'wes4UI': backendEventsCtlLogin,
                logout: logout
            }
        })

        return App.User.login('?', getSessionInfo)// ask backend for current session

        function l10n_set_and_change(){
            if('l10n-reset' == this.className){
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
                return
            }
            localStorage.l10n = this.className.slice(0, 2)// first two
            reload()
        }

        function getSessionInfo(err, ret){
            if(err) return

            user.enable()// mark as ready
            user.focus()
            if(ret.can){
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
                auth.focus()
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
            // disable auth first, thus no event can trigger auth
            auth.disable()
            auth.setText(l10n.um.loginOk)
            user.emptyText = l10n.um.loginUserBlank
            user.reset()
            user.focus()
            user.setHideTrigger(true)
            role.store.removeAll(true)
            role.reset()
        }

        function reqRole(field, newUserId){
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
                            App.um.view.Login.fadeOut(createViewportAuth)
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
             * node-webkit: session is destroyed only on window `close`
             **/
            Ext.EventManager.onWindowUnload(do_logout)// `browser`
            if(App.backendURL){// `nw`
                App.w.on('close', function nw_close(){
                    App.User.logoutUI()
                    this.close(true)
                })
            }

            if(field){// from button call arguments: `field, ev`
                auth.eventsSuspended = 1// prevent multiple auth calls to backend
                auth.focus()
                App.um.view.Login.fadeInProgress(do_auth)
            } else {// from direct call
                App.cfg.extjs.fading = false
                do_auth()// fast `developer.local`
            }

            return

            function do_logout(){
                App.User.logoutUI()
            }

            function do_auth(){
                App.User.auth(
                    user.getValue(),
                    role.getValue(),
                    pass.getValue(),
                    callbackAuth
                )
            }
            function callbackAuth(err, json, res){
                if(!err){
                    return App.um.view.Login.fadeOut(createViewportAuth)
                } else {
                    App.User.logoutUI = Ext.emptyFn// prevent shutdown
                    // reload if no session (e.g. backend reloaded)
                    if(res.status && 402 === res.status) location.reload(true)
                    if(res.status && 409 === res.status){// race inside session
                        auth.disable()
                        auth.setText(l10n.um.loginConflict)
                        user.setHideTrigger(true)
                        user.addCls('redwhite')
                        user.disable()
                        role.disable()
                        pass.disable()
                    } else {// continue (e.g. wrong password)
                        user.selectText()
                        auth.eventsSuspended = 0
                    }
                    return App.um.view.Login.fadeOutProgress()
                }
            }
        }
        function createViewportAuth(){
        var bar = App.view.items_Bar, i = 0, f

            me.destroy()// Login is done

            for(i = 0; i < bar.length; ++i){// search user status item
                f = bar[i]
                if('um.usts' == f.id){
                    f.tooltip = l10n.um.userStatus + ':<br><b>' + App.User.get('id') + '</b>'
                    f.text = (
                        '<i>' +
                            App.User.get('name') +
                        '</i> (<b>' + App.User.can.__name + '</b>)'
                    )
                    break
                }
            }
            if(App.User.modules){// per user/role UI module setup
                if((f = App.User.modules.css)) for(i = 0; i < f.length; ++i){
                    App.extjs_helper(f[i], App.backendURL)// css loading
                }
                App.extjs_helper = void 0// mark for GC
                Ext.syncRequire(App.User.modules.js)
            }

            Ext.globalEvents.fireEvent('createViewport')
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
    },
    enablePass: function(_, value){
    var pass = App.um.view.Login.pass

        pass.enable()
            setTimeout(function(){
        pass.focus()}, 256)// defer focus after combo is collapsed
    },
    enableAuth: function(_, value){
    var auth = App.um.view.Login.auth

        value ? auth.enable() : auth.disable()
    },
    relogin: function relogin(){
    var user, role, pass, auth
       ,me = this

        user = App.um.view.Login.user
        role = App.um.view.Login.role
        pass = App.um.view.Login.pass
        auth = App.um.view.Login.auth

        user.onTriggerClick = destroy
        user.emptyText = App.User.id.replace(/....([^ ]+) .*/,'$1')
        user.applyEmptyText()
        user.enable()
        user.setHideTrigger(false)

        role.setValue(l10n.um.roles[App.User.can.__name] || App.User.can.__name)
        role.disable()
        // one ENTER keypress auth in password
        pass.on({ specialkey: reloaginUser, change: me.enableAuth })
        auth.on({ click: reloaginUser })
        me.enablePass()

        return

        function reloaginUser(_, ev){
            if(ev && 'keydown' == ev.type && ev.getKey() != ev.ENTER) return

            auth.eventsSuspended = 1// prevent multiple auth calls to backend
            auth.focus()
            App.um.view.Login.fadeInProgress(function(){
            App.User.login(App.User.get('id'), function(err, ret){
                me.enablePass()// focus pass after failed login
                if(err) return
            App.User.auth(
                App.User.get('id'),
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
                        return App.um.view.Login.fadeOutProgress()
                    }

            App.um.wes(App.User.internalId.slice(0,4))// saved status
            return App.um.view.Login.fadeOut(destroy)
                }
            )})})
        }

        function destroy(){
            me.destroy()
        }
    },
    destroy: function destroy(){
    /* in case of logout event from backend, this
     * `App.um.view.Login` is shown again without reloading of all Viewport
     * TODO: uninstall `l10n_set_and_change()` handler,
     *        redo all with event delegate and no ExtJS put it into HTML spash
     */
        App.um.view.Login.destroy()
        App.um.view.Login = null// GC
        this.application.eventbus.unlisten(this.id)
        this.application.controllers.removeAtKey(this.id)
    }
})

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
            if(App.um.view.Login) return// event is firing again (still no login)

            (cmp = Ext.getCmp('um.usts')) && cmp.setIconCls('appbar-user-offl')
            App.um.view.Login = new App.um.view.LoginWindow({ modal: true })
            Ext.WindowManager.bringToFront(App.um.view.Login)
            App.app.getController('App.um.controller.Login')// only strings
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

            App.um.view.Login = new App.um.view.LoginWindow({ modal: true })
            Ext.WindowManager.bringToFront(App.um.view.Login)
            App.app.getController(App.um.controller.Login)

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

function logout(){
    App.app.suspendEvents(false)

    Ext.Msg.alert({
        buttons: Ext.Msg.YESNO,
        icon: Ext.Msg.QUESTION,
        title: l10n.um.logoutTitle,
        msg: l10n.um.logoutMsg(
            App.um.model.User.get('id'),
            l10n.um.roles[App.User.can.__name] || App.User.can.__name
        ),
        fn: function(btn){
            if('yes' == btn) App.User.logout(reload)
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

App.app.getController('App.um.controller.Login')/* init */

})(l10n)
