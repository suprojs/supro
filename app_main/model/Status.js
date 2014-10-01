/**
 * Status {@link Ext.data.Model} model for all backend info
 */

App.cfg.modelStatus = {
    fields:[
    {
        name: 'op',
        type: 'string'
       ,text: l10n.operation, dataIndex:'op', width: 88
    }
   ,{
        name: 'args',
        type: 'string'
       ,text: l10n.description, dataIndex:'args', flex: 1
    }
   ,{
        name: 'res',
        type: 'string'
       ,text: l10n.result, dataIndex:'res', width: 42
       ,renderer: function style_res(value, meta){
            if(l10n.stsOK == value)
                return value
            meta.tdCls = 'redwhite'
            return value
        }
    }
    ]
}

Ext.define('App.model.Status',{
   extend: App.model.BaseR,
   fields: App.cfg.modelStatus.fields
})
