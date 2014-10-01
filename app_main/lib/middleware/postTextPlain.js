function postTextPlain(req, res, next){
    if (req._body) return next()
    var limit = require('connect').limit('4mb')
       ,utils = require('connect/lib/utils.js')
       ,mime = utils.mime(req)
    if('text/plain' == mime || 'application/javascript' == mime)
        return limit(req, res
    ,function(err){
        if(err) return next(err)
        var buf = ''
        req.setEncoding('utf8')
        req.on('data', function(chunk){ buf += chunk })
        req.on('end', function(){
            req.txt = buf
            next()
        })
        return req._body = true
    })
    return next()
}

module.exports = postTextPlain
