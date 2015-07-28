// ==UserScript==
// @name            development auto auth for supro
// @author          olecom
// @namespace       supro
// @description     supro userman app module auto auth; setup: localStorage['supro.user' || 'supro.role' || 'supro.pass']; defaults `olecom:developer.local:pass`
// @match           http://localhost:3007/*
// @version         0.5
// ==/UserScript==

(function gc_setup(document){
function supro_auth(w, localStorage, con){
var username = localStorage['supro.user'] || 'dev'
   ,userrole = localStorage['supro.role'] || 'developer.local'
   ,password = localStorage['supro.pass'] || 'pass'
   ,pref = '[supro devel] '

var loop

    loop = setInterval(
    function check_extjs(){
    var user, auth

        if(!w.Ext) return
        if(!w.App) return
        if(!w.App.view) return
        if(!w.App.um || !w.App.um.view || !Ext.get('login-form')) return

        clearInterval(loop), loop = void 0
        user = Ext.ComponentQuery.query('#login-form > field[name=user]')[0]
        auth = Ext.ComponentQuery.query('#login-form > button[iconCls=ok]')[0]

con.log(pref + 'auto auth start (to stop disable this userscript e.g. in `chrome://extensions/`)')

        if(auth.text === l10n.um.loginCurrentSession){
con.log(pref + 'session exists')
            auth.getEl().dom.click()
con.log(pref + 'wait for backend reload and thus relogin')
            setTimeout(function(){
                loop = setInterval(check_extjs, 4096)
            }, 4096)
            return
        }
        if(user.emptyText === l10n.um.loginUserBlank){
            user.setValue(username)
        }
        setTimeout(function wait_role_asking(){
        var role, pass

            if(!Ext.get('login-form')) return
            role = Ext.ComponentQuery.query('#login-form > field[name=role]')[0]
            pass = Ext.ComponentQuery.query('#login-form > field[name=pass]')[0]

            if(!role.disabled){
con.log(pref + 'auto auth set role')
                role.setValue(userrole)
            }
con.log(pref + 'auto auth set pass')
            pass.setValue(password)
            auth.getEl().dom.click()
con.log(pref + 'wait for backend reload and thus relogin')
            setTimeout(function(){
                loop = setInterval(check_extjs, 4096)
            }, 4096)
        }, 1024)// localhost must be fast
    }, 2048)// wait for session check
}

/* run script from site's scope, not here in userscript's sandbox */
var script = document.createElement('script')

script.appendChild(
    document.createTextNode(
        '('+ supro_auth.toString() + ')(window, localStorage, console)'
    )
)

document.head.appendChild(script)
})(document)
