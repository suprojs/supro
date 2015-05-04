#!/bin/sh

[ "$1" = '?' -o "$1" = '-h' -o "$1" = '--help' ] && exec sed '' <<'!'
# '$1':
# * 'justsplit': split `ext-all-debug.js` into EXTJSLITE and EXTJSREST,
#           process mini init and fast load
# * 'lite': process mini init and fast load using existing EXTJSLITE and EXTJSREST
#           this is useful for development of fast loading logic
# * 'strip': don't split
# * ''/'*': do all
# cleanup whitespace and leaked in comments of our git's `ext-all-debug.js`
# save ~1.4M of file size
# otherwise use `ext-all-debug.js` from same path as output/source
!

set -e

trap 'echo "
Unexpected Script Error! Use /bin/sh -x $0 to trace it.
"
set +e
trap "" 0
exit 0
' 0 # catch errors

JSFILE='ext-all-debug.js'
NWFILE="ext-all-nw.js"

EXTJSLITE='ext-lite'
EXTJSREST='ext-rest'
EXTJSCLASSES='extjs-classes.txt'

MINIIINITFILES='extjs-mini-init-files.txt'

CWD="./$0"
CWD="${CWD%/*}" # get path to supro dir where this script must be in
#PATH="./bin/:$PATH" use `mingw/git` distro minimum (i.e. no `dd`, `stat`)

cd "$CWD"

[ -f extjs.txt ] || {
    echo '
Error: no "extjs.txt" file present.
Run `node-webkit` first time. It will search for configured ExtJS path.
Or manually write PATH of ExtJS4 distro into it.
e.g.:
../extjs-4.2/

Such ExtJS4 distro is located in SUPRO git repo and can be cloned:
$ git clone git://github.com/suprojs/extjs-4.2
'
    trap '' 0
    exit 1
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

process_classes(){
# read lines from $RMCLASSES and construct `sed` code
    oIFS=$IFS
    IFS=`printf '\n_'`
    IFS=${IFS%_} # `\n=LF` as the field separator
    for i in `sed '/^[# ]/d' <"$EXTJSCLASSES"` # skip comment and whitespace lines
    do case "$i" in
    '~'*) sed_rm_class "${i#?}";; # >/dev/null
    '!'*) sed_skip_class "${i#?}";; # skip
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
/^ Ext[.]define/s_^ __
`process_classes ""$1""`
" <"$EXTJS4$JSFILE" >"$EXTJS4$EXTJSLITE$1"
}

add_loadMiniInit(){
    # read and append init files
    [ -f "$MINIIINITFILES" ] && {
        # no processing for now, pure lines of 'paths/to/files.js'
        MINIIINITFILES=`sed '' <"$MINIIINITFILES"`
        echo "
= Fast load appending to '$1' =
$MINIIINITFILES"
        # strip front whitespace
        sed '
/^[[:blank:]]*$/d
/^[[:blank:]]/s/[[:blank:]]*//
' $MINIIINITFILES >>"$1"
    } || :
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

[ "$1" = 'strip' ] || {
    [ "$1" = 'lite' ] || split_extjs '-debug.js'
    strip_whitespace "$EXTJS4$EXTJSLITE-debug.js" "${EXTJS4}$EXTJSLITE-nw.js"
    add_loadMiniInit "$EXTJS4$EXTJSLITE-nw.js"
    # copy copyright/license header into the rest file
    sed '22q' <"$EXTJS4$EXTJSLITE-debug.js"  >"${EXTJS4}$EXTJSREST-nw.js"
    sed ''    <"$EXTJS4$EXTJSREST-debug.js" >>"${EXTJS4}$EXTJSREST-nw.js"
    mv  "${EXTJS4}$EXTJSREST-nw.js" "$EXTJS4$EXTJSREST-debug.js"
    strip_whitespace "$EXTJS4$EXTJSREST-debug.js" "${EXTJS4}$EXTJSREST-nw.js"
    [ "$1" = 'justsplit' -o "$1" = 'lite' ] && {
        trap '' 0
        exit 0
    }
}

# output e.g. "/d/extjs-4.2/ext-all-nw.js" NOTE: this is mingw path
strip_whitespace "$EXTJS4$JSFILE" "$OUTPUT$NWFILE"

trap '' 0
exit 0
