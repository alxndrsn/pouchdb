#!/usr/bin/env node
/* eslint-disable curly,max-len */

const { loadResultFile, printComparisonReport, SUITE_FOR } = require('./lib');

const [ , , ...files ] = process.argv;

let useStat = 'min';
if (files[0] === '--min' || files[0] === '--median') {
  if (files[0] === '--median') {
    useStat = 'median';
  }
  files.shift();
}

const rawResults = files.map(loadResultFile);

const adapters = [];
const testSuites = {};
const resultsByAdapter = {};
const clients = {};

const clientFilter  = process.env.CLIENT;
const adapterFilter = process.env.ADAPTERS && process.env.ADAPTERS.split(',');
const gitFilter     = process.env.COMMITS  && process.env.COMMITS.split(',').map(commit => commit.substring(0, 7));
const sortOrder     = process.env.SORT?.split(',') || [];

const filteredResults = rawResults.filter(({ adapter, client, results }) => {
  if (adapterFilter) {
    if (!adapterFilter.includes(adapter.split(':')[0])) return;
  }
  if (gitFilter) {
    if (!gitFilter.includes(adapter.split(':')[1])) return;
  }
  if (clientFilter) {
    if (!clientFilter.toLowerCase().split(',').includes(client.toLowerCase())) return;
  }

  return true;
});

filteredResults.forEach(({ adapter, client, results }) => {
  if (!adapters.includes(adapter)) {
    adapters.push(adapter);
    resultsByAdapter[adapter] = {};
    clients[adapter] = [];
  }

  if (!clients[adapter].includes(client)) {
    clients[adapter].push(client);
  }

  Object.entries(results).forEach(([ t, { median } ]) => {
    const suite = SUITE_FOR[t] || 'TODO:suite-mapping';

    if (!testSuites[suite]) testSuites[suite] = [];
    if (!testSuites[suite].includes(t)) testSuites[suite].push(t);

    if (!resultsByAdapter[adapter][suite])    resultsByAdapter[adapter][suite]    = {};
    if (!resultsByAdapter[adapter][suite][t]) resultsByAdapter[adapter][suite][t] = { numIterations:0, min:Number.MAX_VALUE, median:-1, all:[] };

    resultsByAdapter[adapter][suite][t].all.push(median);
    resultsByAdapter[adapter][suite][t].min = Math.min(resultsByAdapter[adapter][suite][t].min, median);
    resultsByAdapter[adapter][suite][t].numIterations++;
  });
});

Object.values(resultsByAdapter).forEach(adapterRes => {
  Object.values(adapterRes).forEach(suite => {
    Object.values(suite).forEach(test => {
      test.all.sort();
      const len = test.all.length;
      const mid = Math.floor(len / 2);
      if(len % 2) {
        test.median = test.all[mid];
      } else {
        test.median = (test.all[mid] + test.all[mid-1]) / 2;
      }
    });
  });
});

if (adapters.length < 2) {
  console.log('!!! At least 2 different adapters are required to make comparisons!');
  process.exit(1);
}

adapters.sort((a, b) => {
  if(a === b) return 0;

  const requestedA = sortOrder.indexOf(a);
  const requestedB = sortOrder.indexOf(b);

  if(requestedA !== requestedB) return requestedA - requestedB;
  if(a < b) return -1;
  return 1;
});

const sortedResults = adapters.map(adapter => ({
  adapter, results:resultsByAdapter[adapter]
}));

const allClients = new Set();
Object.entries(clients).forEach(([ adapter, clients ]) => {
  clients.forEach(c => allClients.add(c));
});
if(allClients.length > 1) throw new Error(`More than one client used for adapter: ${adapter}.  Client-based differentiation is not currently supported, and will give confusing results.`);
const client = [...allClients][0];

printComparisonReport({ client, useStat }, ...sortedResults);
