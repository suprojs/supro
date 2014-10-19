// local vars to share in hash (kind of macro preprocessing)
var OBJ = 'GLOB'// differentiate instances of distributed SUPRO
var DB  = 'supro_' + OBJ
// global config
config = {
/* NOTE: this is not JSON just JavaScript
 *       idea is taken from github.com/louischatriot/mongo-edit
 */
    /* standard configuration of extjs+node[.js -webkit] application */

    lang: 'ru',// base localization, must be provided by any module as fallback
    log: 'log/',

    //TODO: uid gid new ids for process after start or partial init
    modules:{// cfg for stack of things from 'app_modules'
    // order matters: before auth module there are no restrictions to config

    // NOTE config: one level copy of this properties into default settings
        suprolftpd:{
            OBJ:OBJ
        },
        supromongod:{
            db_name: DB// as in depended modules
        },
    // auth module overwrites default and sets up per-user auth module loading
        userman:{//#0: authentication and authorization (plus Chat)
            store: 'fs' // TODO: fs || db
            //sess_maxage: //null: browser lifetime; default: ~9.3 hours one working day
           ,sess_puzl: 'puzzle-word$54321X'
           ,data: '/data/um/'// store fs: chat logs
           ,rbac:{
               can:{// list of permissions with arbitrary positive value
                    'module.example': true
                }
               ,roles:{
                    'user.test':[
                        'module.example'// select this `can`, etc.
                       ,'App.um.wes', '/um/lib/wes'// NOTE: include this for any role
                       ,'App.um.controller.Chat', 'App.um.view.Chat'
                       ,'/um/lib/chat'
                    ]
                }
               ,users:{
                    'utest':{
                        pass: '9d4e1e23bd5b727046a9e3b4b7db57bd8d6ee684',
                        roles:[ 'user.test' ],
                        name: 'Test User'
                    }
                }
            },
            extjs:{
                wes:{// wait events
                    timeout: 7777777,// 2.16 hours vs max on backend: (1 << 23) = 2.33
                    defer: 77777// if error on minute and half
                }
            }
        }
       /* after auth anything can go in no particular order */
       ,example: true
    },
    extjs:{
        path: 'ext-4.2/',// find and provide this path; 'extjs/' is for web
        launch:  null,/*{ css:[ ], js:[ ]} loaded by `extjs_launch()` */
        modules: null,/*{ css:[ ], js:[ ]} */
        fading:  true// visual effects for content appearance
    },
    backend:{
        file: 'app_main/app_back.js',
        job_port: 3007,
        ctl_port: 3008,
        ctl_on_done: null,// set app module handlers for ctl close/app exit
        init_timeout: 123
       ,extjs:{
            pathFile: 'extjs.txt'// search this file (extjs.txt)
       }
    }
}
