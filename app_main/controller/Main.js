/**
 * Main controller for all top-level application functionality
 */
Ext.define('App.controller.Main',{
    extend: Ext.app.Controller,
    init: function controllerMainInit(){
        var me = this

        me.listen({
            global:{
               updateVersions: updateVersions
            }
        })

        return

        /*
         * `nw.js` context: live update of versions when backend was restarted/updated
         */
        function updateVersions(){
        var el = Ext.get('versions'), _2 = { opacity: 0 }

            el.animate({
                to: _2,
                duration: 1024,
                callback: function versionFadeOut(){
                    el.setHTML(('-= versions =-\n'+
'extjs:,' + Ext.versions.extjs.version + '\n' +
           (App.backendURL ?
'nodejs:,' + App.cfg.backend.versions.node +
'connectjs:,' + App.cfg.backend.versions.connectjs +
'nw.js:,'+ App.cfg.backend.versions.nw : '')
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
    }
})
