#!/bin/bash -eux

#
# Build PouchDB with Webpack instead of Browserify, and test that.
# We have this test because there are enough differences between
# Webpack and Browserify to justify it.
#

npm run build
npm install webpack-cli@5.1.1 # do this on-demand to avoid slow installs
node bin/update-package-json-for-publish.js
npx webpack-cli
BUILD_NODE_DONE=1 POUCHDB_SRC='../../pouchdb-webpack.js' npm test
