App.cfg.modelChatUser = {
    url: '/um/lib/chat/user',
    fields:['_id'],
    columns:[
    {
        dataIndex: '_id',
        flex: 1,
        renderer:
        function rendererChatUser(v){
        var sts = v.slice(0, 4)
           ,vv = v.slice(4)

            if(0 === v.indexOf(App.User.id)){
                vv = '<b>' + vv + '</b>'
            }

            return '<i data-qtip="' +
                l10n.um.userStatuses[sts] + '" class="appbar-user-' +
                sts + '"></i>' + vv
        }
    }
    ]
}

Ext.define('App.um.model.chatUser',{
    extend: App.model.BaseCRUD,
    fields: App.cfg.modelChatUser.fields
})
