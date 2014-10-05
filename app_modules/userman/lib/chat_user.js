api_user(ret, api, local, req, res, next)// for `new Function(...)`

/*
 * Event(s):
 *   all heavy lifting of user management is done in `wes.js`
 *   as part of user auth/out and status event handling
 **/

function api_user(ret, api, l____, req, r__, n___){
    if('/user' == req.url.pathname && 'GET' == req.method){
        ret.data = api.wes.list_ids.call()
    }

    ret.success = true
}
