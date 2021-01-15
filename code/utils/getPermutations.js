// ported from https://www.geeksforgeeks.org/distinct-permutations-string-set-2/
let permutations;

function swap(array, a, b) { 
	let t = array[a];
	array[a] = array[b]; 
	array[b] = t;
}

function shouldSwap(array, start, curr) {
	for (let i = start; i < curr; i++) {
		if (array[i] == array[curr]) {
			return false;
		}
	}
	return true;
}

function findPermutations(array, index, n) {
	if (typeof array == "string") {
		array = array.split("");
	}

	if (typeof index == "undefined") {
		index = 0;
	}

	if (typeof n == "undefined") {
		n = array.length;
	}

	if (index >= n) {
		permutations.push(array.slice(0));
		return;
	}
 
	for (let i = index; i < n; i++) {
		// Proceed further for str[i] only if it doesn't match with any of the characters after str[index]
		let check = shouldSwap(array, index, i);
		if (check) {
			swap(array, index, i);
			findPermutations(array, index + 1, n);
			swap(array, index, i);
		}
	}
}

module.exports = function(s) {
	permutations = [];

	findPermutations(s, 0, s.length);
	return permutations;
}
