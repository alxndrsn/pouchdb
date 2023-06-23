'use strict';

describe('browser.worker.js', function () {
  it('might run', function () {
    var isNodeWebkit = typeof window !== 'undefined' &&
      typeof process !== 'undefined';

    var wouldRun = false;

    if ((window && typeof window.Worker === 'function') &&
        !isNodeWebkit && !testUtils.isIE() &&
        ((window && window.chrome) || (navigator && /Firefox/.test(navigator.userAgent)))) {
      wouldRun = true;
    }

    wouldRun.should.equal('the truth');
  });

  it('should inform us of useful information', function () {
    const env = {
      'window': typeof window,
      'window.chrome': typeof window.chrome !== 'undefined' && window.chrome,
      'window.Worker': typeof window.Worker !== 'undefined' && window.Worker,
      'navigator': typeof navigator,
      'navigator.userAgent': typeof navigator !== 'undefined' && navigator.userAgent,
      'process': typeof process,
      'isIE': testUtils.isIE(),
    };

    env.should.deep.equal({
      'window': 'object',
      'window.chrome': {},
      'window.Worker': 'function',
      'navigator': 'object',
      'navigator.userAgent': 'HeadlessChrome',
      'process': 'undefined',
      'isIE': false,
    });
  });
});
