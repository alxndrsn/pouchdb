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
      if(!resultsByAdapter[adapter][suite][t]) resultsByAdapter[adapter][suite][t] = { numIterations:0, min:Number.MAX_VALUE };
      resultsByAdapter[adapter][suite][t].min = Math.min(resultsByAdapter[adapter][suite][t].min, median);
      resultsByAdapter[adapter][suite][t].numIterations++;
    });
  });
});

adapters.sort();

const results = adapters.map(a => ({
  adapter: a,
  results: resultsByAdapter[a],
}));

printComparisonReport({ useStat:'min' }, ...results);
