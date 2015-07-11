#!/bin/sh

[ "$1" = '?' -o "$1" = '-h' -o "$1" = '--help' ] && exec sed '' <<'!'
# the first command line argument '$1' can be:
# * 'justsplit': split `ext-all-debug.js` into EXTJSLITE and EXTJSREST,
#           process mini init and fast load
# * 'lite': process mini init and fast load using existing EXTJSLITE and EXTJSREST
#           this is useful for development of fast loading logic
# * 'strip': don't split
# * ''/'*': do all
# also do whitespace and leaked in comments cleanup of 'github.com/suprojs/extjs-4.2/'
# JSFILE=`ext-all-debug.js` into NWFILE='ext-all-nw.js', save ~1.4M of file size
# and $EXTJSLITE and $EXTJSREST fast init versions if configured
!

set -e

trap 'echo "
Unexpected Script Error! Use /bin/sh -x $0 to trace it.
"
set +e
trap "" 0
exit 0
' 0 # catch errors

ME="$0 $*"
JSFILE='ext-all-debug.js'
NWFILE='ext-all-nw.js'

EXTJSLITE='ext-lite'
EXTJSREST='ext-rest'
EXTJSCLASSES='extjs-classes.txt'

CWD="./$0"
CWD="${CWD%/*}" # get path to supro dir where this script must be in
# use `mingw/git` distro minimum (i.e. no `dd`, `stat`)
type git >/dev/null 2>&1 || {
    PATH="./bin/:$PATH"
    echo >&2 '
NOTE: Use Git-MINGW32 for development under MS Winsows(R)
      https://msysgit.github.io/
'"Adding '$CWD/bin' to PATH
"
}
cd "$CWD"

[ -f extjs.txt ] || {
    # whatever config, setup ExtJS 4
    echo >&2 '
Error: no "extjs.txt" file present.

Run `nw` first time. It will search for configured ExtJS path.
Or manually write PATH of ExtJS4 distro into it.
e.g.:
../extjs-4.2/

Such ExtJS4 distro is located in SUPRO git repo and can be cloned:'

    EXTJS4=`sed '
/"extjs":/,/^ *}/{
  /"url"/{
    s| *"url": *"\([^"]*\)".*|\1|
    s|#| |p;d;q}
  }
  d
' <package.json`
    # delete branch
    EXTJS4=${EXTJS4%% *}
    echo >&2 '
$ git clone '"$EXTJS4"

    if type git
    then
        echo -n >&2 "
Clone now?(y/n) "
        read A
        [ 'y' = "$A" ] && {
            git clone "$EXTJS4" 'extjs-4.2' && {
                echo "Writing 'extjs-4.2/' into '$PWD/extjs.txt'"
                echo './extjs-4.2/' >extjs.txt
            } || {
                echo >&2 '
`git` failed, exit.'
                trap '' 0
                exit 1
            }
        }
        # goto ExtJS processing
    else
        trap '' 0
        exit 1
    fi
}

#### whitespace ####

strip_whitespace(){
# $1 -- stdin
# $2 -- stdout
# also delete leaked in comments (usually after some REs: 'compileCRe', 'tagRe', etc.)
# use simple '/^[/*]/d' for that as lines are whitespace clean
# and no such symbol may start source code line (except curved RegExp assignments)

    echo "
= strip front whitespace =
INPUT:  '$1'
OUTPUT: '$2'
" >&2

    sed '
1b
8b
20b
5,15d
19s/.*/Source: '"$JSFILE"' ('"$HEAD"')/
/^[[:blank:]]*$/d
/^[[:blank:]]/s/[[:blank:]]*//
/^[/*]/d
' <"$1" >"$2"

    FSIZE=`du -b "$1"`
    FSIZE=${FSIZE%%?[/.]*}
    oIFS=`du -b "$2"`
    echo "size: $FSIZE diff: $(( ($FSIZE - ${oIFS%%?[/.]*})/1024 )) kibytes" >&2
# strip filename from `du` output where tab[\t] char is a separator:
# 2218376[\t]../../../extjs-4.2/ext-all-nw.js
# 2218376[\t]/d/extjs-4.2/ext-all-nw.js
#        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^= ${oIFS%%?[/.]*}
}

css(){
    echo "
/$1/{
  r app_main/$1
  a \
  /*]]>*/</style>
  c \
  <style>/*<![CDATA[ $1 */
}"
}

strip_css_html(){
    echo "
= strip HTML =
INPUT:  '$1'
OUTPUT: '$2'
" >&2
    # include css as CDATA
    sed "`css app.css`" <"$1" | sed "
/^[[:blank:]]*$/d
/^[[:blank:]]/s/[[:blank:]]*//
/^localStorage.devSUPRO = '1'/d
# remove file loading
/^startup('App.js/s_.*_startup('/extjs/ext-lite-nw.js')_
" >"$2"

}

#### split ####

sed_skip_class(){
# $1 -- class name
# make `sed` code to skip class in "$1"
    echo "
/^Ext.define('$1/,/^});/b
"
}

sed_mv_class(){
# $1 -- class name
# $2 -- result postfix ('-nw.js') from `split_extjs()`
# make `sed` code to remove class in "$1"
    echo "
/^Ext.define('$1/,/^});/{
    w $EXTJS4$EXTJSREST$2
    d
}
"
}

sed_rm_class(){
    echo "
/^Ext.define('$1/,/^});/d
"
}

sed_phony_class(){
    echo "
/^Ext.define('$1/i\
Ext.ns('$1');$1=Ext.emptyFn;
"
    sed_rm_class "$1"
}

process_classes(){
# read lines from $RMCLASSES and construct `sed` code
    oIFS=$IFS
    IFS=`printf '\n_'`
    IFS=${IFS%_} # `\n=LF` as the field separator
    for i in `sed '/^[# ]/d' <"$EXTJSCLASSES"` # skip comment and whitespace lines
    do case "$i" in
    '~'*) sed_rm_class "${i#?}";; # >/dev/null
    '!'*) sed_skip_class "${i#?}";; # skip
    '-'*) sed_phony_class "${i#?}";; # put a class stub
    *) sed_mv_class "$i" "$1";;
       esac
    done
    IFS=$oIFS
}

split_extjs(){
    echo "
= ExtJS lite / the rest =
INPUT: '$EXTJS4$JSFILE'
LITE:  '$EXTJS4$EXTJSLITE$1'
REST:  '$EXTJS4$EXTJSREST$1'
" >&2

# $1 -- source postfix ('-debug.js')
# NOTE: general pattern has some exclusions
#' Ext.define('Ext.menu.ColorPicker', {'
# ^ there are such lines
    sed "
1{s,$, processed by \`supro/${ME% *}\`,;b}
/^ Ext[.]define/s_^ __
`process_classes ""$1""`
" <"$EXTJS4$JSFILE" >"$EXTJS4$EXTJSLITE$1"
}

add_loadMiniInit(){
    # no processing for now, pure lines of 'paths/to/files.js'
    MINIFILES=`sed "/^var fastLoad/,/^[]]/{
  /^  *'App'/s|.*|app_main/App.js|p
  /^  *'App[.]/{
    s| *'App.|app_main/|
    s|[.]|/|g
    s|'.*$|.js|p
  }
  /^  *'app/{
    s|^  *'||
    s|'.*$||p
  }
}
d" < config/cfg_mongo_lftp.js`

    echo "
= Fast load appending to '$1' =
$MINIFILES"
    # strip front whitespace and C/C++ comments
    sed '
/^[[:blank:]]*$/d
/^[[:blank:]]/s/[[:blank:]]*//
/^[/*]/d
' $MINIFILES >>"$1"
}

add_defLoad(){
    # more App classes to concat from config `defLoad`:
    MINIFILES=`sed "/^var defLoad/,/^[]]/{
/^  */s| *'[AE][px][pt].|app_main/|
s|[.]|/|g
s|'.*$|.js|p
}
d" < config/cfg_mongo_lftp.js`
        echo "
= Fast load appending more App classes/files to =
= '$1' =
$MINIFILES"
    # strip front whitespace and C/C++ comments
    sed '
/^[[:blank:]]*$/d
/^[[:blank:]]/s/[[:blank:]]*//
/^[/*]/d
' $MINIFILES >>"$1"
}

#### main run ####

OUTPUT=`sed '' <./extjs.txt`
[ -d "$OUTPUT" ] || {
    echo "Error: no output '$OUTPUT' directory present"
    exit 1
}

EXTJS4=$OUTPUT
[ -f "$EXTJS4/.git/HEAD" ] && {
    HEAD=`sed 's/ref: //;q' < "$EXTJS4/.git/HEAD"`
    HEAD=`sed 'q'           < "$EXTJS4/.git/$HEAD"`
} || {
    echo "no git found in '$EXTJS4', use default source path: '$OUTPUT'"
    HEAD='no_git_found'
    trap '' 0
    exit 1
}

echo "
EXTJS4: '$EXTJS4'
HEAD:   '$HEAD'
PWD:    '$PWD'
" >&2

# process HTML
strip_css_html 'app_main/app.htm' 'app_main/app-mini.htm'

[ "$1" = 'strip' ] || {
    [ "$1" = 'lite' ] || split_extjs '-debug.js'
    strip_whitespace "$EXTJS4$EXTJSLITE-debug.js" "${EXTJS4}$EXTJSLITE-nw.js"
    add_loadMiniInit "$EXTJS4$EXTJSLITE-nw.js"
    [ "$1" = 'lite' ] || {
        # copy copyright/license header into the "rest" file
        sed '22q' <"$EXTJS4$EXTJSLITE-debug.js"  >"${EXTJS4}$EXTJSREST-nw.js"
        sed ''    <"$EXTJS4$EXTJSREST-debug.js" >>"${EXTJS4}$EXTJSREST-nw.js"
        mv  "${EXTJS4}$EXTJSREST-nw.js" "$EXTJS4$EXTJSREST-debug.js"
    }
    strip_whitespace "$EXTJS4$EXTJSREST-debug.js" "${EXTJS4}$EXTJSREST-nw.js"
    add_defLoad "$EXTJS4$EXTJSREST-nw.js"
    [ "$1" = 'justsplit' -o "$1" = 'lite' ] && {
        trap '' 0
        exit 0
    }
}

# output e.g. "/d/extjs-4.2/ext-all-nw.js" NOTE: this is mingw path
strip_whitespace "$EXTJS4$JSFILE" "$OUTPUT$NWFILE"

trap '' 0
exit 0
