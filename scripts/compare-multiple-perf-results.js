#!/usr/bin/env node
const { loadResultFile, printComparisonReport } = require('./_compare-perf-results.lib');

const [ , , ...files ] = process.argv;

const rawResults = files.map(loadResultFile);

const adapters = [];
const testSuites = {};
const resultsByAdapter = {};

rawResults.forEach(({ adapter, results }) => {
  if(!adapters.includes(adapter)) {
    adapters.push(adapter);
    resultsByAdapter[adapter] = {};
  }

  Object.entries(results).forEach(([ suite, tests ]) => {
    if(!testSuites[suite]) testSuites[suite] = [];
    if(!resultsByAdapter[adapter][suite]) resultsByAdapter[adapter][suite] = {};

    Object.entries(tests).forEach(([ t, { median } ]) => {
      if(!testSuites[suite].includes(t)) testSuites[suite].push(t);
      if(!resultsByAdapter[adapter][suite][t]) resultsByAdapter[adapter][suite][t] = { iterations:0, min:Number.MAX_VALUE };
      resultsByAdapter[adapter][suite][t].min = Math.min(resultsByAdapter[adapter][suite][t].min, median);
      resultsByAdapter[adapter][suite][t].iterations++;
    });
  });
});

if(adapters.length !== 2) {
  throw new Error('Currently this script can only compare 2 adapters.');
}

const [ a, b ] = [
  { adapter:adapters[0], results:resultsByAdapter[adapters[0]] },
  { adapter:adapters[1], results:resultsByAdapter[adapters[1]] },
];

printComparisonReport(a, b, { useStat:'min' });
