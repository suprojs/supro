(function uglify_js_closure(global, process, con){
var cfg, uncaughtExceptions

    global.log = function log(a, b, c){
        if(b && c) con.log(a, b, c)
        else b  ?  con.log(a, b) : con.log(a)
    }
    uncaughtExceptions = [ ]
    require('./lib/process.js')(global, process, uncaughtExceptions)

    cfg = require('./lib/read_config.js')
    require('./lib/ctl_backend.js')(cfg, uncaughtExceptions, run_backend)
    require('./lib/response.js')

    return

    function run_backend(){
        log('^ app is starting http @ port ' + cfg.backend.job_port + '\n' +
            new Date().toISOString()
        )

        return require('./lib/app.js')(cfg, uncaughtExceptions)
    }
})(global, process, console)
