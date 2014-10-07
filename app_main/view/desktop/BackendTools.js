Ext.define('App.view.desktop.BackendTools',{
    extend: Ext.toolbar.Toolbar,
    dock: 'bottom',
    items:[ '-','nodejs: ',{
        text: l10n.stsEcho
       ,iconCls: 'sg-e'
       ,handler: function(){
            if(App.doCheckBackend)// request, check/sync $PID
                App.doCheckBackend()
            else Ext.Error.raise({
                msg: l10n.oops_rcif,
                sourceClass:'App.view.desktop.BackendTools',
                sourceMethod: 'App.doCheckBackend'
            })
       }
    },'->','-',{
        text: l10n.stsStopSystem
       ,iconCls: 'sg-s'
       ,handler: function(){
            if(App.doShutdownBackend)
                App.doShutdownBackend()
            else Ext.Error.raise({
                msg: l10n.oops_rcif,
                sourceClass:'App.view.desktop.BackendTools',
                sourceMethod: 'App.doShutdownBackend'
            })
       }
    },'-',{
        text: l10n.stsRestart
       ,iconCls: 'sg-r'
       ,handler: function(){
            if(App.doRestartBackend)// request cmd_exit, respawn, recheck
               App.doRestartBackend()
            else Ext.Error.raise({
                msg: l10n.oops_rcif,
                sourceClass:'App.view.desktop.BackendTools',
                sourceMethod: 'App.doRestartBackend'
            })
       }
    },'-','->',{
        text: l10n.stsKill
       ,iconCls: 'sg-k'
       ,handler: function(){
            if(App.doTerminateBackend)// spawn `terminate.wsh $PID`
                App.doTerminateBackend()
            else Ext.Error.raise({
                msg: l10n.oops_rcif,
                sourceClass:'App.view.desktop.BackendTools',
                sourceMethod: 'App.doTerminateBackend'
            })
        }
    }]
})
