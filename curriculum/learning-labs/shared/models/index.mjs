// The registry of canonical models (docs/specs/studio-v3-w4.md, W4b). One module per model, keyed by `kind:mode`; math.mjs and model.mjs
// dispatch to a registered module before their own kind/mode cases, and a model nobody registered behaves exactly as before.
import dataMedian from './data-median.mjs';
import decimalColumns from './decimal-columns.mjs';
import ratioUnitRate from './ratio-unit-rate.mjs';
import ratioTape from './ratio-tape.mjs';
import ratioPatterns from './ratio-patterns.mjs';
import percentBenchmark from './percent-benchmark.mjs';
import percentTape from './percent-tape.mjs';
import percentFindWhole from './percent-find-whole.mjs';
import solidFaces from './solid-faces.mjs';
import solidTriPrism from './solid-tri-prism.mjs';
import solidPyramidNet from './solid-pyramid-net.mjs';
import areaApothem from './area-apothem.mjs';
import factorsRegroup from './factors-regroup.mjs';
import inequalityGraph from './inequality-graph.mjs';
import growthTable from './growth-table.mjs';
import growthRider from './growth-rider.mjs';
import areaCrate from './area-crate.mjs';
import areaParallelogram from './area-parallelogram.mjs';
import coordinatesReflect from './coordinates-reflect.mjs';
import lineOrder from './line-order.mjs';
import linePartition from './line-partition.mjs';

export const MODELS = [dataMedian, decimalColumns, ratioUnitRate, ratioTape, ratioPatterns, percentBenchmark, percentTape, percentFindWhole, solidFaces, solidTriPrism, solidPyramidNet, areaApothem, factorsRegroup, inequalityGraph, growthTable, growthRider, areaCrate, areaParallelogram, coordinatesReflect, lineOrder, linePartition];
const byKey = new Map(MODELS.map((m) => [`${m.kind}:${m.mode}`, m]));
if (byKey.size !== MODELS.length) throw new Error('two models share a kind:mode');

/** The registered module for a model's kind:mode, or null. */
export const registered = (model) => byKey.get(`${model.kind}:${model.mode}`) || null;
