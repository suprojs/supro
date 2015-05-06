/*
 *  setup top bar
 **/
App.view.items_Bar = Ext.Array.push(App.view.items_Bar || [ ],[
    '-'
    ,{
        iconCls: 'appbar-user-onli',// initial in backend by `App.um.wes()`
        id: 'um.usts'
       ,height: 28
       ,tooltip: '', text: ''// filled by controller after auth
       ,menu:{
            xtype: 'menu',
            plain: true,
            items:{
                xtype: 'buttongroup',
                title: l10n.userStatusMenu,
                columns: 1,
                items:(
    function mk_status_list(){
    var s = new Array(5) ,l = [ 'onli', 'away', 'busy', 'offl' ]
        for(var i = 0; i < 4; i++)  s[i] = {
            text: l10n.um.userStatuses[l[i]]
           ,itemId: l[i]
           ,width: '100%'
           //,icon: 'css/user-' +  l[i] + '.png'
           ,iconCls: 'appbar-user-' + l[i]
           ,handler: onItemClick
        }
        s[i] = {
            text: l10n.um.users ,scale: 'large' ,iconCls: 'userman'
           ,handler:
            function open_userman_from_bar(){
            var tb

                if(!App.User.can['App.um.controller.Userman']) return App.denyMsg()

                if((tb = Ext.getCmp('wm').items.getByKey('um.view.Userman'))){
                    tb.toggle(true)
                } else {
                    App.create('um.controller.Userman')
                }
                return this.up('button').hideMenu()
            }
        }

        return s

        function onItemClick(item){
            item.up('button').setIconCls(item.iconCls).hideMenu()
            // send new 4-char status from 'appbar-user-????'
            Ext.globalEvents.fireEventArgs('usts@UI',[ item.iconCls.slice(12)])
        }
    }
                )()// buttongroup.items
            }// menu.items
        }// menu
    }// tbutton
    ,{
        iconCls: 'appbar-shutdown'
       ,height: 28 ,width: 28
       ,tooltip: l10n.um.shutdown
       ,handler: function(){
            Ext.globalEvents.fireEventArgs('logout')
        }
    }
])

var themeLogin = {
    width: 354,
    height: 304
}

Ext.define('App.um.view.LoginWindow',{
    xtype: 'app-login',
    extend: Ext.container.Container,
    layout: 'fit',
    constrain: true, floating: true,
    shadow: false,// mini: no extjs shadow, use CSS
    /* draggable: true, by 'login-dd' in constructor() */
    modal: false,
    form: null, user: null, role: null, pass: null, auth: null,
    style: ''
+'opacity: 0; background-color: #FFFFFF;'
+'padding: 14px;'
+'width: ' + themeLogin.width + 'px; height: ' + themeLogin.height + 'px;'
+'box-shadow:0px 10px 20px #111;'
    ,items: [{
        xtype: 'component'
       ,style: 'width: 100%; height: 100%;'
       ,html:''
+'<div id="progress-bar"'
+'  style="background: url(css/progress-bar.gif) no-repeat center 33px;'
+'          opacity: 0;'
+'          text-align: center;'
+'          width: 100%;'
+'          height: 50px;">'

+'  <div style="text-shadow: #CCC 2px 3px 0;font: 2.2em serif; margin-bottom:22px;">'
+     l10n.um.auth
+'  </div>'
+'  <a href="/">' + l10n.reload + '</a>'
+'</div>'
+'<div id="login-view"'// background is in CSS (for correct and easy image path)
+'  style="position: relative; top: -50px; height: 244px;">'

+'  <div id="login-dd"'
+'    style="cursor: move; text-shadow: #CCC 2px 3px 0; font: 3em serif;">'
+     l10n.app
+'  </div>'
+   l10n.welcome

+'  <div id="login-form">'
+'  </div>'
+   l10n.um.loginInfo
+'  <br/><br/>&copy; 2014 olecom@gmail.com<br/>'
+'  <div id="l10n" style="background-color: #D3D3D3; padding-top: 4px; margin-top: 4px;">'
+'    &nbsp;<span class="ru">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>'
+'    &nbsp;<span class="en">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>'
+'    &nbsp;<span class="l10n-reset"><abbr title="' + l10n.um.l10nReset + '">&nbsp;&nbsp;&nbsp;</abbr></span>'
+'  </div>'
+'</div>'// login-view
    }],
    id: 'login',
    constructor: function constructorLogin(config){
    var me = this
       ,ddId

        me.callParent([config])
        /*
         * after initComponent()
         * Movable Container: make drag handler on top, not whole area
         * open code `Ext.panel.Panel.prototype.initSimpleDraggable.call(me)`
         */
        ddId = '#login-dd'
        me.dd = new Ext.util.ComponentDragger(me,{
            id: ddId.slice(1),
            el: me.el,
            constrain: me.constrain,
            constrainTo: me.constrainTo,
            delegate: ddId
        })
        me.relayEvents(me.dd,['dragstart', 'drag', 'dragend'])
 	},
    destroy: function(){
        Ext.destroy(this.dd, this.form)
        this.form = null
        this.callParent()
    },
    initComponent: function initLogin(){
    var me = this
       ,d = { duration: 1234, callback: null }
       ,t = { duration: d.duration }
       ,a = { duration: t.duration, height: 99, callback: null }
       ,login

        me.callParent()
        me.render(Ext.getBody())// 'cos `floating: true`

        // the fancy show up
        me.getEl().fadeIn(d)
        me.fadeOut = function(cb){
            if(cb) d.callback = cb
            me.getEl().fadeOut(d)
            d.callback = null
        }

        login = Ext.get('login')
        me.fadeInProgress = function(cb){
            Ext.get('progress-bar').fadeIn(t)
            Ext.get('login-view').fadeOut(t)
            a.height = 99
            if(cb) a.callback = cb
            login.animate(a)
            a.callback = null
        }

        me.fadeOutProgress = function(cb){
            Ext.get('progress-bar').fadeOut(t)
            Ext.get('login-view').fadeIn(t)
            a.height = 297// <-> themeLogin.height
            if(cb) a.callback = cb
            login.animate(a)
            a.callback = null
        }

        me.form = Ext.widget({// build login form
            renderTo: 'login-form',
            xtype: 'form',
            url: '',
            frame:false,
            width: '100%',
            buttonAlign:'left',
            border:false,
            //defaultType: 'textfield',
            hideLabels: true,
            cls: 'transparent',
            margin: '20px 0 0 0',
            items:[{
                /* ExtJS 5 deprecated: 'Ext.form.field.Text'.triggers */
                xtype: 'triggerfield',
                triggerCls: 'login-shutdown',
                name: 'user',
                emptyText: l10n.um.loginUserBlank,
                width: 177,
                allowBlank: true,
                enableKeyEvents: true,
                hideTrigger: true
                //onTriggerClick: logic is in controller
            },{
                //the width of this field in the HBox layout is set directly
                //the other 2 items are given flex: 1, so will share the rest of the space
                xtype: 'combo',
                name: 'role',
                width: 177,
                queryMode: 'local',
                value: l10n.um.role,
                triggerAction: 'all',
                editable: false,
                displayField: 'role',
                valueField: '=',
                store: Ext.create(Ext.data.Store,{
                    fields: [ 'role', '=' ]
                }),
                disabled: true
            },{
                xtype: 'textfield',
                name: 'pass',
                emptyText: '*******',
                width: 133,
                inputType: 'password',
                allowBlank: false,
                disabled: true
            },{
                xtype: 'button',
                width: 133,
                iconCls: 'ok',
                itemId: 'ok',
                text: l10n.um.loginOk,
                disabled: true
            }]
        })

        me.user = me.form.down('field[name=user]')
        me.role = me.form.down('field[name=role]')
        me.pass = me.form.down('field[name=pass]')
        me.auth = me.form.down('button[iconCls=ok]')
    }
})
