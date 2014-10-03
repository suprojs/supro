//TODO: don't use controller here
(// support reloading for development
function(override){
var id = 'App.um.controller.Userman'
   ,cfg = {
    extend: Ext.app.Controller,
    __name: id,
    views:[ 'App.um.view.Userman' ],
    mainView: null,// for development in devtools
    init:
    function controllerUsermanInit(){
    var me = this

        App.backend.req(
            '/um/lib/rbac/all', '',
            function(err, json){
            var i, j, d, a = [ ]

                if(err) return console.error(json)
                // stringify data && create stores
                for(j in { can: '', roles:'', users:'' }){
                    d = json.data[j]
                    for(i in d){
                        a.push([i, JSON.stringify(d[i])])
                    }
                    Ext.create(Ext.data.ArrayStore,{
                        storeId: 'um_' + j,
                        fields:['name', 'v'],
                        data: a
                    })
                    a.splice(0)
                }
                me.mainView = new App.um.view.Userman
                me.mainView.on({
                    destroy: destroyUserman
                })

                return null
            }
        )

        return

        function destroyUserman(){
            //Ext.StoreManager.lookup(sid).destroyStore()
            me.application.eventbus.unlisten(me.id)
            me.application.controllers.removeAtKey(me.id)

            App.User.can['App.view.Window->tools.refresh'] && (
                App.backend.req('/um/lib/rbac/deve')// reload backend api
            )
        }
    }
}
if(override) cfg.override = id
Ext.define(id, cfg)
})(App.um.controller && App.um.controller.Userman)
