const fs = require('node:fs');
const { basename } = require('node:path');

const [ , , ...files ] = process.argv;
if(files.length !== 2) throw new Error('Can currently only compare 2 results.');

const log = (...args) => console.log('[compare-perf-results]', ...args);
const report = (...args) => console.log('   ', ...args);

const [ a, b ] = files.map(loadResultFile);

const colWidth = [ 12, 32, 12, 12 ];
const padFunc  = [ 'padEnd', 'padEnd', 'padStart', 'padStart' ];

report();
report('Comparing:', a.adapter, 'vs', b.adapter);
report();
reportTableRow('', '', a.adapter, b.adapter);
Object.entries(a.results)
  .forEach(([ suite, suiteResults ]) => {
    Object.entries(suiteResults)
      .forEach(([ test, testResults ], idx) => {
        if(!idx) reportTableDivider();
        suiteName = idx ? '' : suite;
        const resA = testResults.median;
        const resB = b.results[suite][test].median;
        reportTableRow(suiteName, test,
          forHumans(resA) + isBetter(resA, resB),
          forHumans(resB) + isBetter(resB, resA),
        );
      });
  });
report();

function loadResultFile(file) {
  log('Loading file:', file, '...');
  const results = JSON.parse(fs.readFileSync(file, { encoding:'utf8' }));
  const adapter = basename(file).split('.', 1)[0];
  return { adapter, results };
}

function reportTableRow(...cols) {
  report(cols.map((c, i) => c.toString()[padFunc[i]](colWidth[i], ' ')).join(' | '));
}

function reportTableDivider() {
  report(''.padStart(colWidth[0]+1, '-') + '|' + ''.padStart(colWidth[1]+2, '-') + '|' + ''.padStart(colWidth[2]+2, '-') + '|' + ''.padStart(colWidth[3]+1, '-'));
}

function forHumans(n) {
  return n.toFixed(2);
}

function isBetter(a, b) {
  if(a > b) return ' x';
  if(a < b) return '  ';
  return ' ?';
}
