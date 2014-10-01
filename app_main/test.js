
// backend by UI testing boilerplate

test = {
    auth: function auth(){
        test.postxt('/login', 'dev')
        test.postxt('/auth', 'dev\\ndeveloper.local\\n9d4e1e23bd5b727046a9e3b4b7db57bd8d6ee684')
    },

    order: function order(subapi, obj){
        test.get('/shoesupro/lib/logic/order/' + (subapi || ''), obj)
    },
    // low level tools
   'new': function reload(){
        var global_eval = eval
        test.log('reloading `test`...')
        global_eval(test.get('/test.js').response)
    },

    get: function ajax_get(url, data){
        var req = new XMLHttpRequest
        req.open("GET" ,url ,false)
        req.send(data)
        return req
    },

    post: function ajax_post(url, data){
        var req = new XMLHttpRequest
        req.open("POST" ,url ,false)
        req.setRequestHeader('Content-Type', 'application/json; charset=UTF-8')
        req.send(JSON.stringify(data))
        return req
    },
    postxt: function ajax_post(url, data){
        var req = new XMLHttpRequest
        req.open("POST" ,url ,false)
        req.setRequestHeader('Content-Type', 'text/plain; charset=UTF-8')
        req.send(data)
        return req
    },

    put: function ajax_put(url, data){
        var req = new XMLHttpRequest
        req.open("PUT" ,url ,false)
        req.setRequestHeader('Content-Type', 'application/json; charset=UTF-8')
        req.send(JSON.stringify(data))
        return req
    },

    apply: function consoleApply(obj, method){
        return function(){
            method.apply(obj, arguments)
        }
    },
    applz: function consoleJSON(obj, method){
        return function(res){
        var json = res.status == 401 || res.status == 400 ? res.response :
                   JSON.parse(res.response)
            method.call(obj, res.statusText, json.err || json)
            return json
        }
    }
}

test.log = test.apply(console, console.log)
test.wrn = test.apply(console, console.warn)
test.err = test.apply(console, console.error)
test.res = test.applz(console, console.log)
test.ser = test.applz(console, console.error)
