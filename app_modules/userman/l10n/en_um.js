l10n.um = { lang: 'en'// localization is used only in UI for ease of updates
   ,modname: "User management"
   ,tooltip: "User management, permissions, etc."
   ,user: "User"
   ,users: "Users"
   ,role: "Role/Position"
   ,pass: "Password"

   ,shutdown: 'Exit or block'
   ,connection: 'Network connection state'
   ,userStatus: 'User status'
   ,userStatusMenu: 'User<br/>status list'
   ,userStatuses: { 'onli': 'Online','away': 'Away','busy':'Busy','offl':'Offline' }

   ,chat:{
        title: "Chat",
        users: "Users",
        messages: "== Messages ==",
        tooltip: "Open Chat Window",
        keys:
"'ENTER': send message<br>" +
"'ESC': clear input (history call by DOWN)<br>" +
"'UP': previous text sent<br>" +
"'DOWN': get back text input (after ESC or UP)<br>" +
"'PAGE_UP/PAGE_DOWN': scroll chat room",
        user_in: 'Enter',
        user_out: 'Quit',
        user_reload: 'Reload list of users',
        send: "send"
   }

   ,auth: "Accessing..."
   ,deny: 'Denied'
   ,loginInfo:
'<b>Access requisits:</b><br/>user id, password<br/>' +
'role/position - if needed'
   ,loginUserBlank: 'user id'
   ,loginOk: 'Enter the system'
   ,loginCurrentSession: 'Continue session'
   ,loginConflict: 'Session is Active!'
   ,logoutTitle: 'Session'
   ,logoutMsg: function(id, role){
        return 'End current session?<br><br>' +
               'User: <b>"' + id + '"</b><br>'+
               'Role: <b>"' + role + '"</b>'
    }

   ,l10n: 'Localization setup'
   ,l10nReset: 'Use default configured localization'

   ,roles:{
        'admin.local':  "Administrator with full access to the application"
       ,'admin.remote': "Administrator. User and access management"
       ,'developer.local': "Local Developer with full access to the application"
       ,'developer':    "Remote Developer without full access"

       ,boss:        "Boss, Chief"
       ,manager:     "Manager"
       ,warehouse:   "Warehouse worker"
       ,shop:        "Shop"
       ,accountant:  "Accountant"
   }
   ,can:{
        'App.view.desktop.BackendTools':'Main node.js process management (start/restart/stop)'
       ,'App.backend.JS':               'Running code inside main process (brain)'
   }
  ,'!session_txt': 'No session and/or no plain text username'
  ,'!access': 'Remote access denied (not from `localhost`)'
  ,'!bad_upr': 'Bad user name, password, role'
}
