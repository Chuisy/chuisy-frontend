#!/bin/bash

SOURCE=$(cd `dirname $0`; pwd)

# target location
TARGET=$1

if [ x$TARGET = x ]; then

cat <<EOF
Must supply target folder parameter, e.g.:

  deploy.bat ../deploy/lib/onyx
EOF
else
    mkdir -p $TARGET/
    cp $SOURCE/cube-emitter.js $TARGET/
fi
