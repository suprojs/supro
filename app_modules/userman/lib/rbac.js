/*
 * Auth* provider and manager
 **/
module.exports = rbac_setup

function rbac_setup(cfg){
var dir, rbac_api, fs = require('fs')

    rbac_api = {
        fuses_can: null,// permission fuses
        can: null, roles: null, users: null,// rbac data
        merge: merge_rbac_from_others,
        // API: manager for UI
        mwRBAC: mwRBAC
    }

    default_access_data()
    expand_can_arrays()

    dir = process.cwd() + cfg.data + '/rbac'

    fs.stat(dir,
    function stat_um_data_rbac_dir(err, d){
        if(err){
            require('mkdirp').mkdirp(dir,
            function mkdirp_um_data_rbac_dir(err){
                if(err) throw(err)
                //load_api()
            }
            )
            return
        }
        if(!d.isDirectory()){
            throw new Error('Is not a directory: ' + dir)
        }
        //load_api()// init api
    }
    )

    return rbac_api

    function default_access_data(){
    var fuse, backend_js_class, backend_js_api

        fuse = rbac_api.fuses_can = rbac_api_fuses_can_setup()
        /* Protection of permissions */
        // this module can be implemented or copied by third party
        // this is just an example of permissions protection
        backend_js_class = 'App.backend.JS'// depends on `pingback` app_module
        backend_js_api = '/pingback'
        fuse(backend_js_class, true)// setup fuse permissions
        fuse(backend_js_api, true)
        fuse('module.*', true)
        /* set of permissions */
        rbac_api.can = {
            backend:[// union of permissions to be expanded in role by auth
                'App.view.desktop.BackendTools'// UI classes
                ,fuse(backend_js_class)// annotated secure permission used
                ,fuse(backend_js_api)// annotated secure permission used
            ]
           ,'App.um.wes': true// `wes` UI + API are included by default in roles
           ,'/um/lib/wes': true
           ,userman:[
                '/um/',// all backend API calls (URL based)
                'App.um.controller.Userman',// simple single permissions
                'App.um.view.Userman'
            ]
           ,chat:[
                '/um/lib/chat'// backend API calls (URL based)
                ,'App.um.wes', '/um/lib/wes'// NOTE: include this for any role
                //NOTE: 'App.um.model.chatUser' is accessible if not listed here
                ,'App.um.view.Chat'
                ,'App.um.controller.Chat'
           ]
            //// simple permissions, e.g.:
            //,'App.um.view.Chat': true
            //// has no practical use, because they are duplicated in roles

           ,Static:{
            // by default deny access to Class or other files by `initAuth()`
            }
           ,API:[ ]// by default deny access to API calls (iterate array of subsets)
        }
        /* set of roles */
        rbac_api.roles = {// 'role': new Array(of `can`s)
            'developer.local':[
                rbac_api.can.backend// can do all from specified `can` block
               ,rbac_api.can.chat
               ,rbac_api.can.userman
               ,'App.view.Window->tools.refresh'// developer's stuff
               ,fuse('module.*')// allow any app module to load
            ]
           ,'admin.local':[
                'App.view.desktop.BackendTools',
                'module.example',// if enabled in config will be allowed
                'module.enjsms',
                rbac_api.can.chat
           ]
           ,'enjsms+chat':[
                'module.enjsms',// order is not followed in shortcuts
                //'/um/lib/rbac', allow e.g. `App.backend.req('/um/lib/rbac/can')`
                rbac_api.can.chat
           ]
           //,'developer':[ fuse(backend_js_class) ]
        }
        fuse(backend_js_class, false)// deny access by this permission for others
        fuse(backend_js_api, false)// deny access by this permission for others
        fuse('module.*', false)
        /* set of users */
        rbac_api.users = {
            dev:{
                id: 'dev',
                // require('crypto').createHash('sha1').update(pass).digest('hex')
                pass: '9d4e1e23bd5b727046a9e3b4b7db57bd8d6ee684',
                roles:[ 'developer.local', 'admin.local' ],
                name: 'full dev login'
            }
            ,admin:{
                id: 'admin',
                pass: '9d4e1e23bd5b727046a9e3b4b7db57bd8d6ee684',
                roles:[ 'admin.local' ],
                name: 'admin login'
            }
            ,test:{
                id: 'test',
                pass: '9d4e1e23bd5b727046a9e3b4b7db57bd8d6ee684',
                roles:[ 'enjsms+chat' ],
                name: 'test login'
            }
        }
    }

    function expand_can_arrays(){
    var a, p, i, can

        can = rbac_api.can
        secure = rbac_api.fuses_can
        for(p in can){
console.log('eca p: ' + p)
            if(Array.isArray(a = can[p])){
console.log('eca a: ', a)
                for(i = 0; i < a.length; ++i){
                    can[a[i]] = true// secured permissions are in general list also
                }
            }
        }
    }

    function rbac_api_fuses_can_setup(){
   /*
    * Fuse annotations of the permissions means they can be defined only in
    * arrays of permissions i.e.:
    *
    *    fuse('permission_name', true)
    *    rbac_api.can = {
    *        backend:[// a block of permissions
    *            'App.view.desktop.BackendTools'// UI classes
    *            ,fuse('permission_name')// special annotated permission
    *        ]
    *    }
    *    fuse('permission_name', false)// lock it
    *
    * then all added permissions from all sources are being checked against
    * this secure list thus preventing them to appear in `rbac_api.can` and
    * allow anything
    **/
    var fuses_can = {/*// check for this in auth; examples:
            'module.*': true
           ,'App.backend.JS': true// depends on `pingback` app_module */
        }
        return function rbac_api_fuses_can(id, val){// closesure with `fuses_can`
            // assign value to permission; if it is false then permission
            // is disabled and denied further (for some reason)
            if('undefined' != typeof val){// don't override false permission
                if(fuses_can.hasOwnProperty(id) && !fuses_can[id]){
                    return ''// exists, but false
                }
                return (fuses_can[id] = (val === true)) ? id : ''
            }

            if(fuses_can.hasOwnProperty(id)){
               return fuses_can[id] ? id : ''
            }
            return null// no such permission in `fuses_can`
        }
    }

    function merge_rbac_from_others(rbac){
    /* to `rbac_api` form e.g: `cfg.modules.userman.rbac`:{
            can:{
                'module.pingback': true
               ,'module.enjsms': true
            }
           ,roles:{
                'user.test':[
                    'module.enjsms'
                ]
            }
           ,users:{
                test:{
                    pass: '9d4e1e23bd5b727046a9e3b4b7db57bd8d6ee684',
                    roles: [ 'user.test' ],
                    name: 'test user'
                }
            }
        }
     **/
        if(!rbac) return

        if(0 == rbac_api.can.API.length){
            log(
'Coding error: empty `rbac_api.can.API`; use `merge_rbac*()` _after_ `initAuth()`'
            )
        }

        var i, j, k, m, ii, src, dst, secure

        secure = rbac_api.fuses_can
        for(i in rbac){
            if(!rbac_api.hasOwnProperty(i)){// check if `rbac_api` has such category
log('!Security `merge_rbac`: overwrite attempt of "' + i + '"')
                continue// don't allow anything from untrusted sources
            }
            src = rbac[i], dst = rbac_api[i]
            for(j in src){// from source to destination
                if(dst.hasOwnProperty(j)){
//log('!Security `merge_rbac`: overwrite attempt of `' + i + '["' + j + '"]`')
                    // new: just skip `can` that exists already
                    continue// don't allow overwrite anything
                }
                if('can' == i){
                    if(Array.isArray(src[j])){
log('`merge_rbac`: skip array can.' + j)
                        continue// disable arrays (nothing can be there)
                    }
                    if(null !== secure(j)){
log('!Security `merge_rbac`: skip secure permission "' + j + '"')
                        continue// there is such permission in `fuses_can`
                    }
                } else if('roles' == i){// check perms thru `fuses_can`
                    if(!Array.isArray((m = src[j]))){
                        continue// skip
                    }// role_name: [ ]

//log('merge role m: ' + m)
                    for(k = 0; k < m.length; ++k){
//log('merge role m[k]: ' + m[k])
                        if(null !== secure(m[k])){
log('!Security `merge_rbac`: reject role secure permission "' + m[k] + '"')
                            m[k] = ''// there is such permission in `fuses_can`
                        }/* else {// check API subsets
//log('merge role API: ', rbac_api.can.API)
                            for(ii = 0; ii < rbac_api.can.API.length; ++ii){
                            // all API must heve permission
//log('merge role API[ii]: ' + rbac_api.can.API[ii])
                                if(0 == rbac_api.can.API[ii].indexOf(m[k])){
                                // j: "/p", API[i]: '/pingback'
                                    log(
'!Security `merge_rbac`: skip secure API subset "' +
                                        m[k] + '" in role "'+ j + '"'
                                    )
                                    m[k] = ''???
                                    break
                    // stop scan; deny subsets of API from app modules
                    // ??? what app modules ???
                                }
                            }
                        }*/
                    }
                }
                dst[j] = src[j]
            }
        }//TODO: merge l10n from config to global l10n
    }

    function mwRBAC(req, res, next){// manage permissions, roles, users sets
    var ret = { success: true, data: { }}//                             \.../
    var m = req.url.slice(1, 5)// UI call: App.backend.req('/um/lib/rbac/can')

        switch (m){// API is protected, thus `req.session` must be valid
            case 'can': req.session.can && (ret.data = req.session.can)
                break
            case 'all': ret.data = rbac_api
                break
            default:break
        }

        return res.json(ret)// big fat todo
    }
}
