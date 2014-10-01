Ext.define('App.store.CRUD',{
    extend: Ext.data.Store,
    //url: required; is used to configure proxy
    model: App.model.BaseCRUD,// default dynamic field setup from db
    listeners:{
        metachange: function find_reconfigureGrids(store, metaData){
        var idx, p = store.proxy
            // next data will go without init && meta && reconfig

            if(~(idx = p.url.indexOf('+init'))){// if request meta reconfigure
                p.url = p.url.slice(0, idx)// reset it
            }
            if(metaData.hasOwnProperty('edit')){
    //TODO: if error, send diff of changes for conflict resolution, if any
                // send back for concurrent write checks
                p.extraParams.edit = metaData.edit
            }
        }
    },
    //batchUpdateMode: 'complete',
    remoteSort: true,
    remoteFilter: false,
    remoteGroup: true,

    constructor: function(cfg){
    var me = this

        if(!cfg.url) throw new Error('OOPS: `App.store.CRUD` has no `url` config')

        cfg.storeId || (cfg.storeId = 'supro_CRUD_' + (new Date).valueOf())

        cfg.url = App.backendURL + cfg.url
        cfg.proxy = Ext.apply(cfg.proxy || { },// force this store CRUD proxy config
            { type: 'crud', url: cfg.url, storeId: cfg.storeId }
        )

        delete cfg.url// is not needed in store
        me.callParent([cfg])

        if(me.handleStoreException){//application module/logic error
            me.on('exception', me.handleStoreException)
        }
    }
})
