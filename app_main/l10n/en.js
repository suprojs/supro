l10n = { lang: 'en',
    app: 'SUPRO Demo'
    ,'': "empty"
    ,welcome: 'SUPRO welcomes: application development'
    ,reload: 'reload',

    loading: 'Loading...'
    ,oops_rcif: 'OOPS: restricted code in frontend'
    ,errapi: 'Error loading data by API call:'
    ,errload: 'Loading failed due to errors.'
    ,errload_no_app:
'Installation error! File not found: "app_front.js".\n' +
'Check of configuration is needed.'
    ,errload_config_read:
'Config file open error!'
    ,errload_config_parse:
'Config file reading error!'
    ,errload_fast_config_nwjs:
'[FAST LOAD] config `load` || `loadMiniInit`: is not supported in `nw.js`'
    ,errload_config_log_not_dir:
'Error: fail to read log directory.\n' +
'Config option:: '
    ,errload_config_log_mkdir: 'Error: fail to create log directory.'
    ,errload_spawn_backend: 'Error starting backend! Error code: '
    ,errload_check_backend: '\n' +
'Error! Backend of the system has started but there is no HTTP access to it!\n' +
'Possibly firewall or antivirus is blocking TCP/IP.\n\n' +
"Assistance is needed: system administrator's or developer's."
    ,errun_title: 'ERROR in program execution'
    ,errun_file: 'File: '
    ,errun_stack: 'Error and call stack: '
    ,tray:{
        title: 'SUPRO'
        ,winvis: 'SUPRO window is visible'
        ,wininv: 'SUPRO window is hidden'
    }

    ,via_proxy:function(url){ return ''+
'Server address for remote users goes via PROXY!' + '\n' +
'There may be problems connecting from the network.\nURL = ' + url
    }

    ,extjsNotFound:
        'Fail to load "ExtJS" (UI framework).\n' +
        'Check of application configuration is needed.'
    ,extjsPathNotFound: function(shortcut_config, config, j){
        var name_example = '\n\n'+
'Example of ExtJS 4.2.1 release directory name: "ext-4.2.1.883".'
           ,about_file = ''+
'File `' + shortcut_config + '` in app root directory, ' +
'either not found or has wrong directory name (ExtJS location).' +
name_example

        if(1 == j){
            return ''+
'Config option `config.extjs.path` = "' + config +
'" has not correct directory (ExtJS location).\n\n' +
about_file
        }
        if(2 == j){
            return ''+
'Empty `config.extjs.path` option.\n\n' +
about_file
        }
        return '' +
'Neither local file `' + shortcut_config +
'`,\nnor `config.extjs.path` = "' + config +
'"\npoints to ExtJS location.' +
name_example
    }
    ,uncaughtException: "Unexpected internal error! Developer's assistance is needed.\n"
    ,warn_js: 'JS eval is allowed from any external connection to backend!'

    ,stsSystem: 'Backend (main) process connection. Info/Log.'
    ,stsHandleTipTitle: 'What happens inside of the system?'
    ,stsHandleTip: 'Double click on gears to open/close window'
    ,stsStart: 'START main `nodejs`'
    ,stsCheck: 'CHECK main `nodejs`'
    ,stsRestarting: '(2 sec.) starting new `nodejs`'
    ,stsKilling: 'KILL/TERMINATE `nodejs` (hangs)'
    ,stsShutdown: 'SHUTDOWN main `node.js`'
    ,stsBackendPid: function(pid){
        return '' + pid + ' - PID of the main `node.js` process of the system'
    }
    ,stsBackendXHR: "connection to the main nodejs process"
    ,stsOK: 'OK'
    ,stsHE: 'FAIL'
    ,stsClean: 'Clear'
    ,stsEcho: 'Request-check'
    ,stsRestart: 'Restart'
    ,stsStopSystem: 'Shutdown the system'
    ,stsKill: 'Terminate/kill process (hangs)'
    ,stsKilled: 'main process is "killed"'
    ,stsKilledAlready: 'main process is already "dead"'
    ,stsAlive: 'main process is "alive"'
    ,stsDead: 'Ignore request. Restart is needed'
    ,stsMsg: 'Messages: '
    ,stsMarkRead: 'Mark all as read'

    ,btnAdd: 'Add'
    ,btnCreate: 'Create'
    ,btnEdit: 'Edit'
    ,btnCancel: 'Cancel'

    ,copyCtrlC: 'CTRL+C copies cell'
    ,selectAll: 'Select all rows'

    ,formNoChange: 'No changes'
    ,formNoChangeMsg: 'The Form has no changes!'

    ,time: 'Time'
    ,operation: 'Operation'
    ,description: 'Description'
    ,result: 'Result'

    /* DATA EXCHANGE */

    // fronend error messages
    ,emptyTextGrid: '--== No data ==--'
    ,err_crud_proxy: 'Network/Backend request failed. Fatal. Call for developer/admin.'

    // backend error codes
    ,'!session': 'Session has ended. New login required. Unsaved data move to MS Excel.'
    ,'!handler': 'No such handler in backend logic.'
    ,'!auth': 'Access denied.'
    ,'!db': 'Data Base is unavailable. Fatal. Call for developer.'
    ,'!such_subapi': 'No such sub API.'

    ,'!transs': 'trans_start_fail'
    ,'!transe': 'trans_end_fail'
    ,'!hsts': 'failed history start'
    ,'!hste': 'failed history end'
    ,'error index': 'Duplicate SKU insert or other Index error'
    ,MongoError: 'FATAL Mongo Error. Call for developer.'
    ,TypeError: 'Programming error (TypeError). Call for developer.'
    ,ReferenceError: 'Programming error (ReferenceError). Call for developer.'
    ,Error: 'Programming error (Error). Call for developer.'
    // backend applicaiton errors (non fatal or wrong input)
    //,'~exists': 'Already exists.'

    ,um: null // user manager
}
