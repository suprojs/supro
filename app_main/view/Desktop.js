
Ext.define('App.view.desktop.Shortcuts',{
    extend: Ext.toolbar.Toolbar,
    xtype: 'app-shortcuts',
    style: 'background-color:white;background-image:none;'

    //,stateId: 'dpss'
    //,stateful: true

    ,enableOverflow: true
    ,defaults: {
        reorderable: true
    }
    ,plugins : [ { xclass: 'Ext.uxo.BoxReorderer' } ]
    ,initComponent: function shortcuts_dynamic_init(){
        var me = this

        me.items = Ext.Array.push([
            {
            xtype:'splitbutton',
            text: 'Draggable / Reorderable Menu Button',
            iconCls: 'ok',
            menu: App.view.items_Shortcuts// app modules items
            }
            ]
           ,App.view.items_Shortcuts
        )

        me.callParent(arguments)
        delete App.view.items_Shortcuts
    }
})

Ext.define('App.view.Desktop',
{
    extend: Ext.Container,
    id: 'desk',
    xtype: 'desktop'
   ,region: 'center'// border layout
   ,style: 'overflow: hidden;'
   ,border: false
   ,items:[
        { xtype: 'app-shortcuts' }
    ]
   ,initComponent:
    function init_Desktop(){
    var me = this

        me.on({
        'boxready':{
            'single': true,// once on load
            fn: initDesktopStatus
        }})

        me.callParent()
        return

        function initDesktopStatus(){
        var ss = Ext.create('App.view.desktop.Status')
            me.add(ss)// for `constrain` + resizing of parent
            Ext.defer(wait_desktop_layout, 256)
            return

            function wait_desktop_layout(){// layouts are not always available
            var r = me.getRegion()
                ss.show()// floating Component show() manually
                App.store.Status.showReadAllCount()// custom manual setup
                Ext.tip.QuickTipManager.register({
                    target: ss.down('image').getEl().id,
                    title: l10n.stsHandleTipTitle,
                    text: l10n.stsHandleTip,
                    width: 244,
                    showDelay: 1024,
                    dismissDelay: 0
                })

                ss.down('image').getEl().on({
                    'dblclick': function(){
                        var r = me.getRegion()
                           ,s = ss.getRegion()
                        if(s.bottom - s.top < 100){//small 2 big
                            ss.animate(animate_up(350, 650, 96, 84, 18, r))
                        } else {// reverse
                            ss.animate(animate_up(
                                s.bottom - s.top,
                                s.right - s.left,
                                96, 84, 18, r, true)
                            )
                        }
                    }
                })

                ss.setXY([r.right - 18, r.bottom - 18])
                ss.animate(animate_up(96, 84, 7, 7, 18, r))
                ss.getEl().setStyle('z-index', 999999)// very always on top
                me.on({// don't loose status outside application window
                'resize': function(){
                    var r = me.getRegion()
                       ,f = ss.getRegion()
                    if(f.top >= r.bottom || f.left >= r.right){
                        ss.animate({
                            to:{
                                y: r.bottom - 18 - 96,
                                x: r.right - 18 - 84
                            }
                            ,easing: 'elasticOut'
                            ,duration: 678
                        })
                    }
                }})
                function animate_up(h, w, f, g, d, r, t){
                var fx = { duration: 256, keyframes: {} }
                   ,grid = ss.down('grid')
                    t = t ? ['100%', '60%', '40%', '0%' ]:
                            ['0%', '40%', '60%', '100%' ]

                    fx.keyframes[t[0]] = {
                        y: r.bottom - f - d
                       ,x: r.right - g - d
                       ,width:  g + 0000
                       ,height: f + 0000
                    }
                    fx.keyframes[t[1]] = {
                        y: r.bottom - d - h/4
                       ,x: r.right - d - w/4
                       ,width:  w/4
                       ,height: h/4
                    },
                    fx.keyframes[t[2]] = {
                        y: r.bottom - d - h/2
                       ,x: r.right - d - w/2
                       ,width:  w/2
                       ,height: h/2
                    },
                    fx.keyframes[t[3]] = {
                        y: r.bottom - d - h/1
                       ,x: r.right - d - w/1
                       ,width:  w/1
                       ,height: h/1
                    }

                    Ext.defer(function(){
                        grid.show()
                        grid.getEl().fadeIn({ duration: 512 })
                    }, 1024)
                    grid.getEl().fadeOut({ opacity: 0, duration: 0 })
                    grid.hide()

                    return fx
                }
            }
        }
    }
}
)
