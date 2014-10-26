/*
 * Connection to backend
 */
Ext.define('App.backend.Connection',{
    extend: Ext.data.Connection,
    method: 'POST',
    url: App.backendURL,
    defaultHeaders:{
        'Content-Type': 'text/plain; charset=utf-8'
    }
})

/*
 * Users of Connection Class
 */
App.backend.req = (
/* Channel#1: request data from backend
 * usage:
 *      App.backend.req('/ns/action0', 'online')
 *      App.backend.req('/ns/action1', { status: "online" })
 *      App.backend.req('/ns/action2', function callback(err, json){})
 *      App.backend.req('/ns/action3', { data: 'data'}, function callback(...){})
 *
 *      // all callbacks, even from `options.callback`, are node.js-style
 *      App.backend.req(
 *          '/ns/js',
 *          '"javascript code";',
 *          {
 *              headers:{ 'Content-Type': 'application/javascript; charset=utf-8'},
 *              callback: function callback(err, json, res){...}
 *          }
 *      )
 */
function create_backend_request(conn){
    return function backend_request(url, data, options){
    var callback = Ext.emptyFn

        if(url && (0 != url.indexOf('http'))){
            url = conn.url + url
        }

        if(!options || 'function' == typeof options){
            options && (callback = options)
            options = {
                url: url,
                callback: null,
                params: null,
                jsonData: null,
                headers: null
            }
        } else {
            options.url = url
            options.callback && (callback = options.callback)
        }
        options.callback = callbackExtAjax

        if('string' == typeof data){
            options.params = data// plain text or JavaScript for `App.backend.JS`
        } else if('function' == typeof data){
            callback = data
        } else {
            options.jsonData = data
            options.headers = {
                'Content-Type': 'application/json; charset=utf-8'
            }
        }

        return conn.request(options)

        function callbackExtAjax(opts, success, xhr){
        var json

            if(success){
                if(~String(xhr.getResponseHeader('Content-Type'))
                   .indexOf('application/json')){
                    json = Ext.decode(xhr.responseText)
                } else {// string is valid JSON
                    json = xhr.responseText
                }
            } else {
                json = { err: xhr.timedout ? 'timedout' : 'aborted' }
                console.error(json, xhr)
            }
            return callback(!success || !json, json, xhr)
        }
    }
}
)(Ext.create(App.backend.Connection))
