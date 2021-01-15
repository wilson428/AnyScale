# AnyScale

Generate any of the 927 possible musical scales in HTML/JS using VexFlow and play it

## What's a scale?

For our purposes, a scale is any sequence of notes that begin and end on the same note, an octave apart, and in which any two notes in the sequence are between one and three semi-tones apart (i.e., a half-step, a full-step or a minor third). For example, a major scale would be defined as:

	[ 2, 2, 1, 2, 2, 2, 1 ]

While the [traditional six-note blues scale](https://en.wikipedia.org/wiki/Blues_scale) (often called a "hexatonic" blues scale or a [minor blues scale](https://www.jazzguitar.be/blog/blues-scales/#diagrams)) would be defined as:

	[ 3, 2, 1, 1, 3, 2 ]

Note that numbers _must_ add up to 12, since an octave consists of 12 semitones or half-steps. Technically, we could drop the last interval and assume it completes the scale, but this add unnecessary math for a relatively small dataset.

To express the notes themselves, we just need to cumulatively add the intervals, beginning with 0, representing whichever note we start with:

	Major scale: [ 0, 2, 4, 5, 7, 9, 11, 12 ]
	Blues scale: [ 0, 3, 5, 6, 7, 10, 12 ]

## Generating Every Scale

This task is a cousin of the [Coin Change Problem](https://algorithmist.com/wiki/Coin_change) in combinatorics, where one needs to figure out, say, every possible combination of pennies, nickles, dimes and quarters that make 68 cents. In this case, there's one major difference: _order matters_. While every [mode](https://en.wikipedia.org/wiki/Mode_(music)) of the major scale involves 5 full-steps and 2 half-steps, they are seven different scales.

There are a variety of ways we could compute this. The one I chose is a [simple recursive function](./code/computeScales.js) that starts with 0 and calls itself with the addition of 1, 2 or 3 steps.

	let SCALES = [];

	function addInterval(scale, steps) {
		scale.push(steps);

		let sum = scale.reduce((s, n) => s + n ); // simple way to sum a sequence

		if (sum > 12) { // don't count if we overshot
			return;
		} else if (sum === 12) {
			SCALES.push(scale);
		} else {
			addInterval(scale.slice(0), 1);
			addInterval(scale.slice(0), 2);
			addInterval(scale.slice(0), 3);
		}
	}

	addInterval([], 0);

This produces 927 unique scales, ranging from the Chromatic Scale to the four-note sequence of minor thirds.

### Checking our code

While the above function includes checking for duplicates, we can also think of this another way. There are only 19 unique _unordered_ combinations of 1s, 2s and 3s that add up to 12, which we can confirm with this [recursive formulation](https://algorithmist.com/wiki/Coin_change#Recursive_Formulation) of the Coin Change Problem. So the total number of scales is the sum of the unique permutation of each of those 19 sequences, which we can verify in [`testComputation.js`](./code/testComputation.js) using this [speedy algorithm](https://www.geeksforgeeks.org/distinct-permutations-string-set-2/) that doesn't waste time with repeat instances of the same value. (Otherwise it takes forever!)

