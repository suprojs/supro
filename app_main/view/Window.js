Ext.define('App.view.Window',
{
    extend: Ext.window.Window,
    wm: null,//task bar / window manager button
    wmImg: 'css/ok.png',
    wmTooltip: 'wm tooltip',
    constrainHeader: true,// doesn't work properly
    autoShow: true,
    maximizable: true,
    __resizeLock: false,// see `setHeight()` below
    layout: 'fit',
    tools: void 0,
    initComponent:// anti-MVC pattern, doing all here, but this is MVVM damn!
    function initSubAppWindow(){
    var me = this

        me.tools = [
        {
            type: 'refresh',
            tooltip: ''// developer's stuff must have no `l10n`
+'view developent reload: <b>l10n</b>, <b>view</b> && <b>controller</b><br>'
+'<b style="color:red">NOTE</b>: no models or stores etc. are reloaded<br>'
+'hook to <b>thisView.on("destroy")</b> event to reload anything else<br>'
+'<b>Classes:</b><br>' + (me.__ctl || '') + '<br>' + me.$className,
            callback: App.reload
        },
        {
            type: 'help',
            tooltip: 'Get Help Abstract',
            callback: App.getHelpAbstract
        }]

        if(!me.constrainTo) me.constrainTo = Ext.getCmp('desk').getEl()
        me.callParent()

        me.wm = Ext.getCmp('wm').add({
            text: '<img height=16 width=16 src="' + me.wmImg + '"/>',
            itemId: me.wmId || '',
            enableToggle: true,
            pressed: true,
            tooltip: me.wmTooltip,
            toggleHandler: me.on_WM_toggle,
            scope: me
        })
        me.on({
            maximize: me.maximize_view_window,
            resize: me.fix_maximized_height,
            destroy: me.on_close_window,
            activate: me.on_activate_window,
            deactivate: me.on_deactivate_window
        })

        return
    },
    fix_maximized_height: function fixMaximizedHeight(w){
   /* Fix bug with `constrainTo` window, which is wrongly maximized
    * - maximize: initial event
    * - resize: browser window resizes
    **/
        if(w.maximized && !w.__resizeLock){
            w.__resizeLock = true
            w.setHeight(w.getHeight() - 34)// fix `constrainTo`
            w.__resizeLock = false
        }
    },
    maximize_view_window: function maximizeViewWindow(w){
        w.__resizeLock = true
        w.setHeight(w.getHeight() - 34)// fix size
        w.__resizeLock = false
    },
    on_close_window:function onCloseWindow(){
        Ext.getCmp('wm').remove(this.wm, /*autoDestroy:*/ true)
        this.wm = null
    },
    on_activate_window: function onActivateWindow(){
        this.wm.toggle(true, true)
    },
    on_deactivate_window: function onDeactivateWindow(){
        this.wm.toggle(false, true)
    },
    on_WM_toggle: function onWMToggle(_, next_state){
    var me = this// window
        if(next_state){
            Ext.WindowManager.front.setActive(false)
            me.isHidden() && me.show()
            me.setActive(true)
        } else {
            me.hide()
            me.wm.toggle(false, true)
            Ext.WindowManager.front.setActive(true)
        }
    }
}
)
