(function uglify_js_closure(con ,doc ,win ,l10n){
/*
 * two frontend parts: under `node-webkit` (local) and `connectjs` in browser (http)
 * front end: node-webkit part
 */
    if(typeof process != 'undefined'){// `nodejs` runtime inside HTML (native desktop)
        App.process = process
        App.c_p = require('child_process')
        App.tray = { obj: null ,stat: 'show' }
        App.versions = { node: '' ,connectjs: '' }
        App.w = void 0
        // start application locally
        check_versions(node_webkit)
        return
    } else {
        throw new Error('Wrong code execution attempt!')
    }
    return

function check_versions(cb){
    App.c_p.exec('node --version',
    function(err, stdout){
        if(err){
            con.error("ERROR spawn `node` process: " + err)
            doc.write(l10n.errload_spawn_backend)
            App.w.window.alert(l10n.errload_spawn_backend)
            return
        }
        App.versions.node = stdout.slice(1)

    App.c_p.exec("node -e \"console.log(require('connect').version)\"",
    function(err, stdout){
        if(err){
            con.error("ERROR require('connect'): " + err)
            doc.write(l10n.errload_spawn_backend)
            App.w.window.alert(l10n.errload_spawn_backend)
            return
        }
        App.versions.connectjs = stdout
        if(typeof Ext != 'undefined'){
            App.cfg.backend.versions.connectjs = App.versions.connectjs
            App.cfg.backend.versions.node = App.versions.node
            Ext.globalEvents.fireEvent('updateVersions')
        }
        cb(App, con)// node_webkit(app, con) || spawn_backend(app, true)
    })//connectjs
    })//node.js
}

function node_webkit(app, con){
    //TODO: wrap `uncaughtException` in ExtJS window, add xhr to backend
    app.process.on('uncaughtException' ,function(err){
        con.error('uncaughtException:', err)
        con.error(err.stack)
        app.w.window.alert && alert(l10n.uncaughtException  + err)
        app.w.window.alert = null
    })

    var gui = require('nw.gui')
       ,http = require('http')

    app.w = gui.Window.get()

    app.w.window.extjs_doc = function open_local_extjs_doc(){
        gui.Window.open(
'http://localhost:' + app.cfg.backend.job_port + '/extjs/docs/index.html'
        )
    }

    setup_tray(app.tray ,app.w)

    load_config(app) && http.get(// check if backend node.js is already running
    {
        hostname: '127.0.0.1',
        port: app.cfg.backend.ctl_port,
        path: '/',
        agent: false
    }
        ,backend_is_running
    ).on('error'
        ,backend_ctl_errors
    )
    app.doCheckBackend = check_backend
    app.doRestartBackend = restart
    app.doTerminateBackend = terminate
    app.doShutdownBackend = shutdown
    return

function backend_is_running(res){
    res.setEncoding('utf8')
    res.on('data', function(chunk){
        var pid = chunk.slice(7).replace(/\n[\s\S]*/g, '')// remove '? pid: '

        app.cfg.backend.time = new Date
        app.cfg.backend.msg = l10n.stsBackendPid(pid)
        app.cfg.backend.pid = pid
        app.cfg.backend.url = 'http://127.0.0.1:' + app.cfg.backend.job_port
        app.cfg.backend.op = l10n.stsCheck

        get_remote_ip()
        con.log('reload just extjs, backend is up and running already')
    })
}

function backend_ctl_errors(e){
    /*if("ECONNRESET" == e.code){// if `agent: true` peer has closed by its timeout
     *   con.log('backend_ctl_errors: prev. backend connection has been reset, ignore')
     *   return
    }*/

    if(app.cfg.extjs){// run setup only first time after ctl check
        spawn_backend(app)
        con.log('backend spawned && extjs load as callback')
        return
    }
    // ignore other errors for now
    con.warn('backend_ctl_errors():')
    con.dir(e)
}

function spawn_backend(app, restart){
// loads `node`+`connect` as separate process and answers on http requests,
// as for this `nw` instance, as for remote clients
// closing `nw` doesn't mean closing backend processing (maybe cfg it?)

    var fs = require('fs')
        ,log
        ,backend

    try {// check and/or create log dir
        if(!fs.statSync(app.cfg.log).isDirectory()){
            con.error('ERROR log dir is not a directory')
            log = l10n.errload_config_log_not_dir + app.cfg.log
            doc.write(log)
            app.w.window.alert(log)
            return false
        }
    } catch(ex){
        try {
            fs.mkdirSync(app.cfg.log)
        } catch(ex) {
            con.error('ERROR log dir:' + (ex = (' ' + app.cfg.log + '\n' + ex)))
            log = l10n.errload_config_log_mkdir + ex
            doc.write(log)
            app.w.window.alert(log)
            return false
        }
    }

    log = app.cfg.log +
          app.cfg.backend.file.replace(/[\\/]/g ,'_') + '-nw.log'

    app.process.env.NODEJS_CONFIG = JSON.stringify(app.cfg)
    backend = app.c_p.spawn(
        process.cwd() + '/node',
        [ app.cfg.backend.file ],
        {
            detached: true,
            stdio:['ignore', fs.openSync(log ,'a+'), fs.openSync(log ,'a+')]
        }
    )
    if(!backend.pid || backend.exitCode){
        con.error('ERROR spawn backend exit code: ' + backend.exitCode)
        log = l10n.errload_spawn_backend + backend.exitCode
        doc.write(log)
        app.w.window.alert(log)
        return false
    }
    backend.unref()

    app.cfg.backend.time = new Date
    app.cfg.backend.msg = l10n.stsBackendPid(backend.pid),
    app.cfg.backend.pid = backend.pid
    app.cfg.backend.url = 'http://127.0.0.1:' + app.cfg.backend.job_port
    app.cfg.backend.op = l10n.stsStart
    con.log('backend.pid: ' + backend.pid)

    if(restart){
        setTimeout(check_backend, 4321)// restart, wait a bit
    } else {
        check_backend(get_remote_ip, null)// start
    }

    return true
}

function check_backend(check_ok, check_he){
    con.log('check backend port: ' + app.cfg.backend.ctl_port)
    if(!check_ok && !app.cfg.backend.pid){// not restart, check if dead
        App.sts(l10n.stsCheck, l10n.stsDead, l10n.stsHE)
        return
    }
    http.get(
    {
        hostname: '127.0.0.1',
        port: app.cfg.backend.ctl_port,
        path: '/',
        agent: false
    }
        ,check_ok ? check_ok : backend_ctl_alive
    ).on('error'
        ,check_he ? check_he : backend_ctl_dead
    )
}

function backend_ctl_alive(res, callback){
    res.setEncoding('utf8')
    res.on('data', function (chunk){
        var pid = parseInt(chunk.slice(7).replace(/\n[\s\S]*/g, ''), 10)// remove '? pid: '

        if(app.cfg.backend.pid != pid){
            con.warn('app.cfg.backend.pid != pid:'+ app.cfg.backend.pid + ' ' + pid)
            app.cfg.backend.pid = pid
        }
        App.sts(l10n.stsCheck, pid + ' - ' + l10n.stsAlive, l10n.stsOK)
        if(callback) callback()
    })
}

function backend_ctl_dead(e){
    con.log('check: backend is dead')

    if('undefined' == typeof Ext){// init
        win.setTimeout(function backend_init_check(){
            if(app.cfg.backend.pid)
                app.cfg.backend.pid = null
            throw new Error(l10n.errload_check_backend)
        }, app.cfg.backend.init_timeout || 1234)
    } else {// keep UI, if loaded
        App.sts(l10n.stsCheck, l10n.stsAlive, l10n.stsHE)
    }
}


function get_remote_ip(){
    app.c_p.exec('ipconfig',
    function(err, stdout){
    var url
        if(!err){// NOTE: RE can be specific to Russian MS Windows
            err = stdout.match(/^[\s\S]*IPv4-[^:]*: ([^\n]*)\n/)
            if(err){
                url = app.cfg.backend.url
                app.cfg.backend.url = app.cfg.backend.url
                   .replace(/127\.0\.0\.1/, err[1])
                if('DIRECT' != gui.App.getProxyForURL(app.cfg.backend.url)){
                    app.w.window.alert(l10n.via_proxy(app.cfg.backend.url))
                    app.cfg.backend.url = url// restore 'localhost'
                }
            }
        }
        run_frontend()
    })
}

function run_frontend(){
var fs = require('fs')

    try {
        fs.statSync(app.cfg.extjs.path.slice(3) + 'ext-all-nw.js')
    } catch(ex){
        throw new Error(l10n.extjsNotFound)
    }

    try {
        (new Function(fs.readFileSync('app_main/app_front_http.js', 'utf8')))()
    } catch(ex){
        throw new Error(
            'ERROR app_main/app_front_http.js\n' +
            l10n.errload_config_read + '\n' + ex.stack
        )
    }
}

function restart(){
    con.log('restart: check, spawn, check')
    check_backend(check_ok, check_he)

    function check_ok(res){
        backend_ctl_alive(res, request_cmd_exit)
    }

    function check_he(e){
        e && con.error('check_he(error):', e)

        if(app.cfg.backend.pid)
            app.cfg.backend.pid = null

        App.sts(l10n.stsCheck, l10n.stsAlive, l10n.stsHE)
        App.sts(l10n.stsStart, l10n.stsRestarting, l10n.stsOK)
        con.log('restart: backend is dead; starting new')
        load_config(app) && check_versions(spawn_backend)
    }

    function request_cmd_exit(){
        con.log('request_cmd_exit ctl_port: ' + app.cfg.backend.ctl_port)
        http.get(
        {
            hostname: '127.0.0.1',
            port: app.cfg.backend.ctl_port,
            path: '/cmd_exit',
            agent: false
        }
            ,reload_ok_spawn
        ).on('error' ,check_he)
    }

    function reload_ok_spawn(){
        con.log('reload_ok_spawn()')
        App.sts(l10n.stsStart, l10n.stsRestarting, l10n.stsOK)
        setTimeout(
            function spawn_reloaded_backend(){
                load_config(app) && check_versions(spawn_backend)
            }
            ,2048
        )
    }
}

function shutdown(){
    http.get(
    {
        hostname: '127.0.0.1',
        port: app.cfg.backend.ctl_port,
        path: '/cmd_exit',
        agent: false
    }, function(res){
        App.sts(l10n.stsShutdown, l10n.stsStopSystem, l10n.stsOK)
        //TODO check if that process is still up or grep for pid to be sure
    }).on('error', function(e){
        con.error("Shutdown error: " + e.message)
        App.sts(l10n.stsShutdown, e.message, l10n.stsOK)
    })
}

function terminate(){
    if(!app.cfg.backend.pid) return App.sts(
        l10n.stsCheck, l10n.stsKilledAlready, l10n.stsOK
    )

    return http.get(// get current pid
    {
        hostname: '127.0.0.1',
        port: app.cfg.backend.ctl_port,
        path: '/',
        agent: false
    }
        ,backend_get_current_pid
    ).on('error' ,backend_ctl_killed)

    function backend_get_current_pid(res){
        App.sts(l10n.stsKilling, l10n.stsCheck,l10n.stsOK)

        res.setEncoding('utf8')
        res.on('data'
       ,function(chunk){
            var pid  = chunk.slice(7).replace(/\n[\s\S]*/g, '')// remove '? pid: '

            if(pid != app.cfg.backend.pid){
                con.warn('current pid != app.cfg.backend.pid; kill anyway!')
            }
            app.cfg.backend.pid = pid
            app.c_p.exec(
               'wscript terminate.wsf ' + pid,
                defer_request_check_kill
            )
        })
    }
}

function defer_request_check_kill(err){
    var msg = app.cfg.backend.pid + ' ' + l10n.stsKilling
    if(err){
        con.error(err)
        App.sts(l10n.stsKilling, msg, l10n.stsHE)
        return
    }
    App.sts(l10n.stsKilling, msg, l10n.stsOK)

    setTimeout(
        function send_check_request(){
            http.get(
            {
                hostname: '127.0.0.1',
                port: app.cfg.backend.ctl_port,
                path: '/',
                agent: false
            }
                ,backend_ctl_not_killed
            ).on('error' ,backend_ctl_killed)
        }
        ,2048
    )
}

function backend_ctl_not_killed(income){
    con.dir(income)
    App.sts(l10n.stsCheck, l10n.stsAlive, l10n.stsHE)
}

function backend_ctl_killed(e){
var m, log = 'backend is killed'

    if(app.cfg.backend.pid){
        app.cfg.backend.pid = null
        m =  l10n.stsKilled
    } else {
        m = l10n.stsKilledAlready
        log += ' already'
    }
    App.sts(l10n.stsCheck, m, l10n.stsOK)
    con.log(log)
}

function load_config(app){// loaded only by main process -- node-webkit
var cfg, fs = require('fs')

    if((cfg = app.process._nw_app.argv[0])){// cmd line
        cfg = 'config/' + cfg
    } else {// HOME config
        if(app.process.env.HOME){
            cfg = app.process.env.HOME
        } else if(app.process.env.HOMEDRIVE && app.process.env.HOMEPATH){
            cfg = app.process.env.HOMEDRIVE +  app.process.env.HOMEPATH
        }
        cfg = cfg + '/.supro.js'
        try {
            fs.statSync(cfg)
        } catch (ex){
            con.log('config in home was not found: ' + cfg)
            cfg = null
        }
    }
    !cfg && (cfg = 'config/cfg_default.js')// default

    try {
        app.cfg = (new Function(
        'var config;/* one global variable, any local can be in read file */\n' +
        fs.readFileSync(cfg ,'utf8') +
        '; return config ;'
        ))()
    } catch(ex){
        ex.message += '\n\n' + l10n.errload_config_parse
        throw new Error(ex)
    }

    app.cfg.backend.time = null
    app.cfg.backend.versions = {
        node: app.versions.node,
        connectjs: app.versions.connectjs,
        nw: app.process.versions['node-webkit']
    }
    con.log('reading config: ' + cfg + ' done')

    return check_extjs_path()
}

function check_extjs_path(){// find local ExtJS in and above cwd './'
var fs = require('fs'), pe = '../', d = ''
   ,ef = app.cfg.backend.extjs.pathFile
   ,extjs_path, i, p

    /* lookup extjs.txt first */
    try{
        extjs_path = fs.readFileSync(ef).toString().trim()
    } catch(ex){
        if(app.cfg.extjs.path){
            extjs_path = app.cfg.extjs.path
            d += 'c'
        } else {
            ex.message += '\n\n' + l10n.extjsPathNotFound(ef)
            throw ex
        }
    }
    if('/' != extjs_path[extjs_path.length - 1]) extjs_path += '/'

    i = 7
    do {
       try{
            p = fs.statSync(extjs_path)
            fs.writeFileSync(ef, extjs_path)
        } catch(ex){ }
        extjs_path = pe + extjs_path// add final level from `app_main` anyway
        if(p){
            break
        }
    } while(--i)

    while(1){
        if(p){
            d = ''
            break
        }
        if(d){/* no 'extjs.txt' file, and cfg failed */
            d = l10n.extjsPathNotFound(ef, app.cfg.extjs.path, 1)
            break
        }

        if(app.cfg.extjs.path){
            extjs_path = app.cfg.extjs.path
            if('/' != extjs_path[extjs_path.length - 1]) extjs_path += '/'
        } else {/* no `extjs.txt` && no cfg value */
            d = l10n.extjsPathNotFound(ef, app.cfg.extjs.path, 2)
            break
        }
        i = 7, p = null
        do {
            try{
                p = fs.statSync(extjs_path)
            } catch(ex){ }
            extjs_path = pe + extjs_path
            if(p) break
        } while(--i)
        if(p){
            fs.writeFileSync(ef, extjs_path)
            break
        }
        d = l10n.extjsPathNotFound(ef, app.cfg.extjs.path)
        break
    }
    if(!d){
        app.cfg.extjs.path = extjs_path
        con.log('ExtJS path found: "' + extjs_path + '" (for "app_main/app.htm")')

        return true
    }
    con.error('ExtJS path not found')
    doc.getElementById('e').style.display = "block"
    doc.getElementById('d').innerHTML = d.replace(/\n/g, '<br>')

    return false
}

function setup_tray(t ,w){
    t.obj = new gui.Tray({ title: l10n.tray.title ,icon: 'app_main/css/favicon.png' })
    t.obj.tooltip = l10n.tray.winvis

    t.obj.on('click' ,function onTrayClick(){
        if('show' == t.stat){// simple show,focus / hide
            t.stat = 'hide'
            t.obj.tooltip = l10n.tray.wininv
            w.hide()
        } else {
            w.show()
            t.obj.tooltip = l10n.tray.winvis
            t.stat = 'show'
        }
    })
    con.log('setup_tray: done')
}
}// nw

})(console ,document ,window ,l10n)
