var ctl, http = require('http'), res = ''

ctl = http.get(// requesting info from remote api
    process.argv[2],// 'url:port/cmd'
    getData
);
ctl.setTimeout(process.argv[3] || 2048)// timeout
ctl.on('error', ret_data)
ctl.end()

function getData(ctlres){
    ctlres.setEncoding('utf8')
    ctlres.on('data', get_chunk)// collecting data chunks
    ctlres.on('end', ret_data)// end of processing
}
function get_chunk(chunk){
    res += chunk
}
function ret_data(e){
    e && console.log('error: ', e)
    setImmediate(function(){
        console.log('res: "' + res + '"')
        process.exit(e ? 1 : 0)
    }, 64)
}
