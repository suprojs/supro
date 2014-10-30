Ext.syncRequire('/l10n/' + l10n.lang + '_um')// require l10n from model

Ext.define('App.um.model.User',{
    extend: Ext.data.Model,//App.model.BaseCRUD,//FIXME: use of id internals in `waitEvent`
    singleton: true,// only one user in UI (`require`d before controllers by app module)
    can: null,// permissions; usage: `App.User.can['App.backend.JS'] && (run_that())`
    modules: null,// setup modules role can use
    fields:[
    {
        name: 'id',
        persist: false
    },
    {
        name: 'name',
        persist: false
    },
    {
        name: 'Roles',
        persist: false
    }
    ],
    login: function login(newUserId, get_session_info){
        App.backend.req('/login', newUserId,{
            autoAbort: true,
            callback: get_session_info// controller (i.e. caller) updates UI
        })
    },
    auth: function auth(user, role, pass, callback){
    var me = this

        App.backend.req('/auth',
            user + '\n' + role + '\n' + App.um.crypto.SHA1.hash(pass),
            function auth_cb(err, ret, res){
            var opt

                if(!err){
                    for(opt in ret.modules.extjs){// short and no auth cfg
                        App.cfg.modules[opt] = { extjs: ret.modules.extjs[opt]}
                    }
                    me.modules = ret.modules
                    me.can = ret.can
                    me.set('id', ret.user.id)
                    me.set('name', ret.user.name)
                    me.set('Roles', ret.user.roles)
                    //me.login = me.auth = null// after login GC
                }
                callback && callback(err, ret, res)
            }
        )
    },
    logoutUI: function logout(){// switch for event handlers
        App.User.logout()
    },
    logout: function logout(cb){
        App.backend.req('/logout', null, cb)
    }
})
