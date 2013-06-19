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
    cp $SOURCE/cordova-2.7.0.js $TARGET/
fi
