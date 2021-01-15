// Many scales are modes of one another, just shifted and certain number of places to the left and looping back around
// For example, the major scale is [2, 2, 1, 2, 2, 2, 1]
// The melodic minor scale is [2, 1, 2, 2, 1, 2, 2], the same sequence shifted five units
// This is also known as the "Aeolian Mode" of the major scale. These sequences are identical except for the starting point

const fs = require('fs');

const SCALES = require("../data/scales.json");

// we can test if one sequence is a mode of another by drawing one across two octaves as a string and seeing if the other's string is a subset of that string
// this should be commutative
const modeTest = function(s0, s1) {
	const str0 = s0.join("_");
	const str1 = s1.join("_");

	const seq0 = s0.concat(s0).join("_");
	const seq1 = s1.concat(s1).join("_");

	let shift0 = seq1.indexOf(str0);
	let shift1 = seq0.indexOf(str1);

	// we need to divide the index by 2, if it matches, since the underscores double the shift
	shift0 = shift0 === -1 ? -1 : shift0 / 2;
	shift1 = shift1 === -1 ? -1 : shift1 / 2;

	return ({
		isMode: shift0 >= 0 && shift1 >= 0,
		shift_0: shift0,
		shift_1: shift1
	})
}

const major = [2, 2, 1, 2, 2, 2, 1];
const minor = [2, 1, 2, 2, 1, 2, 2];

console.log("Testing major vs. melodic minor");
console.log(modeTest(major, minor));

const SEQUENCES = [];

SCALES.forEach(scale => {
	let isMode = false;
	let matchingIndex = null;
	let mode;

	for (let c = 0; c < SEQUENCES.length; c += 1) {
		let sequence = SEQUENCES[c].scale;
		mode = modeTest(sequence, scale.slice(1));
		if (mode.isMode) {
			console.log(sequence, scale.slice(1));
			console.log(mode);
			isMode = true;
			matchingIndex = c;
			break;
		}
	}

	if (isMode) {
		SEQUENCES[matchingIndex].modes[mode.shift_1] = scale.slice(1).join("_");
		SEQUENCES[matchingIndex].count += 1;
	} else {
		SEQUENCES.push({
			scale: scale.slice(1),
			count: 1,
			modes: [ scale.slice(1).join("_") ]
		});
	}
});

const FREQUENCIES = {};

SEQUENCES.forEach(seq => {
	FREQUENCIES[seq.count] = FREQUENCIES[seq.count] || { count: 0, sequences: {} };
	const notes = seq.scale;

	FREQUENCIES[seq.count].count += 1;
	FREQUENCIES[seq.count].sequences[notes.length] = FREQUENCIES[seq.count].sequences[notes.length] || [];
	FREQUENCIES[seq.count].sequences[notes.length].push(seq.scale.join("_"));
});



console.log(`Identified ${ SEQUENCES.length } sequences`);

fs.writeFileSync("../data/sequences.json", JSON.stringify(SEQUENCES, null, 2));
fs.writeFileSync("../data/frequencies.json", JSON.stringify(FREQUENCIES, null, 2));
