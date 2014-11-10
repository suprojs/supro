#!/bin/sh
# cleanup whitespace and leaked in comments of our git version of `ext-all-debug.js`
# save ~1.4M of file size
# otherwise use `ext-all-debug.js` from same path as output/source

set -e

trap 'echo "
Unexpected Script Error! Use /bin/sh -x $0 to trace it.
"
set +e
trap "" 0
exit 0
' 0 # catch errors

CWD="./$0"
CWD="${CWD%/*}" # get path to supro dir where this script must be in
PATH="./bin/:$PATH" # if there are no needed commands (i.e. `dd` in mingw/git distro)

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

OUTPUT=`dd <./extjs.txt 2>/dev/null`
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
# output e.g. "/d/extjs-4.2/ext-all-nw.js" NOTE: this is mingw path
OUTPUT="${OUTPUT}ext-all-nw.js"
echo "
PWD:    '$PWD'
OUTPUT: '$OUTPUT'
EXTJS4: '$EXTJS4'
HEAD:   '$HEAD'
"

FSIZE=`dd < "${EXTJS4}ext-all-debug.js" 2>&1 1>/dev/null | sed '3{s/ .*$//;q};d'`
# delete whitespace
# delete leaked in comments (usually after some REs: 'compileCRe', 'tagRe', etc.)
#   use simple '/^[/*]/d' for that as lines are whitespace clean
#   and no such symbol may start source code line
sed '
1b
20b
8,15d
19s/.*/Source: ext-all-debug.js ('"$HEAD"')/
/^[[:blank:]]*$/d
/^[[:blank:]]/s/[[:blank:]]*//
/^[/*]/d
' < "${EXTJS4}ext-all-debug.js" >"$OUTPUT"

FSIZE=$((($FSIZE - `dd < "$OUTPUT" 2>&1 1>/dev/null | sed '3{s/ .*$//;q};d'`)/1024))
echo "size diff: $FSIZE kibytes"

trap '' 0
exit 0
