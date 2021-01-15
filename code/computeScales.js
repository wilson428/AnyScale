const fs = require('fs');
const argv = require('minimist')(process.argv.slice(2));

const N = argv.hasOwnProperty("N") ? +argv.N : 12;


let SCALES = []; // every unique _sequence_ of intervals adding to 12

// check for any duplicates, which there shouldn't be
let duplicates = {};

// recursively add steps until 12 is reached
function addInterval(scale, steps) {
	scale.push(steps);

	let sum = scale.reduce((s, n) => s + n ); // simple way to sum a sequence

	if (sum > N) { // don't count if we overshot
		return;
	} else if (sum === N) {
		// make sure it's not a duplicate
		let slug = scale.join("_");
		if (duplicates[slug]) {
			console.log("FOUND DUPLICATE:", scale);
		} else {
			duplicates[slug] = true;
			SCALES.push(scale);
		}
		return;
	} else {
		addInterval(scale.slice(0), 1);
		addInterval(scale.slice(0), 2);
		addInterval(scale.slice(0), 3);
	}
}

addInterval([], 0);
console.log("Found", SCALES.length, "unique scales!");

// slightly tricky way to output JSON with one scale per line
let json = JSON.stringify(SCALES);
json  = json.replace(/\[0/g, "\n\t[0");
json = json.replace("]]", "]\n]");

const filename = N === 12 ? "../data/scales.json" : `../data/scales_${ N }.json`;

fs.writeFileSync(filename, json);