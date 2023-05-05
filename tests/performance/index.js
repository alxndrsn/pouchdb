'use strict';

const ALL_SUITES = {
  basics: './perf.basics',
  views: './perf.views',
  find: './perf.find',
  attachments: './perf.attachments',
};

var commonUtils = require('../common-utils');

function runTestSuites(PouchDB) {
  var adapters = commonUtils.adapters();

  var reporter = require('./perf.reporter');
  reporter.startAll();
  reporter.log('Testing PouchDB version ' + PouchDB.version +
    (adapters.length > 0 ? (', using adapter(s): ' + adapters.join(', ')) : '') +
    '\n\n');

  const suites = (commonUtils.params().suites && commonUtils.params().suites.split(',')) || Object.keys(ALL_SUITES);

  var theAdapterUsed;
  var count = 0;
  function checkDone(adapterUsed) {
    theAdapterUsed = theAdapterUsed || adapterUsed;
    if (++count === suites.length) {
      reporter.complete(theAdapterUsed);
    }
  }

  for (const [name, filepath] of Object.entries(ALL_SUITES)) {
    if (suites.includes(name)) {
      require(filepath)(PouchDB, checkDone);
    }
  }
}

var PouchDB = commonUtils.loadPouchDB({ plugins: ['pouchdb-find'] });

if (commonUtils.isBrowser()) {
  PouchDB.then((PouchDB) => {
    // rendering the initial view has its own costs
    // that interfere with measurements
    setTimeout(() => runTestSuites(PouchDB), 1000);
  });
} else {
  runTestSuites(PouchDB);
}
