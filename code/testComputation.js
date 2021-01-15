const getPermutations = require("./utils/getPermutations");

const SCALES = require("../data/scales.json");

// Let's count the number of unique combinations of steps
let COMBOS = {}; // every unique _combination_ of intervals adding to 12

SCALES.forEach(s => {
	let combo = s.slice(0).sort().join("_"); // we should clone the array with `.slice(0)` so as not to sort the actual scales
	COMBOS[combo] = COMBOS[combo] || 0;
	COMBOS[combo] += 1;
});

console.log("Found", Object.keys(COMBOS).length, "unique combinations");

COMBOS = Object.entries(COMBOS).map(d => {
	const obj = {
		slug: d[0],
		sequence: d[0].replace("0_", "").split("_"),
		count: d[1]
	};

	obj.permutations = getPermutations(obj.sequence).length;
	return obj;
});

let total = 0;

COMBOS.forEach(d => {
	total += d.permutations;
	console.log(`${ d.slug }: ${ d.count } instances, ${ d.permutations } permutation(s), ${ total } rolling total`)
});