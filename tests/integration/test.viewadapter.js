'use strict';

const viewAdapters = testUtils.viewAdapters();

viewAdapters.forEach(viewAdapter => {
  describe('test.viewadapter.js-' + 'local' + '-' + viewAdapter, function () {
    let dbs = {};

    const docs = [
      {title : 'abc', value: 1, _id: 'doc1'},
      {title : 'def', value: 2, _id: 'doc2'},
      {
        _id: '_design/index',
        views: {
          index: {
            map: function mapFun(doc) {
              if (doc.title) {
                emit(doc.title);
              }
            }.toString()
          }
        }
      }
    ];

    function getDBNames(localStorage) {
      const savedDbNames = Object.keys(localStorage).filter(function (key) {
        return key.includes(dbs.name);
      });

      // This is the name of the db where view index data is stored.
      const viewDbName = savedDbNames.find(function (dbName) {
        return dbName.includes('-mrview-');
      });
      // This is the name of the db where documents are stored.
      const docDbName = savedDbNames.find(function (dbName) {
        return !dbName.includes('-mrview-');
      });

      console.log('getDBNames()', 'dbs.name:', dbs.name);
      console.log('getDBNames()', 'localStorage.keys:', Object.keys(localStorage));
      console.log('getDBNames()', 'savedDbNames:', savedDbNames);
      console.log('getDBNames()', 'viewDbName:', viewDbName);
      console.log('getDBNames()', 'docDbName:', docDbName);

      return { viewDbName, docDbName };
    }

    function getDbNamesFromLevelDBFolder(name) {
      const dbs = global.fs.readdirSync('./tmp');
      return dbs.filter((dbName => dbName.includes(name)));
    }

    beforeEach(function () {
      dbs.name = testUtils.adapterUrl('local', 'testdb');
    });

    it('Create pouch with separate view adapters', function (done) {
      global.__magic_number = Math.random();
      console.log('Opening PouchDB with __magic_number:', global.__magic_number);

      const db = new PouchDB(dbs.name, {view_adapter: viewAdapter});

      if (db.adapter === viewAdapter) {
        return done();
      }

      db.bulkDocs(docs).then(function () {
        db.query('index', {
          key: 'abc',
          include_docs: true
        }).then(function () {
          if (testUtils.isNode()) {
            const dbs = getDbNamesFromLevelDBFolder(db.name);
            dbs.length.should.equal(1); // only one db created on disk, no dependent db created
            return done();
          } else {
            const { viewDbName, docDbName } = getDBNames(localStorage);

            // check indexedDB for saved views
            // need to add '_pouch_' because views are saved in memory
            const viewRequest = indexedDB.open('_pouch_' + viewDbName, 1);
            viewRequest.onerror = function (event) {
              done(new Error('Database error: ' + event.target.errorCode));
            };
            viewRequest.onupgradeneeded = function (event) {
              // Expected.  Let's confirm some things:
              console.log(78, 'viewRequest.onupgradeneeded', event);

              // The version of the view database created is 1 which shows that this
              // database was newly created in IndexedDB and did not exist there
              // before. So the view database was created in the database specified in
              // the view_adapter and not in the default `idb`adapter.
              event.oldVersion.should.equal(0);
              event.newVersion.should.equal(1);
            };

            viewRequest.onsuccess = function () {
              console.log(90, 'viewRequest.onsuccess');

              // Nothing is saved here
              viewRequest.result.objectStoreNames.length.should.equal(0);
              viewRequest.result.version.should.equal(1);

              // check indexedDB for saved docs
              const docRequest = indexedDB.open(docDbName, 5);
              docRequest.onupgradeneeded = function (event) {
                // Expected.  We can just continue.
                console.log(100, 'docRequest.onupgradeneeded', event.oldVersion, '>>>', event.newVersion, '::', event);
              };
              docRequest.onerror = function (event) {
                done(new Error('Database error: ' + event));
              };
              docRequest.onsuccess = function () {
                console.log(105, 'docRequest.onsuccess');

                // something is saved here
                docRequest.result.objectStoreNames.length.should.equal(7);
                done();
              };
            };
          }
        }).catch(done);
      }).catch(done);
    });

    it('Create pouch with no view adapters', function (done) {
      const db = new PouchDB(dbs.name);

      db.bulkDocs(docs).then(function () {
        db.query('index', {
          key: 'abc',
          include_docs: true
        }).then(function (res) {

          console.log('query() res:', res);

          if (testUtils.isNode()) {
            const dbs = getDbNamesFromLevelDBFolder(db.name);
            const expectedLength = db.adapter === 'memory' ? 0 : 2;
            dbs.length.should.equal(expectedLength);
            done();
          } else {
            const { viewDbName, docDbName } = getDBNames(localStorage);

            // check indexedDB for saved views
            const viewRequest = indexedDB.open(viewDbName, 5);
            viewRequest.onupgradeneeded = function (event) {
              // Expected.  We can just continue.
              console.log(138, 'viewRequest.onupgradeneeded', event.oldVersion, '>>>', event.newVersion, '::', event);
            };
            viewRequest.onerror = function (event) {
              done(new Error('Database error: ' + event.target));
            };
            viewRequest.onsuccess = function () {
              console.log(144, 'viewRequest.onsuccess');
              // Something is saved here
              // This shows that without a view_adapter specified
              // the view query data is stored in the default adapter database.
              viewRequest.result.objectStoreNames.length.should.equal(7, 'viewRequest 148');

              // check indexedDB for saved docs
              const docRequest = indexedDB.open(docDbName, 5);
              docRequest.onupgradeneeded = function (event) {
                // Expected.  We can just continue.
                console.log(154, 'docRequest.onupgradeneeded', event.oldVersion, '>>>', event.newVersion, '::', event);
              };
              docRequest.onerror = function (event) {
                done(new Error('Database error: ' + event.target.errorCode));
              };
              docRequest.onsuccess = function () {
                console.log(154, 'docRequest.onsuccess');

                // something is saved here
                docRequest.result.objectStoreNames.length.should.equal(7, 'docRequest');
                done();
              };
            };
          }
        }).catch(done);
      }).catch(done);
    });
  });
});
