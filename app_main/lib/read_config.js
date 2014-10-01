var cfg

try {//TODO: read config from file every require()
    cfg = JSON.parse(process.env.NODEJS_CONFIG)
} catch(ex){
    cfg = (new Function('var config ; return ' + process.env.NODEJS_CONFIG))(ex)
}
(cfg.extjs) && (cfg.extjs.launch = { css:[ ], js:[ ]})// setup arrays

module.exports = cfg
