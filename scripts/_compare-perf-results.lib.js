module.exports = {
  loadResultFile,
  printComparisonReport,
};

const fs = require('node:fs');
const { basename } = require('node:path');
const _ = require('lodash');

function loadResultFile(file) {
  console.error(`[compare-perf-results.lib]`, 'Loading file:', file, '...');
  const { gitDiff, gitHash, ...results } = JSON.parse(fs.readFileSync(file, { encoding:'utf8' }));
  const adapter = basename(file).split('.', 1)[0];
  return { adapter, results };
}

function report (...args) { console.log('   ', ...args); }

function forHumans(n) {
  return n.toFixed(2);
}

function printComparisonReport({ useStat }, ...results) {
  const colWidth = [ 12, 32,             ...results.map(() => [10, 12]).flat() ];
  const padFunc  = [ 'padEnd', 'padEnd', ...results.map(() => ['padStart', 'padStart']).flat() ];

  report();
  report('Comparing:', results.map(r => r.adapter).join(' vs '), `(${useStat})`);
  report();
  reportTableRow('', '', ...results.map(r  => [r.adapter,  r.adapter]).flat());
  reportTableRow('', '', ...results.map(() => ['iterations', useStat]).flat());
  Object.entries(results[0].results)
    .forEach(([ suite, suiteResults ]) => {
      Object.entries(suiteResults)
        .forEach(([ test, testResults ], idx) => {
          if(!idx) reportTableDivider();
          suiteName = idx ? '' : suite;

          const relevant = results.map(r => ({
            numIterations: r.results[suite][test].numIterations,
            score:         r.results[suite][test][useStat],
          })).flat();
          const scores = relevant.map(r => r.score);

          reportTableRow(suiteName, test,
            ...relevant.map((r, idx) => [
              r.numIterations,
              forHumans(r.score) + ratingMarker(scores, r.score),
            ]).flat(),
          );
        });
    });
  report();

  function reportTableRow(...cols) {
    report(cols.map((c, i) => c.toString()[padFunc[i]](colWidth[i], ' ')).join(' | '));
  }

  function reportTableDivider() {
    const line = colWidth.map(w => ''.padStart(w+2, '-')).join('|');
    report(line.substring(1, line.length-1));
  }
}

function ratingMarker(scores, thisScore) {
  const best = _.min(scores);
  if(thisScore === best) return ' !';
  if(Math.abs(best - thisScore) / best < 0.05) return ' ~'; // less than 5 percent different - is it significant?  do we care?
  return '  ';
}
