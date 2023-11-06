#!/bin/bash -eu

#
# Build PouchDB with Vite instead of Browserify, and test that.
# We have this test because there are enough differences between
# Vite and Browserify to justify it.
#

# If this script is run _after_ bin/update-package-json-for-publish.js is run,
# `npm run build` may fail with:
#
# > Error: 'default' is not exported by node_modules/inherits/inherits.js
#
# To avoid this, fail if this script is run in a non-clean git repo:
git_diff="$(git diff -- package.json packages/node_modules/*/package.json)"
if [[ "$git_diff" != "" ]]; then
  git status --untracked-files=no -- package.json packages/node_modules/*/package.json
  echo "!!!"
  echo "!!! Your git working directory has changes to package.json file(s) !!!"
  echo "!!! Please revert/stage/commit changes, and re-run the command !!!"
  echo "!!!"
  exit 1
fi

npm run build
# install vite on-demand to avoid big, otherwise-unused dependency.
# --force to skip installing terser
npm i --force vite@4.5.0
node bin/update-package-json-for-publish.js

mkdir -p tmp/vite
cat > index.html <<EOF
<!DOCTYPE html>
<html>
  <body>
    <script type="module" src="/packages/node_modules/pouchdb/lib/index.js"></script>
  </body>
</html>
EOF

./node_modules/.bin/vite build --target esnext --outDir tmp/vite/dist --minify false
# TODO this will go wrong if there's more than one JS file generated(?)
cp ./tmp/vite/dist/assets/*.js pouchdb-vite.js
BUILD_NODE_DONE=1 POUCHDB_SRC='../../pouchdb-vite.js' npm test
