(function uglify_js_closure(global, process, con){
var cfg = require('./lib/read_config.js')

    global.log = function log(){ con.log.apply(con, arguments)}

    require('./lib/response.js')
    require('./lib/process.js')(global, process)
    require('./lib/ctl_backend.js')(cfg, run_backend)

    return

    function run_backend(){
        log('^ app is starting http @ port ' + cfg.backend.job_port + '\n' +
            new Date().toISOString()
        )

        return require('./lib/app.js')(cfg)
    }
})(global, process, console)
