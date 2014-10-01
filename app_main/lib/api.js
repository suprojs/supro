module.exports = { /* API setup */
    connect: null,// connectjs
    app: null,// connect()
    mwL10n: null,// `l10n` files middleware factory for app modules
    set_mwConfig: null,// set another middleware for serving config
    getModules: null,// get ref from module loader
    /* modules sub api (can be removed if no such app module used)
     * performance hint: placeholders tell V8 about future structure
     **/
    db: null,// mongodb if `supromongod` is configured
    um: null,// access point into `userman`
    wes: null// userman: waiting events (from backend to UI)
}
