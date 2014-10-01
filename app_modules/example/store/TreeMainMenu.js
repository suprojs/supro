Ext.define('App.example.store.TreeMainMenu', {
    extend: Ext.data.TreeStore,
    proxy: {
        type: 'ajax',
        limitParam: null,
        url: App.backendURL + '/example/api/store/TreeMainMenu.json',
        reader: {
            type: 'json'
        }
    },
    autoLoad: true
})
