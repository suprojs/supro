
module.exports = exampleSUPRO

function exampleSUPRO(api, cfg){
var n, app = api.app, name = '/example'

    // order of priority; serve static files, css, l10n
    app.use(name, api.connect['static'](__dirname + '/'))
    // http://$WEB_ADDRESS/l10n/ru_example.js
    /* path  to: '$ROOT/app_modules/example/l10n/ru_example.js' */
    app.use('/l10n/', api.mwL10n(api, __dirname, '_' + name.slice(1) + '.js'))

    // files: http://$WEB_ADDRESS/css/example/*
    app.use('/css' + name, api.connect['static'](__dirname + '/css/'))
    // style: http://$WEB_ADDRESS/css/example/css
    n = '/css' + name + '/css'
    app.use(n, api.connect.sendFile(__dirname + name + '.css', true/* full path*/))
    // this module stuff:
    return { css:[ n ], js:[ name + '/app_front_example'], cfg: cfg }
}
