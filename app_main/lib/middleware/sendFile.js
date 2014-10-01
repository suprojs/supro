module.exports = function sendFile(name, absolute){
var fs = require('fs')
   ,api  = require('../api.js')
    return function sendFile(req, res){
    var fstream = fs.createReadStream((absolute ? '' : __dirname + '/../../') + name)
        fstream.on('open',
            function on_fstream_open(fd){
                fs.fstat(fd,
                    function on_fstat(err, stat){
                        if(err){
                            res.statusCode = 500
                            log('sendFile err: ', err)
                            return res.txt(err.code || String(err))
                        }
                        res.setHeader('Content-Length', stat.size)
                        res.setHeader('Content-Type',(
                           ~name.indexOf('css') ? res.ContentTypes.TextCSS :
                           ~name.indexOf('.js') ? res.ContentTypes.AppJS :
                            res.ContentTypes.TextPlain)['Content-Type']
                        )
                        fstream.pipe(res)
                    }
                )
            }
        )
        fstream.on('error',
            function on_fstream_error(err){
                res.statusCode = 500
                log(err)
                return res.txt(err.code || String(err))
            }
        )
    }
}
