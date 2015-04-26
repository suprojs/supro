Ext.syncRequire( '/l10n/' + l10n.lang + '_example')// require l10n first time

App.view.items_Shortcuts = Ext.Array.push(App.view.items_Shortcuts || [ ],[
{
    text:
'<img height="77" width="77" src="' + App.backendURL +
'/css/example/yd.png"/>' +
'<br/>' + l10n.ex.modname
   ,height: 110 ,minWidth: 92
   ,tooltip: l10n.ex.tooltip
   ,itemId: 'example.view.Supro'
   ,handler:
    function launch_example(btn){
    var tb = Ext.getCmp('wm').items.getByKey(btn.itemId)

        if(tb){
            tb.toggle(true)
        } else {
            App.create('example.controller.Supro', btn)
        }
    }
}
])
