(function gc(l10n){

App.view.items_Shortcuts = Ext.Array.push(App.view.items_Shortcuts || [ ],[
{
    text:
'<img height="64" width="64" src="' + App.backendURL +
'/css/userman/userman_shortcut.png"/>' +
'<br/><br/>' +
l10n.um.users +
'<br/>'
   ,height:110 ,minWidth:92
   ,tooltip: l10n.um.tooltip
   ,handler:
    function open_userman(btn){
    var tb = Ext.getCmp('wm').items.getByKey('um.view.Userman')
        if(tb){
            tb.toggle(true)
        } else {
            App.create('um.controller.Userman', btn)
        }
    }
}
])

Ext.define('App.um.view.Userman',{
    extend: App.view.Window,
    title: "Data from API: `App.backend.req('/um/lib/rbac/all'`",
    wmImg: App.backendURL + '/css/userman/userman_shortcut.png',
    wmTooltip: 'Userman',
    wmId: 'um.view.Userman',
    autoScroll: !true,
    stateful: true,
    stateId: 'um.u',
    width: 555,
    height: 444,
    layout: 'border',
    items: null,
    initComponent: function initViewUserman(){
        l10n._ns = 'um'
        this.items = [
        {
            region:'north',
            title: 'permissions (what role `can` do)',
            layout: 'fit',
            collapsible: true,
            split: true,
            flex: 1,
            items:[
            {
                xtype: 'grid',
                store: 'um_can',
                columns:[
                { text: l10n('Can'),   dataIndex: 'name' },
                { text: l10n('value'), dataIndex: 'v', flex: 1 }
                ]
            }
            ]
        },
        {
            region:'center',
            title: 'roles as sets of permissions',
            layout: 'fit',
            collapsible: true,
            split: true,
            flex: 1,
            items:[
            {
                xtype: 'grid',
                store: 'um_roles',
                columns:[
                { text: l10n('Roles'), dataIndex: 'name' },
                { text: l10n('value'), dataIndex: 'v', flex: 1 }
                ]
            }
            ]
        },
        {
            region:'south',
            title: 'users as sets of id, roles, pass',
            layout: 'fit',
            collapsible: true,
            split: true,
            flex: 1,
            items:[
            {
                xtype: 'grid',
                store: 'um_users',
                columns:[
                { text: l10n('Users'), dataIndex: 'name' },
                { text: l10n('value'), dataIndex: 'v', flex: 1 }
                ]
            }
            ]
        }
        ]
        l10n._ns = ''
        this.callParent()
    }
}
)
})(l10n)
