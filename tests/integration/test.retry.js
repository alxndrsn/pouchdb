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
      const originalNumListeners = remote.listeners('destroyed').length;

      var numDocsToWrite = 50;

      return remote.post({}).then(function () {
        var posted = 0;

        return new Promise(function (resolve, reject) {

          var error;
          function cleanup(err) {
            if (err) { error = err; }
            rep.cancel();
          }

          rep.on('error', cleanup);
          rep.on('complete', () => {
            if (error) {
              return reject(error);
            }

            const listeners = remote.listeners('destroyed');
            var numListeners = listeners.length;
            try {
              console.log('Checking:', { posted, numListeners, originalNumListeners });
              numListeners.should.equal(originalNumListeners, 'numListeners should settle to original number');
              resolve();
            } catch (err) {
              console.log('Check failed:', { numListeners, originalNumListeners });
              listeners.forEach((l,i) => console.log(`  listener ${i}: ${l.toString()}`));
              reject(err);
            }
          });

          if (++posted < numDocsToWrite) {
            remote.post({}).catch(cleanup);
          }
        });
      });
    });
  });
});
