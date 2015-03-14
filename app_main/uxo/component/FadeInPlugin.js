/*
 by "The One" @ http://whatisextjs.com/extjs/extjs-4-2-plugin-example
 usage: `plugins: ['ux.fadeinplugin']`
 */
Ext.define('Ext.uxo.component.FadeInPlugin', {
    extend: 'Ext.AbstractPlugin',
    alias: 'plugin.ux.fadeinplugin',
    requires: ['Ext.fx.Anim'],
 
    init: function (component) {
    //component.show()
        Ext.apply(component, {
            style: {
                //opacity: 0
            }
        });
        component.fadeIn = this.fadeIn.bind(component);
        
    },
 
    fadeIn: function () {
        var me = this;
        Ext.create('Ext.fx.Anim', {
            target: me,
            duration: 400,
            from: {
                opacity: 0
            },
            to: {
                opacity: 1
            }
        });
    } // eo fadeIn()
});
