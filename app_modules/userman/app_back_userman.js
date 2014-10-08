/*
 * user authentication and resource authorization
 * provide frontend UI files and backend logic
 *
 * `App.um.wes`: per-user/session division allows UI to receive events
 * from backend via long pooling (i.e. XHR with long timeout)
 *
 * otherwise UI must do XHR frequently
 */

module.exports = userman

function userman(api, cfg){
var app = api.app
   ,Config, Modules
   ,Can ,Roles ,Users
   ,n ,f ,files ,wes ,rbac

    if(!cfg || 'string' != typeof cfg.data){// cfg check
        throw new Error('Not a string: `config.modules.userman.data`')
    }
    if('function' != typeof api.set_mwConfig){
        throw new Error('Not a function: `api.set_mwConfig()`')
    }

    api.wes = wes = require('./lib/wes.js')(/*cfg*/)
    rbac = require('./lib/rbac.js')(cfg)

    Can = rbac.can
    Roles = rbac.roles
    Users = rbac.users

    files = [// files as class names are loaded by `Ext.syncRequire()`
        '/um/crypto/SHA1',
        /* (l10n) M V C loading */
        '/um/model/User',// + client's requested `l10n`
        '/um/view/Login',
        '/um/controller/Login'
    ]

    for(f = 0; f < files.length; f++){// provide [files] before auth middleware
        n = files[f]// prepared path for UI loading
        n = n + '.js'// provide file from backend
        app.use(n, api.connect.sendFile(__dirname + n.slice(3), true))
    }

    /* TODO: save and load session info from files
     *connect.session.MemoryStore.prototype.loadSync
     *connect.session.MemoryStore.prototype.saveSync = function(path){
     *   log('this.sessions: ', this.sessions, '\n')
     *}
     **/

    app.use(api.connect.session({
        secret: cfg.sess_puzl
       ,generate: function(req, res){
            return !req.session && req.url === '/login'
        }
       ,cookie:{
           /*
            * `maxAge: null` browser lifetime session
            * But: to enable UI to remove session on any unload/close event
            *      see `Ext.EventManager.onWindowUnload` @
            *      app_modules\userman\controller\Login.js
            **/
            maxAge: cfg.hasOwnProperty('sess_maxage') ?
                    cfg.sess_maxage : 1 << 25// 9.3 hours ~one working day
       }
       //,store = require('connect-mongo')(app)
    }))

    // high priority mw
    app.use(mwBasicAuthorization)// apply default 'deny' from `rbac.init_auth()`

    app.use('/um/lib/wes', wes.mwPutWaitEvents)// UI: 'App.um.wes'
    app.use('/um' + (n = '/wes.js'), api.connect.sendFile(__dirname + n, true))

    app.use('/um/lib/chat', require('./lib/chat.js')(cfg, api))// backend API && MVC UI:
    app.use('/um' + (n = '/model/chatUser.js'), api.connect.sendFile(__dirname + n, true))
    app.use('/um' + (n = '/view/Chat.js'), api.connect.sendFile(__dirname + n, true))
    app.use('/um' + (n = '/controller/Chat.js'), api.connect.sendFile(__dirname + n, true))

    app.use('/um/lib/rbac', rbac.mwRBAC)
    app.use('/um' + (n = '/view/Userman.js'), api.connect.sendFile(__dirname + n, true))
    app.use('/um' + (n = '/controller/Userman.js'), api.connect.sendFile(__dirname + n, true))

    // low priority stuff:
    n = '/css/userman/css'// NOTE: `n` holds value used in `return`
    app.use(n, api.connect.sendFile(__dirname + '/userman.css', true))
    app.use('/css/userman/', api.connect['static'](__dirname + '/css/'))

    app.use('/l10n/', api.mwL10n(api, __dirname, '_um.js'))

    app.use('/login', mwLogin)// '/login' creates `req.session`', shows `roles`
    app.use('/auth', mwAuthenticate)// '/auth' creates `req.session.user`'
    app.use('/logout', mwLogout)

    // isolate modules from access to app and other modules' configs
    Modules = api.getModules()// reference to all (being loaded now) modules
    Config  = api.set_mwConfig(mwAuthBasedConfig)// get app config here
    api.getModules = api.set_mwConfig = null// deny other modules to do it

log('TODO: drop priviledges so other app modules can not access anything')

    return { css:[ n ], js: files, cfg: cfg }

    function mwAuthBasedConfig(req, res, i){
        if(Modules.userman){// one time setup after loading of all modules
            for(i = 0; i < Modules.userman.css.length; ++i){
                Config.extjs.launch.css.push(Modules.userman.css[i])
            }
            for(i = 0; i < Modules.userman.js.length; ++i){
                Config.extjs.launch.js.push(Modules.userman.js[i])
            }
            if(Modules.userman.cfg.extjs) for(i in Modules.userman.cfg.extjs){
                Config.extjs[i] = Modules.userman.cfg.extjs[i]
            }
            delete Modules.userman// no need, eveything is here
        }
        return res.json(Config.extjs)
    }


            }
        }


    }

    function mwLogin(req, res){
    var u, ret = { success: false, roles:[ ], err: null }

        if(req.session && (u = req.txt)){
            if(req.session.can){// auth-d show permissions list - "can"
                ret.success = true
                ret.can = req.session.can
                ret.user = req.session.user

                return res.json(ret)// fast path
            }

            u = u.split('\n')[0]// user_id
            if((u = Users[u])){// pre auth shows roles
                ret.success = true
                ret.roles = u.roles

                return res.json(ret)// fast path
            }
            // if no user found, then auth will fail,
            // don't tell it here (security by obscurity)
        } else {
            ret.err = '!session_txt'
        }
        return res.json(ret)
    }

    function mwBasicAuthorization(req, res, next){
    // see `create_auth()`
    var i, idx, can, perm

        /* protect namespace of this from any no auth access */
        if(0 == req.url.indexOf('/um/')){// TODO: configure other protected namespaces
            do {
                if(req.session && req.session.user){
                    break// go further
                }
                res.statusCode = 401// no auth
                req.session || res.statusCode++// 402 no session
                return res.json('')
            } while(0)
        }

       /* turn ExtJS Class URL e.g.:
        * /backend/JS.js?_dc=1395638116367
        * /backend/JS
        *
        * into `Can.backend` can hash index
        */
        idx = req.url.indexOf('.js?')
log('basic auth:', req.url)
        perm = req.url
        if(req.session && (can = req.session.can)){// auth
            if(~idx){// *.js files
                perm = perm.slice(0, idx)
                if(can.Static[perm]){
log('.allow session Can.Static: ' + perm)
                    return next()// allow connect.static
                }
            } else {// API
log('perm: ' + perm)
                for(i = 0; i < can.API.length; ++i){// scan all API
log('check: ' + can.API[i])
                    if(0 == perm.indexOf(can.API[i])){// for subsets
                    // e.g. '/um/' in ''/um/lib...''
log('.allow "' + perm + '" by can.API: ' + can.API[i])
                        return next()// allow API
                    }
                }
            }
            // all other falls thru
        }

       /*
        * Default policy "deny" means: ACCEPT URL
        * - it is NOT listed in `Can.Static` (protected list of files)
        * then
        * -- for API calls (URL other than *.js) is NOT listed in `Can.API`
        **/
        if(!Can.Static.hasOwnProperty(perm)){
            // not *.js files -- all API must heve permission
            if(!~idx) for(i = 0; i < Can.API.length; ++i){
log('check policy deny: ' + Can.API[i])
                if(0 == perm.indexOf(Can.API[i])){
                // search for subsets e.g. '/um/' in ''/um/lib...''
log('!disallow "' + perm + '" by not in Can.Static and in Can.API: ' + Can.API[i])
                    perm = ''
                    break
                }
            }
            if(perm){
log('.allow by not in Can.Static and not in Can.API if not *.js: ' + perm)
                return next()// allow stuff that is NOT listed there
            }
            // fall thru to disallow
        }
        // disallow
        perm = req.url
        if(!~idx){// not *.js files
            res.statusCode = 401// crud reject (API calls)
            res.json({ success: false, err: "URL '"+ (perm || '/') + "' Unauthorized" })
        } else {
            perm = perm.slice(0, idx)
           /* gracefully reject Classes loaded from MVC files by phony UI e.g.:
            *   Ext.ns("App.view.desktop.BackendTools")
            *   App.view.desktop.BackendTools = Ext.Component// Unauthorized
            **/
log('!deny perm:', perm)
            perm = 'App' + perm.replace(/[/]/g, '.')
log('!deny cmp:', perm)
            res.js(
               'if(window.Ext){\n' +
               '    console.warn("Unauthorized: ' + perm + '")\n' +
               '    Ext.ns("' + perm + '")\n    ' +
                    perm + ' = Ext.' + (
                    ~perm.indexOf('.controller.') ? 'app.Controller' : 'Component'
                ) + '\n}\n'
            )
        }
        return null
    }

    function mwAuthenticate(req, res){
   /* req.session.user = {// user data for UI (no pass)
    *     id: u.id,
    *     name: u.name,
    *     roles: u.roles
    * }
    **/
    var data, u, r,
        ret = { success: false, user: null, err: null, can: null }

        if(req.session){// i.e. there is '/login' but no `/logout`
            if((ret.can = req.session.can)){
                ret.user = req.session.user

                if(wes.is_online(req)){// check and reset to prevent races
                    res.statusCode = 409, ret.err = "Conflict"
                    return res.json(ret)
                }

                ret.modules = req.session.modules
                ret.success = true
                res.json(ret)

                //security: don't show permissions and modules to others
                ret.can = ret.modules = null
                return wes.broadcast('login@um', ret)// fast path out
            }
           /*
            * check user *iff* there is no one in `req.session`
            * prevent race condition in login process by checking `wes`
            */
            if(!req.session.user && (data = req.txt)){
                if(!wes.init(req)){
                    res.statusCode = 409, ret.err = "Conflict"
                    res.json(ret)
                    return wes.broadcast('auth@um', ret)
                }

                data = data.split('\n')//: 'user_id\nrole_name\npass_sha1'
                u = Users[data[0]]
                r = data[1]
                // check password and role name in user's allowed roles list
                ret.success = u && u.pass === data[2] && !!(
                              r &&~u.roles.indexOf(r))

                if('developer.local' === r &&
                   '127.0.0.1' !== req.socket.remoteAddress){
                    ret.success = false//security: don't allow remote access
                    ret.err = '!access'
                }

                if(ret.success){
                    if(req.session.fail){
                        req.session.fail = 0
                    }
                    ret.user = req.session.user = {// user data for UI (no pass)
                        id: u.id || data[0],
                        name: u.name,
                        roles: u.roles
                    }
                    create_auth(req.session, r)// permissions are in session
                    ret.can = req.session.can// permissions for UI
                    ret.modules = req.session.modules = {// one time setup
                        css:[ ],
                        js: ['App.um.wes'],// provide `wes` if role `can` it
                        extjs:{ }
                        //todo per user modules css and js
                    }
                    // special case of this module:
                    // add shortcuts/views manually if allowed
                    data = 'App.um.view.Chat'
                    ret.can[data] && ret.modules.js.push(data)
                    data = 'App.um.view.Userman'
                    ret.can[data] && ret.modules.js.push(data)
                    // setup other modules
                    for(r in Modules) if(ret.can['module.' + r] || ret.can['module.*']){
                        if(!Modules[r]) continue

                        data = Modules[r].css
                        if(data) for(u = 0; u < data.length; ++u){
                            ret.modules.css.push(data[u])
                        }
                        data = Modules[r].js
                        if(data) for(u = 0; u < data.length; ++u){
                            ret.modules.js.push(data[u])
                        }
                        if((data = Modules[r].cfg.extjs)) for(u in data){
                            ret.modules.extjs[u] = (data[u])
                        }
                    }
                    res.json(ret)

                    //security: don't show private info to others
                    ret.user = ret.user.name
                    ret.can = ret.modules = null
                    return wes.broadcast('auth@um', ret)// fast path
                } else {
                    wes.reset_online(req)
                    ret.err || (ret.err = '!bad_upr')
                }
            } else {
                ret.err = '!data'
            }

            if(ret.err){
                req.session.fail = req.session.fail ? ++req.session.fail : 1
                if(4 == req.session.fail){// brute force preventer
                    req.session.user = true// stop auth check
                    setTimeout((
                    function prepare_allow_failer(failer){
                        return function allow_failer(){
                            failer.destroy()
                        }
                    })(req.session),
                        1 << 22
                    )// wait hour or so to allow next login
                }
            }
            res.statusCode = 400
        } else {
            res.statusCode = 402
            ret.err = '!session'
        }
        res.json(ret)
        return wes.broadcast('auth@um', ret)
    }

    function create_auth(session, role_name){
   /* Creating user/session authorization
    * req.session.can = {
    *     __name: 'role.name'
    *     // access to static (Class) files
    *     // if file URL (i.e. with '*.js' postfix; stripped)  is in there
    *     // then allow access (which is denied by default by `rbac.init_auth()`)
    *    ,Static: { '/backend/JS': true }
    *     // access to API calls
    *     // `mwBasicAuthorization` scans this array for every URL that is
    *     // not a '*.js' file; if there is a match of any items here with URL's
    *     // first place e.g. URL: "/um/lib/..." && can.API[0]: "/um/" allow access
    *    ,API: [ '/um/' ]
    *     //compiled list of permissions from all roles in its priority *order*
    *    ,'App.view.desktop.BackendTools': true
    *    ,'App.backback.JS': true
    * }
    **/
    var can, d, p, i, roll

        can = Roles[role_name] || { __name: 'no role name' }
        if(Array.isArray(can)){// compile permissions from role setup
            roll = can
            can = {
                __name: role_name
               ,Static: { }
               ,API: [ ]
            }
            for(i = 0; i < roll.length; ++i){
                p = roll[i]
                if(Array.isArray(p)){// group of permissions from Can
                    for(d = 0; d < p.length; ++d){
                        apply_permission(p[d])
                    }
                } else {
                    apply_permission(p)
                }
            }
            Roles[role_name] = can// rewrite role with complied list of perm-s
        }
        session.can = can
        return

        function apply_permission(j){
        var i, is_api = false
log('perm apply:"' + j + '"; Can[j]: ', Can[j])
            if(true === Can[j]){// single available permission name
            // secured permissions true here and blocked from others in `rbac.merge`
                can[j] = true

                for(i = 0; i < Can.API.length; ++i){// all Can.API must heve Can
                    if(j === Can.API[i]){// add permission if it is in Can.API
                        can.API.push(j)
                        is_api = true
                        break
                    }
                }
                if(!is_api){
                    j = j.replace(/^[^.]*[.]/, '/').replace(/[.]/g, '/')
                    if(Can.Static.hasOwnProperty(j)){
                        can.Static[j] = true
                    }
                }
            } else {
            // security: check any new permission
                if(null === rbac.fuses_can(j)){// no such perm-n
                    for(i = 0; i < Can.API.length; ++i){// all API must heve permission
                        if(0 == Can.API[i].indexOf(j)){// j: "/p", API[i]: '/pingback'
                            is_api = true
                            log('!Security `apply_permission`: skip secure API subset "' + j + '"')
                            break// stop scan; deny subsets of API from app modules
                        }
                    }
                    if(!is_api){// allow API or any other (new) perm-n from app modules
                        rbac.init_can(j)
                    }
                } else {
                    log('!Security `apply_permission`: skip secure permission "' + j + '"')
                }
            }
        }
    }

    function mwLogout(req, res){
        if(req.session && !req.session.fail){// disallow bruteforce check bypass
            if(req.session.user){// one user login per session
                wes.broadcast('out@um', wes.get_id(req))
                req.session.user = null
                req.session.can = null
            }
            wes.cleanup(req.sessionID)
            req.session.destroy()
        }
        return res.json('')
    }
}
