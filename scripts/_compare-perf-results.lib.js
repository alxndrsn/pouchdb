module.exports = {
  loadResultFile,
  printComparisonReport,
};

const fs = require('node:fs');
const { basename } = require('node:path');

function loadResultFile(file) {
  console.error(`[compare-perf-results.lib]`, 'Loading file:', file, '...');
  const results = JSON.parse(fs.readFileSync(file, { encoding:'utf8' }));
  const adapter = basename(file).split('.', 1)[0];
  return { adapter, results };
}

function report (...args) { console.log('   ', ...args); }

const colWidth = [ 12, 32, 10, 12, 10, 12 ];
const padFunc  = [ 'padEnd', 'padEnd', 'padStart', 'padStart', 'padStart', 'padStart' ];
function reportTableRow(...cols) {
  report(cols.map((c, i) => c.toString()[padFunc[i]](colWidth[i], ' ')).join(' | '));
}
function reportTableDivider() {
  const line = colWidth.map(w => ''.padStart(w+2, '-')).join('|');
  report(line.substring(1, line.length-1));
}

function forHumans(n) {
  return n.toFixed(2);
}

function printComparisonReport(a, b, { useStat }) {
  report();
  report('Comparing:', a.adapter, 'vs', b.adapter, `(${useStat})`);
  report();
  reportTableRow('', '', a.adapter, a.adapter, b.adapter, b.adapter);
  reportTableRow('', '', 'iterations', useStat, 'iterations', useStat);
  Object.entries(a.results)
    .forEach(([ suite, suiteResults ]) => {
      Object.entries(suiteResults)
        .forEach(([ test, testResults ], idx) => {
          if(!idx) reportTableDivider();
          suiteName = idx ? '' : suite;
          const resA        = testResults[useStat];
          const iterationsA = testResults.iterations;
          const resB        = b.results[suite][test][useStat];
          const iterationsB = b.results[suite][test].iterations;
          reportTableRow(suiteName, test,
            iterationsA,
            forHumans(resA) + isBetter(resA, resB),
            iterationsB,
            forHumans(resB) + isBetter(resB, resA),
          );
        });
    });
  report();
}

function isBetter(a, b) {
  if(Math.abs(a - b) / a < 0.05) return ' ~'; // less than 5 percent different - is it significant?  do we care?
  if(a < b) return ' !';
  if(a > b) return '  ';
  throw new Error(`Not sure how we got here! ${JSON.stringify({ a, b })}`);
}
