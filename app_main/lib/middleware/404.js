function notFound(req, res){
        res.writeHead(res.statusCode = 404, res.ContentTypes.TextPlain)
        return res.end(
            'URL: ' + req.originalUrl + '\n\n' +
            'Not found'
        )
}

module.exports = notFound
