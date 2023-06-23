'use strict';

describe('browser.worker.js', function () {

  var worker;
  var dbs = {};

  before(function () {
    var isNodeWebkit = typeof window !== 'undefined' &&
      typeof process !== 'undefined';

    if (!((window && typeof window.Worker === 'function') &&
        !isNodeWebkit && !testUtils.isIE() &&
        ((window && window.chrome) || (navigator && /Firefox/.test(navigator.userAgent))))) {
      throw new Error('Failed one of the checks for running tests.  Useragent:' + navigator.userAgent + '; typeof window.Worker:' + typeof window.Worker + '; window.chrome:' + window.chrome + '; isNodeWebkit:' + isNodeWebkit + '; testUtils.isIE()' + testUtils.isIE());
    } else {
      if (typeof navigator !== 'undefined') {
        throw new Error('Tests will be run; user agent: \'' + navigator.userAgent + '\'');
      } else {
        throw new Error('No navigator');
      }
    }

    worker = new Worker('worker.js');

    var sourceFile = window && window.location.search.match(/[?&]sourceFile=([^&]+)/);

    if (!sourceFile) {
      sourceFile = '../../packages/node_modules/pouchdb/dist/pouchdb.js';
    } else {
      sourceFile = '../../packages/node_modules/pouchdb/dist/' + sourceFile[1];
    }

    worker.postMessage(['source', sourceFile]);
  });

  after(function () {
    if (worker) {
      worker.terminate();
    }
  });

  function workerPromise(message) {
    return new Promise(function (resolve, reject) {
      worker.onerror = function (e) {
        reject(new Error(e.message + ": " + e.filename + ': ' + e.lineno));
      };
      worker.onmessage = function (e) {
        resolve(e.data);
      };
      worker.postMessage(message);
    });
  }

  beforeEach(function (done) {
    dbs.name = testUtils.adapterUrl('local', 'testdb');
    dbs.remote = testUtils.adapterUrl('http', 'test_repl_remote');
    testUtils.cleanup([dbs.name, dbs.remote], done);
  });

  after(function (done) {
    testUtils.cleanup([dbs.name, dbs.remote], done);
  });

  it('create it', function () {
    return workerPromise('ping').then(function (data) {
      data.should.equal('pong');
    });
  });

  it('check pouch version', function () {
    return workerPromise('version').then(function (data) {
      PouchDB.version.should.equal(data);
    });
  });

  it('check adapters', function () {
    return workerPromise('adapters').then(function (data) {
      data.should.deep.equal(['']);
    });
  });

  it('create remote db', function () {
    return workerPromise(['create', dbs.remote]).then(function (data) {
      data.should.equal('lala');
    });
  });

  it('create local db', function () {
    return workerPromise(['create', dbs.name]).then(function (data) {
      data.should.equal('lala');
    });
  });

  it('add doc with blob attachment', function () {
    return workerPromise(['postAttachmentThenAllDocs', dbs.name]).then(function (data) {
      data.title.should.equal('lalaa');
    });
  });

  it('put an attachment', function () {
    var blob = new Blob(['foobar'], {type: 'text/plain'});
    var message = ['putAttachment', dbs.name, 'doc', 'att.txt', blob,
      'text/plain'];
    return workerPromise(message).then(function (blob) {
      blob.type.should.equal('text/plain');
      blob.size.should.equal(6);
    });
  });

  it('total_rows consistent between worker and main thread', function () {
    var db = new PouchDB(dbs.name);

    // this test only makes sense for idb
    if (db.adapter !== 'idb') {
      return;
    }

    // both threads agree the count is 0
    return testUtils.Promise.all([
      db.allDocs().then(function (res) {
        res.total_rows.should.equal(0);
      }),
      workerPromise(['allDocs', dbs.name]).then(function (res) {
        res.total_rows.should.equal(0);
      })
    ]).then(function () {
      // post a doc
      return db.post({});
    }).then(function () {
      // both threads agree the count is 1
      return testUtils.Promise.all([
        db.allDocs().then(function (res) {
          res.total_rows.should.equal(1);
        }),
        workerPromise(['allDocs', dbs.name]).then(function (res) {
          res.total_rows.should.equal(1);
        })
      ]);
    });
  });
});
