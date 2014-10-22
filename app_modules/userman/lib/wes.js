/*
 * Long pooling of messages from backend by UI/XHR: `App.um.wes(userStatus)`
 * Request parameter (in `req.txt`) is user's status: 'online', 'away', etc.
 *
 * LIMITS: only one window/tab/context is suported per one session
 *
 **/

module.exports = wait_events

function wait_events(/*cfg*/){
var Waits = {// pool of waiting server events `req`uests from UI
/*
 * Waits = {
 *     'sessionID#1': {
 *          id: App.User.id// see: `App.um.wes` for description
 *          res: res,// currently pending response
 *          last_res: null,// finished response before next one
 *          next_res: null,// next to be pending
 *          queue: [ ],// events
 *          timer: 000// wait for available `res`
 *     }
 * }
 **/
    }
   ,num = 0// number of sessions
   ,global_pushUncaughtException = global.pushUncaughtException

    global.pushUncaughtException = function wes_pushUncaughtException(that){
        global_pushUncaughtException(that)
        broadcast('uncaught@global', 'check: "/uncaughtExceptions"')
    }

    return {
         mwPutWaitEvents: mwPutWaitEvents
        ,get_id: get_id
        ,list_ids: list_ids
        ,is_online: is_online
        ,reset_online: reset_online
        ,broadcast: broadcast
        //,singlecast: singlecast
        ,init: init
        ,cleanup: cleanup
    }

    function init(req){
    var w

        if(!(w = Waits[req.sessionID])){
            Waits[req.sessionID] = {
                id: '',// empty `id` indicates that session is not active yet
                res: null,// first `res` is being sent back with status confirmation
                last_res: null,// last finished `res`
                next_res: null,// new to be `res` after new status and flush
                queue:[{ ev:'initwes@um', json: req.sessionID }],
                timer: 000
            }
            num++
            return true
        }
        return !w.id// wes is there, check activation by `id` contents
    }
    // ID: `status(4 chars) + user_id@remote_addr' 'session_id`
    // see: `App.um.wes` for description; init: 'appbar-user-onli'
    function new_id(req, status){
        return (status || 'onli').slice(0, 4) +
            req.session.user.id + '@'+
            req.socket.remoteAddress + ' ' + req.sessionID
    }

   /*
    * Handle: http://$FQDN:$PORT/um/lib/wes
    * `req.txt`: new/current user status to change
    * `res.json`: array of events e.g. first bunch after first request::
    * > [
    * >   {"ev":"Usts@um","json":"busydev@127.0.0.1 gLc8_BP0hmfyRQSRVj5pEJhd"}
    * >  ,{"ev":"usts@um","json":"busydev@127.0.0.1 gLc8_BP0hmfyRQSRVj5pEJhd"}
    * > ]
    * `ev`: 'errdev@um', 'initwes@um', 'Usts@um', 'usts@um'
    *
    * Every request except initial (with or without exisiting session) is pending
    * until queue of events has something to send. This every request sends
    * user status to be held inside wes for internal use for e.g. Chat.
    *
    **/
    function mwPutWaitEvents(req, res){
    var w, s

        if(!req.session || !req.session.user || !(w = Waits[req.sessionID])){
            return res.statusCode = 401, res.json('')// 'Unauthorized'
        }
        if(!req.txt){
            return res.statusCode = 501, res.json(
                [{
                    ev: 'errdev@um',// programming error
                    json: 'usts: user status in `req.txt` is empty!'
                }]
            )
        }

        res.on('finish', s = (function create_on_wes_end(req_sessionID){
        var sessionID = '' + req_sessionID// copy sessionID

            return function on_wes_end(){
            var wn

                if((wn = Waits[sessionID])){// mark finished `res`
                    wn.last_res = wn.res
                    if(w.next_res){// setup pending if there is a chain of `res`
                        wn.res = w.next_res
                        w.next_res = null

                        return
                    }
                    wn.res = null// or just release currently finished `res`
                    wn.id = 'offl' + wn.id.slice(4)
                    if(wn.timer){// browser has closed connection
                        clearTimeout(wn.timer)
                        wn.timer = 0
                        wn.res = wn.next_res = null
                    }
                }
            }
        })(req.sessionID))
        res.on('close', s)

        w.id = new_id(req, req.txt)// update status of `App.User`
        if(!w.res && !w.last_res){// init session (1st `req`) -- init status
            w.res = res
            s = [{ ev: 'Usts@um', json: w.id }]
            w.queue.push(s[0])// with 'initwes@um'
            broadcast('usts@um', w.id)
        } else if(!w.res){// second, etc. -- assign new waiting cycle after breadcast
            w.res = res
        } else if(w.res && w.last_res && !w.next_res){// request if pending connection is there
            w.next_res = res
            s = [{ ev: 'Usts@um', json: w.id }]// change status broadcast
            w.queue.push(s[0])
            broadcast('usts@um', w.id)
        }
        return undefined// send all with broadcast
    }

    function get_id(req){
        return (req = Waits[req.sessionID]) ? req.id : 'null'
    }

    function is_online(req){
    var online, w

        if((w = Waits[req.sessionID])){
            if(!w.id || ~w.id.indexOf('offl')){// 'appbar-user-offl'
                (!w.id) && (online = w.res && w.last_res)

                if(!online){
                    w.id = new_id(req)// update status of `App.User`
                    w.queue.push({ ev: 'Usts@um', json: w.id })// with 'login@um'
                    broadcast('usts@um', w.id)
                }
            } else {
                online = true// if requested, then session is online (prevent race)
            }
        }
        return !!online
    }

    function reset_online(req){
    var w

        if((w = Waits[req.sessionID])){
            w.id = ''// reset active mark (wrong password or something)
        }
    }

    function list_ids(){
    var sesss = new Array(num), n = 0

        for(var sid in Waits){
            sesss[n++] = {
                _id: Waits[sid].id
            }
        }
        return sesss
    }

    function cleanup(sessionID){
    var sn

        if((sn = Waits[sessionID])){
            if(sn.timer){
                clearTimeout(sn.timer)
                sn.timer = 0
            }
            if(sn.res){
                sn.res.json('')
                sn.res = null
            }
            if(sn.last_res){
                sn.last_res = null
            }
            if(sn.next_res){
                sn.next_res.json('')
                sn.next_res = null
            }
            delete Waits[sessionID]
            num--
        }
    }

    function broadcast(ev, json){
        for(var id in Waits){
            _queue_event(Waits[id],{ ev:ev, json:json })
        }
        return json
    }

    function singlecast(sessionID, ev, json, wn){
        if(wn || (wn = Waits[sessionID])){
             _queue_event(wn,{ ev:ev, json:json })
        }
    }

    function _queue_event(wes, ev){
        wes.queue.push(ev)
        if(!wes.timer){
            wes.timer = setTimeout(
                function wait_queue_flush(){
                    if(wes.res){// flush if next `res` is there
                        wes.timer = 00
                        wes.res.json(wes.queue.splice(0))// clean object in events
                    } else {// wait for `res` to be ready a bit later
                        setTimeout(wait_queue_flush, 512)
                    }
                }
                ,512
            )
        }
    }
}
