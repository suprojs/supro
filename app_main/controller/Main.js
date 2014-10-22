/**
 * Main controller for all top-level application functionality
 */
Ext.define('App.controller.Main',{
    extend: Ext.app.Controller,
    init: function controllerMainInit(){
        var me = this
           ,createViewport// function var for GC init

        createViewport = handleCreateViewport
        me.listen({
            global:{
                createViewport: createViewport
               ,updateVersions: updateVersions
            }
        })

        return

        function updateVersions(){
        var el = Ext.get('versions'), _2 = { opacity: 0 }

            el.animate({
                to: _2,
                duration: 1024,
                callback: function versionFadeOut(){
                    el.setHTML(('-= versions =-\n'+
'extjs:,' + Ext.versions.extjs.version + '\n' +
           (App.cfg.backend.url ?
'nodejs:,' + App.cfg.backend.versions.node +
'connectjs:,' + App.cfg.backend.versions.connectjs +
'node-webkit:,'+ App.cfg.backend.versions.nw : '')
                ).replace(/\n/g,'</b><br>').replace(/,/g, '<br><b>')
                    )
                    _2.opacity = 1
                    el.animate({
                        to: _2,
                        duration: 1024,
                        callback: function versionFrameAnim(){
                            el.frame("00FF00", 1, { duration: 1024 })
                        }
                    })
                }
            })
        }

        function handleCreateViewport(){
        var b

            if(App.cfg.extjs.fading){
                b = Ext.getBody()
                // very strange composition to get gears to fadeOut and viewport to fadeIn
                b.fadeOut({duration:777 ,callback:
                function fadingViewport(){
                    Ext.fly('startup').remove()
                    b.show()
                    Ext.create('App.view.Viewport')
                    b.fadeIn({
                        easing: 'easeIn',
                        duration: 1024,
                        callback: appReady
                    })
                    b = null
                }
                })
            } else {
                Ext.fly('startup').remove()
                Ext.create('App.view.Viewport')
                appReady()
            }
        }

        function appReady(){
           /* dynamic controller for dynamic models
            * due to reversed loading (Controller first, not Model)
            * this doesn't work:
              application.config: {
                   models: [ 'Base', 'BaseR', 'Status' ],
                   stores: [ 'Status' ],
                   controllers: [ 'Main' ]
               }
            **/
            me.suspendEvent('createViewport')
            if(createViewport) createViewport = null// GC init

            App.sts(// add first System Status message
                App.cfg.backend.op,
                App.cfg.backend.msg,
                l10n.stsOK,
                App.cfg.backend.time
            )
            delete App.cfg.backend.op
            delete App.cfg.backend.msg
            delete App.cfg.backend.time

            if(App.um.wes){// catch possible errors before events from `wes`
                return check_uncaughtExceptions()
            }// else check periodically
            setInterval(check_uncaughtExceptions, 2048)
        }

        function check_uncaughtExceptions(){
            App.backend.req('/uncaughtExceptions',{/* dummy hash to get JSON */},
            function(err, data){
                if('developer.local' != App.User.can.__name &&
                   'admin.local'     != App.User.can.__name){
                    return
                }
                console.log('uncaughtExceptions err: ', err)
                if(data && data.length){
                    console.table(data)
                    Ext.Msg.alert({
                        buttons: Ext.Msg.OK,
                        icon: Ext.Msg.ERROR,
                        title: 'uncaught@global on start',
                        msg: Ext.encode(data).replace(/\\n/g, '<br>'),
                        fn: function(btn){
                            //if('yes' == btn)...
                        }
                    })
                }
            })
        }
    }
})
