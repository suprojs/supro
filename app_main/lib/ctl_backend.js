/*
==============================================================================
\  / Process control HTTP channel 'http://127.0.0.1:' + cfg.backend.ctl_port
 \/  This scheme: child.kill([signal]), where signals can be 'SIGTERM' or 'SIGHUP'
 /\  is very old non cross platform way of child process control.
 \/
 /\  Here is HTTP server on controlling port
/  \
================================================================================
*/

module.exports = ctl_backend

function ctl_backend(cfg, uncaughtExceptions, run_backend){
var ipt  = require('util').inspect
var ctl = require('http').createServer(
function proc_ctl_http_serv(req, res){
var body = ''

    res.on('close', proc_ctl_res_unexpected_close)

    log('ctl req url:' + req.url)
    if ('/sts_running' == req.url){
        body += uncaughtExceptions.join('\n====\n')
    } else if('/cmd_exit' == req.url){
        return call_done_handlers(req, res, done_handlers)
        //body += '$ is going down\n'
    } else if ('/cmd_stat' == req.url){
        body += Math.ceil(process.uptime()) + '\n' + ctl.toISOString()
    } else {// show some info about this
        body += '? pid: ' + process.pid +
        '\ncontrol channel resourses:\n' +
        '\n"sts_running", "cmd_stat", "cmd_exit"' +
        '\n\n' +
        'application under control is at HTTP port: ' + cfg.backend.job_port + '\n'
    }
    // use vanilla `res` (no `res.json` or `res.txt`)
    res.writeHead(200 ,{ 'Content-Length': body.length, 'Content-Type': 'text/plain' })
    return res.end(body)
})

ctl.on('listening',
function proc_ctl_http_serv_listening(){
    ctl = new Date()// fill `ctl` as running flag
    log(
        '^ backend http proc ctl @ http://127.0.0.1:' + cfg.backend.ctl_port + '\n' +
        ctl.toISOString()
    )
})

ctl.on('error',
function proc_ctl_http_serv_error(e){
// NOTE: net error handler must not be inside init(listen) callback!!!
    if('EADDRINUSE' == e.code){// 'EADDRNOTAVAIL'?
        log(
            "!!! FATAL(ctl): can't listen host:port='127.0.0.1':" + cfg.backend.ctl_port +
            "\n" + ipt(e) +
            "\nNOTE: check config 'ctl_port' option collision"
        )
    } else {//FIXME: handle all fatal errors to unset `ctl` and process.exit()
        log("! ERROR(ctl) controlling http channel: " + ipt(e))
    }
    if (!ctl) process.exit(1)
})

ctl.on('clientError',
function proc_ctl_client_error(e, sock){
    log("! ERROR(ctl) in client connection: " + ipt(e))
})

function proc_ctl_res_unexpected_close(){
    log('! ERROR(ctl) aborted request')
}

var done_handlers = [ ], allow = true

cfg.backend.ctl_on_done = function ctl_on_done(handler){
    if(!handler || 'function' != typeof handler){
        allow = false// stop accepting done callbacks
        return
    }
    if(allow){
        done_handlers.push(handler)
    }
    return
}

function call_done_handlers(req, res, arr){
var i, code = 0, n = arr.length

    if(0 == n) return the_end(0, res)
    // setup res, write partials in callbacks
    res.writeHead(200 ,{ /*'Content-Length': body.length,*/
                         'Content-Type': 'text/plain' }
    )
    res.write('$ application is going down\n')
    for(i = 0; i < n; ++i){
        arr[i](callback)
    }
    return null

    function callback(err, data){
        err  && log('! end error at #' + (code = n) + ': ', err)
        data && res.write(data) && res.write('\n')
        if(0 === --n){
            the_end(code, res)
        }
    }
}

function the_end(code, res){
    process.nextTick(function(){
        log('$ application exit with code: ' + (code ? code : 0))
        process.exit(code ? code : 0)
    })
    return res.end()
}

ctl.listen(cfg.backend.ctl_port ,'127.0.0.1' ,run_backend)
ctl.unref()// "allow the program to exit if this is the only active server in the event system"
ctl = null// setup is over, waiting for 'listening' event, `ctl` is running flag

}
