//`new Function(...){`
if(local.log_dir){
    api_text(ret, api, local, req, res, next)
} else {// directory is not ready
    setTimeout(api_text, 1024, ret, api, local, req, res, next)
}
return true// async anyway
//`}`

/*
 * Event(s):
 *   broadcast: 'chatmsg@um'
 *
 * Developed, tested, debugged using reload `view.Window` tool button
 **/

function api_text(ret, api, local, req, res, next){
var d, f

    if(!local.log_dir){
        throw new Error('Chat: no `log_dir` available')// handled by `connect`
    }

    if('GET' == req.method && req.url.query.file){
    //'http://localhost:3007/um/lib/chat/text?file=2014-07'
        return api.connect.sendFile(
            local.log_dir + '/' + req.url.query.file + '.txt', true
        )(req, res)// call middleware
    }
    // POST `req.txt`: <olecom>{\t}a simple chat message. (with some html around)
    //'http://localhost:3007/um/lib/chat/text'

    d = new Date()
    f = '/' + d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '.txt'
    if(f != local.log_file_name){// new date, new file
        local.log_file_name = f
        if(local.log_file){// current log file is opened
            local.log_file.end(null,
                function on_close_log_file(err){
                    if(err) next(err)
                    return open_log()
                }
            )
        } else {
            return open_log()
        }
    }
    return append_log()

    function open_log(){
        local.log_file = local.require.fs.createWriteStream(
            local.log_dir + local.log_file_name,
            { flags: 'a+' }// read && append
        )
        local.log_file.on('open', append_log)
        local.log_file.on('error',
            function on_error_log_file(err){
                local.log_file.end()
                local.log_file = null
                return next(err)
            }
        )
    }

    function append_log(){// limit is '4mb' in `app_main\lib\middleware\postTextPlain.js`
    var msg = JSON.stringify(req.json) + '\n'

        api.wes.broadcast('chatmsg@um', msg)
        local.log_file.write('{"d":"' + d.toISOString() + '",' + msg.slice(1))

        ret.success = true
        return res.json(ret)
    }

    function pad(n){
        return n < 10 ? '0' + n : n
    }
}
