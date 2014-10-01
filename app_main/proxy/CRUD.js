/*
 * JSON-optimized proxy, reader and writer
 **/
if(Ext.encode !== JSON.stringify) Ext.encode = JSON.stringify// ensure this one

Ext.define('App.proxy.CRUD',{
    extend: Ext.data.proxy.Rest,
    alias: 'proxy.crud',
    //url(abstract): is defined by Store || Model

    // proxy defaults can be overriden by store's constructor
    //idParam: '_id',// URL param of ID mongodb's
    batchActions: true,
    startParam: undefined,// our default is empty params || startParam: 'skip'
    pageParam: undefined,
    limitParam: undefined,// || limitParam: 'limit'
    appendId: false,// and no ID in URL tail
    timeout: 2048,// arbitrary
    listeners:{
        exception:
        function crud_exception_proxy(proxy, res, op){
        var msg, icon

            try { icon = JSON.parse(res.responseText).data } catch(ex){ }
            if(icon){
                if('~' == icon[0] && proxy.storeId){
                    msg = Ext.StoreManager.lookup(proxy.storeId)
                    if(msg){//pass application module/logic error to the store
                        msg.fireEvent('exception', icon)
                    }

                    return
                }
                msg = l10n(icon)// warning or fatal error:
                icon = '_' == icon[0] ? Ext.Msg.WARNING : Ext.Msg.ERROR
            } else {
                msg = l10n.err_crud_proxy
                icon = Ext.Msg.ERROR
            }
            console.error(arguments), console.error(op.error)
            if(!Ext.Msg.isVisible()) Ext.Msg.show({
                title: l10n.errun_title,
                buttons: Ext.Msg.OK,
                icon: icon,
                msg: '<b>' + msg + '<br><br>operation ' + (op.error ?
                     'error (in proxy/reader/model):</b> ' + String(
                      op.error.statusText || op.error).replace(/\r*\n/g, '<br>') :
                     (op.success ? 'success' : 'fail')  + ' (backend)</b>'
                )
            })
        }
    },
    /* JSON-optimized reader and writer */
    reader:{
        type: 'json'
       //,idProperty: setup this by `data.Model`s for both reader and writer
       ,root: 'data'
       //,totalProperty: '#'// by default it is the length of the data array
       ,getResponseData:
        function getResponseDataJSON(res){
            try {// NOTE: dates revive in Model constructor
                return this.readRecords(JSON.parse(res.responseText))
            } catch (ex){
                return new Ext.data.ResultSet({
                    total: 0,
                    count: 0,
                    records: null,
                    success: false,
                    message: ex.stack.replace(/</g, '&lt;')
                    // stack includes `message` and is more informative
                })
            }
        }
       ,readRecords:
        function readRecordsJSON(data){
        var me = this, mo = 0,
            Model, root, result

            if(me.getMeta && (result = me.getMeta(data))){
                me.onMetaChange(result)
            } else if(data.metaData){
                me.onMetaChange(data.metaData)
            }

            /* raw or JSON can be seen by devtools/network, thus no
             * ```
             *  me.rawData = data
             *  me.jsonData = data
             * ``` */
            result = {
                total  : data.total || 0,
                count  : 0,
                records: [ ],
                success: me.getSuccess(data),
                message: me.messageProperty ? me.getMessage(data) : null
            }

            if(result.success){
                root = me.getRoot(data)// is Array or blow up

                if((result.count = root.length)){
                    Model = me.model
                    do {
                        data = (root[mo] = new Model(root[mo]))
                        data.phantom && (data.phantom = false)// if no IDs from the server
                    } while(++mo < root.length)
                }
                result.records = root
            }
            return new Ext.data.ResultSet(result)
        }
    }

   ,writer:{
        type: 'json'
       ,allowSingle: false
       //,writeRecordId: true  // default
       ,writeAllFields: !true// !default
       ,dateFormat: 'c'// use ISO 8601 date with timezone info
       ,write:
        function writeJSON(request){
        var operation = request.operation,
            records   = operation.records || [ ],
            len       = records.length,
            data      = new Array(len),
            i         = 0

            do {
                data[i] = this.getRecordData(records[i], operation)
            } while (++i < len)

            if(!this.root){
                request.jsonData = data
                return request
            }
            request.jsonData = request.jsonData || { }
            request.jsonData[this.root] = data
            return request
        }
    }
})
