#!/bin/bash

# precompile underscore templates
grunt jst > /dev/null 2>&1 || { echo 'Grunt and grunt-contrib-jst is required.  Please run "npm install" from the base folder.' ; exit 1; }

# zip and place into build directory for App deployment
if [ ! -d "build" ]; then
    mkdir build
fi

zip -r build/wcrx.zip * -x "*node_modules*" "*.git*"
