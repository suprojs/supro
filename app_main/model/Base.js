/**
 * `Base` from which all other models can/will extend
 * `BaseR` for grids with 'viewed' field
 * `BaseCRUD` for all models from backend
 */

/* this is kind of breakable toy to try some hybrid config for Model and Grid
 * this Models are being loaded manually by View && Store, full MVC runs later
 */

Ext.util.Format.status_created = Ext.util.Format.dateRenderer('H:i:s Y-m-d')

App.cfg.modelBase = {
    fields: [
    {
        name: 'created',
        type: 'date'
        //,type: [ auto(Default, no conversion), string, int, float, boolean, date ]
       ,persist: false
        //,defaultValue: ""
        //,mapping: "data.option"
        //,serialize: Function
        //,sortDir: "ASC"
        //,sortType : Function/String(Ext.data.SortTypes:[asText, asUCString, asUCText, asDate, asFloat, asInt])
        //,useNull : Boolean

        /* NOTE: Model constructor creates accessors for all this,
         * TODO: split columns from fields, in this config object it will be OK,
         *       see `App.cfg.modelChatUser`
         * */
       ,text: l10n.time, dataIndex:'created'
       ,renderer: 'status_created', width: 84
    }
    ]
    //,associations : Object[]
    //,belongsTo : String/Object/String[]/Object[]
    //,clientIdProperty : String
    //,defaultProxyType : String ; Defaults to 'ajax'.
    //,hasMany : String/Object/String[]/Object[]
    //,idProperty : String/Object/Ext.data.Field; Defaults to 'id'.
    ,idgen:{// see 'App.model.BaseR'
        getRecId: function(rec){
            return '' + rec.internalId
        }
    }
    //,proxy : String/Object/Ext.data.proxy.Proxy
    //         every model defines proxy with own `url` and `reader.root`
    //,validations : Object[]

   ,c9r: function constructorModelBase(cfg){
    var me = this
        me.idgen.getRecId = App.cfg.modelBase.idgen.getRecId
        me.callParent([cfg])
    }
}

Ext.define('App.model.Base',{
    extend: Ext.data.Model,
    fields: Ext.Array.clone(App.cfg.modelBase.fields)
   ,constructor: function(cfg){
        App.cfg.modelBase.c9r.call(this, cfg)
    }
})

Ext.Array.insert(
    App.cfg.modelBase.fields,
    0,
    [{
        name: 'n',// new msg marker
        type: 'boolean',
        persist: false,
        defaultValue: true,
        dataIndex:'n',
        width: 22,
        text: '<img src="css/colread.png"></img>&#160',
        renderer:function style_res(value, meta){
            meta.tdCls = value ? 'row-unread' : 'row-read'
            return ''
        }
    }]
)

Ext.define('App.model.BaseR',{
    extend: Ext.data.Model,
    fields: App.cfg.modelBase.fields,
    constructor: function(cfg){
        /* Before:
         * > id: "App.model.Status-ext-record-9
         * > internalId: "ext-record-9"
         **/
        App.cfg.modelBase.c9r.call(this, cfg)
        /* After:
         * > id: "ext-record-9"
         * > internalId: "ext-record-9"
         **/
    }
})

Ext.define('App.model.BaseCRUD',{
    extend: Ext.data.Model,
    requires:[ 'App.proxy.CRUD' ],
   /* idProperty is the internal ID of model in `data.Store` <--> backend link
    * in general MongoDB's default `_id` (any DB doc has it) is OK here
    *
    * but if there are many local databases serving data to one global one
    * (i.e. is distributed on document basis via some transport),
    * then using `_id` isn't possible due to possible collisions
    * such collections define `idProperty` on proxy level or redefine model
    *
    * NOTE: collections being synced via transport must delete `_id` in docs
    **/
    idProperty: '_id',

    /* abstract options may be defined by inherited Models: */
    //clientIdProperty: 'Id' && !persist, for writing records to the server
    //url: Model operates on its own (without store)
    //fields: reconfigured by store/proxy/grid; or see below 'modelShoeItems'

    constructor: function(cfg){
        if(this.url){
            // NOTE: Model's proxy doesn't play role in Store setup
            this.setProxy({
                type: 'crud',
                url: this.url = App.backendURL + this.url
            })
        }

        App.cfg.modelBase.c9r.call(this, cfg)// use short view ids
    }
})
