СУПРО (supro)
=====

**С**истема **У**правления **ПРО**дажами

A multiuser, distributed, web-based platform with comprehensible
ideas and amount of code to just start developing desktop-like
applications that help an organization running its business.
(E.g. mini-ERP like MS Excel/VBA).

[live and ziped `supro-demo`](https://github.com/suprojs/supro-demo)

developer's POV:

* Full stack JavaScript: Node.JS 0.10, connect 2.9, ExtJS 4.2
  - connect 2.9: with many usability enhancements
  - ExtJS 4.2/GPL: many optimizations and fix patches

* simple config and robust start/stop scripts
 (on MS Windows via `node-webkit` run `node` w/o CLI, others by sh/init.d)

* modular (and has minimal set of dependencies):
  - there are app modules for launching/working with `mongodb` and `lftp`
  - ExtJS applications can be easily converted/adopted to be app module
  - stand alone example module and converted/adopted ExtJS applications (in [`supro-demo`](https://github.com/suprojs/supro-demo))

* distributed use: authentication, authorization, user management module

* simple local use: without auth*n at all

* simple localization: JS in files, per-app module devision

* rapid (hot swap) APP and API development, code-as-you-go for both UI and backend logic;
  reloading of UI component (view + controller + l10n) reloads its API handlers

* only business logic like in VBA/MS Excel (or similar IDEs)

* rich UI (unlike VBA/MS Excel) by ExtJS components framework

* simple req/res API (CRUD with manual if-based routing). Supports `Ext.data.Store` contract

* excessive error handling in both UI and backend with integrated UI/l10n even under `Ext.data.Store` contract

* wes (waiting events): realtime events from server (server push, sse) by simple xhr long pulling for:
  - global app controller
  - stores `App.store.WES`
  - individual models in the store: `model.on('datachanged',...)`

user's POV:

* MDI, shortcuts to launch app modules, top status bar

* user login/authentication with session

* authorization of API (and its UI components) by ACL or RBAC (as app module)

* user status maintained in actual online/offline UI state (away, busy, etc.)

* basic user communication by chat app

[Please see wiki for links and more info.](https://github.com/suprojs/supro/wiki)

**С**истема **У**правления **П**родажами **Р**азмеров **О**буви / **О**дежды
