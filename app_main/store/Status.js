/**
 * Store for System's `model.Status`
 */
Ext.define('App.store.Status',{
	extend: Ext.data.Store,
    singleton: true,// single instance for status
    storeId: 'app-status',
    model: App.model.Status,
    readItems: 0,
    stsCountView: null,
    listeners:{
        add: function(){
            this.readItems++
            this.showReadAllCount()
        },
        update: function(){
            this.readItems--
            this.showReadAllCount()
        },
        clear: function(){
            this.readItems = 0
            this.showReadAllCount()
        }
    },
    showReadAllCount: function showReadAllCount(){
        var me = this
        if(!me.stsCountView){
            me.stsCountView = document.getElementById('stscount')
        }
        if(me.stsCountView)
            me.stsCountView.innerHTML = me.readItems + '/' + me.data.getCount()
    },
    markAllAsRead: function markAllAsRead(){
        var data = this.data.items,
            l = data.length,
            d = 0
        Ext.suspendLayouts()
        for (; d < l; d++)
            if(data[d].data.n)
                data[d].set('n', false)
        Ext.resumeLayouts(true)
    }
})
