/*
 * Add `res.sugar()`
 */
var http = require('http')

http.ServerResponse.prototype.ContentTypes = {
    AppJSON:   { 'Content-Type': 'application/json; charset=utf-8' },
    AppJS:     { 'Content-Type': 'application/javascript; charset=utf-8' },
    TextCSS:   { 'Content-Type': 'text/css; charset=utf-8' },
    TextPlain: { 'Content-Type': 'text/plain; charset=utf-8' }
}

http.ServerResponse.prototype.json =
/*  res.json({ success: true })
 *  res.json('') -> valid JSON is empty string object: ""
 *  res.json(401, { msg: ' Authorization Required' })
 *
 *  res,json() -> blow up
 */
function res_json(status, obj){
    if('undefined' != typeof obj){
        this.statusCode = status
    } else {
        obj = status
    }
    try {
        obj = JSON.stringify(obj)
    } catch(ex){
        obj = '{"success": false}'
    }
    this.setHeader('Content-Length', Buffer.byteLength(obj))
    this.writeHead(this.statusCode, this.ContentTypes.AppJSON)
    this.end(obj)
}

http.ServerResponse.prototype.js =
/*  res.js('Ext.define(...)')
 */
function res_js(code){
    if(!code){
        code = ';/* No Code or Unauthorized */;'
    } else if('string' != typeof obj){
        code = code.toString()
    }
    this.setHeader('Content-Length', Buffer.byteLength(code))
    this.writeHead(this.statusCode, this.ContentTypes.AppJS)
    this.end(code)
}

http.ServerResponse.prototype.txt =
/*  res.txt('plain text')
 */
function res_txt(txt){
    if(!txt && txt !== '') txt = 'No text available'
    this.setHeader('Content-Length', Buffer.byteLength(txt))
    this.writeHead(this.statusCode, this.ContentTypes.TextPlain)
    this.end(txt)
}
