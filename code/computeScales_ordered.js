const fs = require('fs');

let SCALES = []; // every unique _sequence_ of intervals adding to 12
let DUPLICATES = {}; // there will be a LOT of DUPLICATES
let DUPLICATE_COUNT = 0;

function addScale(s, r) {
	let slug = s.join("_");

	if (DUPLICATES[slug]) {
		console.log("Duplicate:", slug);
		DUPLICATE_COUNT += 1;
		return true;
	} else {
		console.log("Found new scale:", slug);
		SCALES.push({
			scale: slug,
			root: r
		});
		DUPLICATES[slug] = true;
		return false;
	}
}

function addRoot(s) {
	let slug = s.join("_");

	if (ROOTS[slug]) {
		console.log("Duplicate Root:", slug);
		DUPLICATE_ROOT_COUNT += 1;
		return true;
	} else {
		console.log("Found new root:", slug);
		SCALES.push(slug);
		DUPLICATES[slug] = true;
		return false;
	}
}

function addModes(sequence) {
	let root = sequence.join("_");

	for (let c = 0; c < sequence.length; c += 1) {
		isDuplicate = addScale(sequence, root);
		if (isDuplicate) {
			return;
		}
		sequence.push(sequence.shift())
	}
}

// recursively add steps until 12 is reached
function addInterval(scale, step) {
	if (step) {
		scale.push(step);
	}

	let sum = 0;

	if (scale.length !== 0) {
		sum = scale.reduce((s, n) => s + n ); // simple way to sum a sequence
	}

	if (sum > 12) { // don't count if we overshot
		return;
	} else if (sum === 12) {
		addModes(scale);
	} else {
		addInterval(scale.slice(0), 1);
		addInterval(scale.slice(0), 2);
		addInterval(scale.slice(0), 3);				
	}
}

// // TEST
// let major = [2,2,1,2,2,2,1];
// getModes(major);
// console.log(SCALES);

addInterval([], null);
console.log(`Found ${ SCALES.length } unique scales and ${ DUPLICATE_COUNT } duplicates`);

let ROOTS = {};

SCALES.forEach(s => {
	if (!ROOTS.hasOwnProperty(s.root)) {
		ROOTS[s.root] = [];
	}
	ROOTS[s.root].push(s.scale);
});

console.log(`Found ${ Object.keys(ROOTS).length } unique roots`);

SCALES = SCALES.map(d => d.scale.split(/_/g).map(j => +j));

// slightly tricky way to output JSON with one scale per line
let scales = JSON.stringify(SCALES);
scales  = scales.replace(/(?<!^)\[/g, "\n\t[");
scales = scales.replace("]]", "]\n]");

// let scales = JSON.stringify(SCALES, null, 2);
let roots = JSON.stringify(ROOTS, null, 2);

fs.writeFileSync("../data/scales_ordered.json", scales);
fs.writeFileSync("../data/roots.json", roots);