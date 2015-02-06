module.exports = function make_mw_sendFile(name, absolute, start, end){
    return function sendFile(r__, res, next){
    var fs = require('fs')
       ,fstream = fs.createReadStream(
            ( absolute ? '' : __dirname + '/../../') + name,
            { start: start, end: end }
        )

        fstream.on('open',
        function on_fstream_open(fd){
            return fs.fstat(fd,
            function on_fstat(err, stat){
                if(err){
                    log('sendFile err: ', err)
                    return next(err)
                }
                res.setHeader('Content-Length', stat.size)
                res.setHeader('Content-Type',(
                   ~name.indexOf('css') ? res.ContentTypes.TextCSS :
                   ~name.indexOf('.js') ? res.ContentTypes.AppJS :
                    res.ContentTypes.TextPlain)['Content-Type']
                )
                return fstream.pipe(res)
            })
        })
        fstream.on('error',
        function on_fstream_error(err){
            return next(err)// all errors: request, socket turn to an error to write to the stream?
        })
    }
}
