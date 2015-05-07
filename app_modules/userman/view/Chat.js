/*
 * Chat Logic
 **/


App.view.items_Shortcuts = Ext.Array.push(App.view.items_Shortcuts || [ ],[
{// setup shortcuts
    text:
'<img height="64" width="64" src="' + App.backendURL +
'/css/userman/chat_64px.png"/>' +
'<br/><br/>' +
l10n.um.chat.title +
'<br/>'
   ,height:110 ,minWidth:92
   ,tooltip: l10n.um.chat.tooltip
   ,handler:
    function open_chat(btn){
    var tb = Ext.getCmp('wm').items.getByKey('um.view.Chat')
        if(tb){
            tb.toggle(true)
        } else {
            App.create('um.controller.Chat', btn)
        }
    }
}
])

Ext.define('App.um.view.Chat',
{
    extend: App.view.Window,
    title: l10n.um.chat.title,
    wmImg: App.backendURL + '/css/userman/chat_64px.png',
    wmTooltip: 'Chat',
    wmId: 'um.view.Chat',
    width: 777,
    height: 444,
    layout: 'border',
    stateful: true,
    stateId: 'um.c',
    onEsc: Ext.emptyFn,
    items:[
    {// chat input
        region: 'south',
        collapsible: !true,
        layout: 'hbox',
        items:[
        {
            xtype: 'tool',
            type: 'help',
            tooltip: {
                text: l10n.um.chat.keys,
                dismissDelay: 23456
            }
        },
        {
            xtype: 'textfield',
            fieldLabel: '<b>' + App.User.id + '</b>>',
            labelSeparator: '',
            labelWidth: 'auto',
            padding: '0 0 0 5',
            fieldStyle: 'font-family: Tahoma, sans-serif; font-size: 12pt;',
            flex: 1
        },
        {   xtype: 'button', text: l10n.um.chat.send, iconCls: 'ok' }
        ]
    },{
        region: 'east',
        title: l10n.um.chat.users,
        layout: 'fit',
        collapsible: true,
        split: true,
        width: 150
        //items: with dynamic stuff are filled by the controller
    },{
        region: 'center',
        autoScroll: true,
        itemId: 'cr',// chat room
        bodyStyle: 'font-family: Tahoma, sans-serif; font-size: 12pt; background-color: black;',
        layout:{
            type: 'table',
            columns: 3,
            tableAttrs:{
                style: 'color:#FFFFFF; width:100%; padding: 0 0 16px 8px;'
            }
        }
        //items: with dynamic stuff are filled by the controller
    }
    ]
}
)
