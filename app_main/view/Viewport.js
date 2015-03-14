Ext.define('App.view.Viewport',
{
    extend: Ext.container.Viewport,
    requires:[
        'App.view.Bar',
        'App.view.Desktop'
    ],
    layout: 'border',
    items:[
        { xtype: 'app-bar' },//uses    `App.view.items_Shortcuts`
        { xtype: 'desktop' } //deletes `App.view.items_Shortcuts`
    ]
}
)
