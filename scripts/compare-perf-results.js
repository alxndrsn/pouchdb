const { loadResultFile, printComparisonReport } = require('./_compare-perf-results.lib');

const [ , , ...files ] = process.argv;

printComparisonReport({ useStat:'median' }, ...files.map(loadResultFile));
