
module.exports = processSETUP

function processSETUP(global, process, uncaughtExceptions){

    global.__res = null// catch request to inform UI, see note in 'uncaughtException'
    global.pushUncaughtException = function(that){
        log('!Caught:', that)
        uncaughtExceptions.push(that)
    }

    process.on('uncaughtException', function(err){
        pushUncaughtException(err && err.stack || err)
        try { if(__res){
    // NOTE: with many users and high load this may send errors to
    //       the wrong end; thus this is mostly a development tool.
    //       But since client can send this errors back
            __res.statusCode = 500
            __res.json({
                err:'' + (err.stack || err),
                res_address: __res.socket.address()
            })
            __res = void 0
        }} catch(ex){ }
    })

    process.on('exit', function process_exit(){
        log('$ backend process exit event')
    })
}
