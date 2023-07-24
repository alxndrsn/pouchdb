'use strict';

var adapters = [
  ['local', 'http'],
  ['http', 'http'],
  ['http', 'local'],
  ['local', 'local']
];

adapters.forEach(function (adapters) {
  var suiteName = 'test.retry.js-' + adapters[0] + '-' + adapters[1];
  describe(suiteName, function () {

    var dbs = {};

    beforeEach(function () {
      dbs.name = testUtils.adapterUrl(adapters[0], 'testdb');
      dbs.remote = testUtils.adapterUrl(adapters[1], 'test_repl_remote');
    });

    afterEach(function (done) {
      testUtils.cleanup([dbs.name, dbs.remote], done);
    });

    it('target doesn\'t leak "destroyed" event', function () {

      var db = new PouchDB(dbs.name);
      var remote = new PouchDB(dbs.remote);
      var Promise = testUtils.Promise;

      var remoteBulkGet = remote.bulkGet;
      var i = 0;
      remote.bulkGet = function () {
        console.log('remote.bulkGet() called by', new Error().stack.split('\n').filter((_,i)=>i).join('\n').replace('at','').trim());
        // Reject every 5th time
        if (++i % 5 === 0) {
          console.log('remote.bulkGet()', i, 'flunking');
          return Promise.reject(new Error('flunking you'));
        }
        console.log('remote.bulkGet()', i, 'passing');
        return remoteBulkGet.apply(remote, arguments);
      };

      var rep = db.replicate.from(remote, { live:true, retry:true, back_off_function:() => 0 });

      var numDocsToWrite = 50;

      return remote.post({}).then(function () {
        var originalNumListeners;
        var posted = 0;

        return new Promise(function (resolve, reject) {

          var error;
          function cleanup(err) {
            if (err) { error = err; }
            rep.cancel();
          }
          const finish = () => error ? reject(error) : resolve();

          rep.on('complete', finish);
          rep.on('error', cleanup);
          rep.on('change', function () {
            if (++posted < numDocsToWrite) {
              remote.post({}).catch(cleanup);
            } else {
              db.info()
                .then(info => {
                  if (info.doc_count === numDocsToWrite) { cleanup(); }
                })
                .catch(cleanup);
            }

            try {
              const listeners = remote.listeners('destroyed');
              var numListeners = listeners.length;
              if (typeof originalNumListeners !== 'number') {
                originalNumListeners = numListeners;
              } else {
                console.log('Checking:', { posted, numListeners, originalNumListeners });
                try {
                  numListeners.should.be.within(originalNumListeners - 1, originalNumListeners + 1, 'numListeners should never increase by +1/-1');
                } catch (err) {
                  console.log('Check failed:', { numListeners, originalNumListeners });
                  listeners.forEach((l,i) => console.log(`  listener ${i}: ${l.toString()}`));
                  throw err;
                }
              }
            } catch (err) {
              cleanup(err);
            }
          });
        });
      });
    });
  });
});
