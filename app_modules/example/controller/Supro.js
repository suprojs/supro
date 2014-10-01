(// support reloading for development
function(override){
var id = 'App.example.controller.Supro'
   ,cfg = {
    extend: Ext.app.Controller,
    __name: id,
    views:[
        'App.example.view.Supro'
    ],
    supro: null,// dev tools: App.getApplication().getController('App.example.controller.Supro').supro
    init:
    function controllerSuproInit(){
    var me = this
       ,supro = new App.example.view.Supro

        me.supro = supro

        // init view
        supro.on({
            destroy: destroySupro
        })

        //supro.maximize()
        return

        function destroySupro(){
            me.application.eventbus.unlisten(me.id)
            me.application.controllers.removeAtKey(me.id)
        }
    }
}
if(override) cfg.override = id
Ext.define(id, cfg)
})(App.example && App.example.controller.Supro)
