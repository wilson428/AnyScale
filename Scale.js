import { select, selectAll, event } from 'd3-selection';
import { transition, duration } from 'd3-transition';
import { Notes } from '../Piano-Notes';
import { Piano_500 } from '../Piano-Notes';
import { Piano_1000 } from '../Piano-Notes';

import Vex from 'vexflow';
import { nanoid } from 'nanoid';

const VF = Vex.Flow;

const template = require("./src/Scale.ejs");
import STYLE_COLORS from "./src/Scale.scss";

const SCALES = require("./data/scales_ordered.json");
const KEYS = require("./data/keys.json");

const PALETTE = ['#ffffa1', '#ffeb99', '#ffd891', '#ffc489', '#ffb081', '#ff9c79', '#ff8971', '#ff7569'];
const INTERVAL_COLORS = [ PALETTE[1], PALETTE[3], PALETTE[5] ];

const NOTES = new Notes();

NOTES.loadAudio([ Piano_500, Piano_1000 ]);

// add VexFlow element to each note
NOTES.list.forEach(function(d, i) {
	d.vf = {};

	let noteName = d.name;

	// StaveNotes for VF	
	let stemDirection = d.info.k < 50 ? Vex.Flow.StaveNote.STEM_UP : Vex.Flow.StaveNote.STEM_DOWN;

	// Natural note (white key) with no accidental and explicit natural sign
	d.vf.plain = d.info.natural ? new VF.StaveNote({ clef: "treble", keys: [ d.info.natural ], duration: "4", stem_direction: stemDirection }) : null;
	d.vf.natural = d.info.natural ? new VF.StaveNote({ clef: "treble", keys: [ d.info.natural ], duration: "4", stem_direction: stemDirection }).addAccidental(0, new VF.Accidental("n")) : null;

	// flat
	let accidental = d.info.flat.split("/")[0].slice(1);
	d.vf.flat = new VF.StaveNote({ clef: "treble", keys: [ d.info.flat ], duration: "4", stem_direction: stemDirection }).addAccidental(0, new VF.Accidental(accidental));

	// sharp
	accidental = d.info.sharp.split("/")[0].slice(1);
	d.vf.sharp = new VF.StaveNote({ clef: "treble", keys: [ d.info.sharp ], duration: "4", stem_direction: stemDirection }).addAccidental(0, new VF.Accidental(accidental));

	// won't include 'bb' since those are all naturals
	d.vf.canonical = {
		flat: d.vf.plain ? d.vf.plain : d.vf.flat,
		sharp: d.vf.plain ? d.vf.plain : d.vf.sharp
	};
});

const REGISTRY = {};

function Scale(container, scale_number, key, opts) {
	const that = this;
	that.id = nanoid(); // every instance gets a unique short hash
	that.key = "C";

	if (container instanceof HTMLElement) {
		that.container = container;
	} else {
		try {
			that.container = select(container).node();
		} catch(e) {
			console.log("Please pass a DOM element or valid CSS selector as the first argument");
			return;
		}
	}

	// a `true` in the last argument means to prepend the scale to the container
	opts = opts || {};
	if (typeof opts == "boolean") {
		opts = {
			prepend: true
		}
	}

	// div where we'll hold the scale;
	const div = that.div = document.createElement("div");
	that.el = select(div); // the d3 version of the div

	div.id = "scale_" + that.id;
	div.classList.add("scale");
	div.innerHTML = template();

	if (opts.prepend) {
		that.container.prepend(div);
	} else {
		that.container.append(div);
	}

	/*	
	that.el.select(".scale_options_close").on("click", function() {
		that.container.removeChild(that.div);
		delete REGISTRY[that.id];
	});
	*/

	that.scale_container = document.querySelector("#scale_" + that.id + " .staff");
	that.play_button = document.querySelector("#scale_" + that.id + " .play_button");

	that.play_button.addEventListener("click", function() {
		that.playScale(250, 500);
	});

	const renderer = new VF.Renderer(that.scale_container, VF.Renderer.Backends.SVG);
	renderer.resize(780, 136);

	let context = that.context = renderer.getContext();

	let stave = that.stave = new VF.Stave(5, 10, 760, {
		space_above_staff_ln: 1.5,
		left_bar: false
	});

	stave.addClef('treble'); //.addTimeSignature(time);

	stave.setContext(context).draw();

	if (typeof scale_number != "undefined") {
		that.drawScale(scale_number, key)
	}

	REGISTRY[that.id] = that;	
}

// scale_number is the index of the `SCALES` array, from 0 to 926
Scale.prototype.drawScale = function(scale_number, new_key) {
	const that = this;

	if (typeof scale_number == "undefined") {
		console.log("Please pass a `scale_number` for this new scale");
		return;
	}

	if (!SCALES[+scale_number]) {
		console.log(`There is no scale for number ${ scale_number }`);
		return;
	}

	that.scale_number = +scale_number;
	// that.scale_number = +byNumber[scale_number].scale_number - 1;	

	if (new_key) {
		that.key = new_key; // already set to 'C' in constructor if unspecified
	}

	that.slug = that.scale_number + "_" + that.key.replace("#", "s");

	// if (SCALES[that.scale_number]) {
	// 	let all_names = byNumber[that.scale_number + 1].map(d => d.name);

	// 	if (all_names.length > 1) {
	// 		let alt_names = all_names.filter(d => d != that.scale_name);
	// 		that.alt_text = `This is also known as the "${ alt_names.join(",") }"`
	// 	}
	// };

	// add name to template
	// `scale_number` is 0-indexed, so add one

	if (that.scale_name) {
		that.el.select(".scale_title").html(`<strong>Scale #${ that.scale_number + 1 }: </strong>&ldquo;${ that.scale_name }&rdquo; in ${ that.key }`);	
	} else {
		that.el.select(".scale_title").html(`<strong>Scale #${ that.scale_number + 1 } in ${ that.key }`);	
	}

	if (that.alt_text) {
		that.el.select(".scale_details").html(that.alt_text);
	} else {
		that.el.select(".scale_details").html("");
	}

	that.intervals = SCALES[that.scale_number];
	that.intervals.unshift(0);

	// https://stackoverflow.com/questions/20477177/creating-an-array-of-cumulative-sum-in-javascript
	that.scale = that.intervals.reduce(function(r, a) {
		r.push((r.length && r[r.length - 1] || 0) + a);
		return r;
	}, []);

	const accidentals = KEYS[that.key][1]; // sharps or flats
	const offset = KEYS[that.key][0] + 39;

	that.notes = [];
	let previous;

	for (let c = 0; c < that.scale.length; c += 1) {
		let n = that.scale[c] + offset;
		let note;

		if (c == 0 || accidentals !== "flat") {
			note = NOTES.list[n].vf.canonical[accidentals];
		} else {
			// if consecutive notes have the same base and the first is flat, add a natural sign
			if (previous.info.base === NOTES.list[n].info.base) {
				note = NOTES.list[n].vf.natural;
			} else {
				note = NOTES.list[n].vf.canonical[accidentals];
			}
		}
		note.data = NOTES.list[n];
		that.notes.push(note);
		previous = note.data;
	}	

	const voice = that.voice = new VF.Voice({ num_beats: that.scale.length, beat_value: 4 });
	voice.addTickables(that.notes);

	const START_X = 50;
	const TARGET = that.stave.width - START_X * 2;

	that.stave.setNoteStartX(START_X);

	let formatter = new VF.Formatter().format([voice], TARGET + TARGET / (that.scale.length - 1) );

	that.context.clear();

	that.stave.setContext(that.context).draw();

	voice.draw(that.context, that.stave);

	// event listeners for click-to-play
	that.nodes = document.querySelectorAll("#scale_" + that.id + " .vf-stavenote")

	that.notes.forEach(function(note, n) {
		const node = that.nodes[n];

		node.setAttribute("data-note", note.name);

		node.addEventListener("click", function() {
			that.playNote(n, 500);
		});	
	});

	that.drawIntervals();
}

Scale.prototype.drawIntervals = function() {
	const that = this;

	const BBox = that.stave.getBoundingBox();

	const INTERVAL = {
		y: null,
		w: null,
		h: 22,
		m: 3 // margin between spacers and boxes
	};

	const svg = select(that.context.svg);

	const intervalLines = that.intervalLines = svg.append("g").attr("id", "intervalLines");

	that.notes.forEach((note, n) => {
		let node = that.nodes[n];

		if (n < that.notes.length - 1) {
			let interval = that.intervals[n + 1];

			const p = [
				note.getBoundingBox(),
				that.notes[n + 1].getBoundingBox()
			];

			const L = p[1].x - p[0].x;

			if (n === 0) {
				INTERVAL.y = Math.max(100, p[0].y + p[0].h + 5); // 100 in the minimum, spaced under F4 so as not to collide with stave
				INTERVAL.w = p[0].w / 2;
			}

			const path = `M${ p[0].x + INTERVAL.w },${ INTERVAL.y }v${ INTERVAL.h }M${ p[0].x + INTERVAL.w + L },${ INTERVAL.y }v${ INTERVAL.h }`;

			const bracketBox = intervalLines.append("rect")
				.attr("x", p[0].x + INTERVAL.w)
				.attr("y", INTERVAL.y + INTERVAL.m)
				.attr("width", L)
				.attr("height", INTERVAL.h - INTERVAL.m * 2)
				.style("fill", INTERVAL_COLORS[interval - 1]);

			const bracket = intervalLines.append("path")
				.attr("d", path)
				.attr("class", "bracket");

			const intervalNumber = intervalLines.append("text")
				.attr("x", p[0].x + L / 2 + INTERVAL.w / 2)
				.attr("y", INTERVAL.y + INTERVAL.h / 2 + INTERVAL.m)
				.attr("class", "intervalNumber")
				.text(interval);
		}
	});
}

Scale.prototype.playNote = function(index, duration) {
	const that = this;

	let note = that.notes[index];
	let node = that.nodes[index];

	let sample = duration;

	if (sample !== 500 && sample !== 1000 && sample !== 2000) {
		sample = 1000;
	}

	let audio = note.data.audio[sample];
	audio.play();

	select(node).selectAll("path").style("fill", STYLE_COLORS.green).style("stroke", STYLE_COLORS.green).transition().duration(duration * 2).style("fill", "black").style("stroke", "black");
}

Scale.prototype.playScale = function(tempo, duration) {
	const that = this;

	if (typeof tempo === "undefined") {
		tempo = 500;
	}

	if (!duration) {
		duration = 1000;
	}		

	select(that.play_button).style("color", STYLE_COLORS.green);

	for (let c = 0; c < that.scale.length; c += 1) {
		setTimeout(function() {
			that.playNote(c, duration);
		}, tempo * c);
	}

	setTimeout(function() {
		select(that.play_button).style("color", "black");
	}, that.scale.length * tempo);
}

export { Scale };