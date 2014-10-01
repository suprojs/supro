Ext.define('App.example.view.Supro',
{
    extend: App.view.Window,
    title: l10n.ex.title,
    wmImg: App.backendURL + '/css/example/yd.png',
    wmTooltip: l10n.ex.tooltip,
    wmId: 'example.view.Supro',
    id: 'example-view-Supro',
    width: 777, height: 477,// initial
    layout: 'border',
    items:[
    {
        xtype: 'treepanel',
        region: 'west',
        split: true,
        bodyPadding: 5,
        minWidth: 185,
        width: 185,
        rootVisible: false,
        store: Ext.create('App.example.store.TreeMainMenu')
    },
    {
        region: 'center'
    },
    {
        region: 'south',
        split: true,
        height: 123
    }
    ]
}
)
