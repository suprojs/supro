/*
 * `l10n` files middleware factory for app modules
 */
function make_mwL10n(api, dirname, postfix){
    return function mwL10n(req, res, next){
    var q, s

        if(!~req.url.indexOf(postfix)){
            next()
            return// l10n is not for this module
        }
        if((q = req.url.indexOf('?')) >= 0){
            s = req.url.slice(0, q)
        }
        try{// client requested l10n
            s = dirname + '/l10n' + s
            require('fs').statSync(s)
            api.connect.sendFile(s, true)(req, res, next)
        } catch(ex){// or fallback
            api.connect.sendFile(
                dirname + '/l10n/' + api.cfg.lang + postfix,
                true// absolute path is provided
            )(req, res, next)
        }
    }
}

module.exports = make_mwL10n
