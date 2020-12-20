import { select, selectAll, event } from 'd3-selection';
import { transition, duration } from 'd3-transition';
import { nanoid } from 'nanoid';
import Vex from 'vexflow';

function Scale(container, scale_number, root, opts) {
	const that = this;
	that.id = nanoid();
	that.root = root || "C";

	const div = that.div = document.createElement("div");
	that.el = select(div);

	div.id = "scale_" + that.id;
	div.classList.add("scale");
	div.innerHTML = template();

	if (prepend) {
		scaleContainer.prepend(div);
	} else {
		scaleContainer.append(div);
	}

	// build control panel
	let selectItems = Object.keys(ROOTS).map(d => {
		return {
			value: d.replace("#", "s"),
			label: d.replace("#", "♯").replace(/b$/, "♭")
		}
	});

	let selectedIndex = Object.keys(ROOTS).indexOf(that.root);

	that.rootDropdown = selections.makeStyleBox("#scale_" + that.id + " .key_select_container", selectItems, {
		value_key: "value",
		label_key: "label",
		selected: that.root.replace("#", "s"),
		onChange: function(val, html) {
			that.drawScale(that.scale_number, html.replace("♯", "#").replace("♭", "b"));
		}
	});

	that.scaleNumberSelector = that.el.select("#scale_" + that.id + " .scale_number_input").node();

	that.scaleNumberSelector.addEventListener("change", function(e, v) {
		that.drawScale(+this.value - 1);
	});

	that.el.select(".scale_options_close").on("click", function() {
		scaleContainer.removeChild(that.div);
		delete REGISTRY[that.id];
	});

	const container = document.querySelector("#scale_" + that.id + " .staff");
	const play_button = document.querySelector("#scale_" + that.id + " .play_button");

	play_button.addEventListener("click", function() {
		if (that.scale) {
			that.playScale(250, 500);
		}
	});

	const renderer = new VF.Renderer(container, VF.Renderer.Backends.SVG);
	renderer.resize(780, 136);

	let context = that.context = renderer.getContext();

	let stave = that.stave = new VF.Stave(5, 10, 760, {
		space_above_staff_ln: 1.5,
		left_bar: false
	});

	stave.addClef('treble'); //.addTimeSignature(time);

	stave.setContext(context).draw();

	if (typeof scale_number != "undefined") {
		that.drawScale(scale_number, root)
	}

	REGISTRY[that.id] = that;	
}


Scale.prototype.drawScale = function(scale_number, root) {
	const that = this;

	if (typeof scale_number == "undefined") {
		console.log("Please pass a `scale_number` for this new scale");
		return;
	}

	that.scale_name = null;
	that.scale_number = null;
	that.alt_text = null;

	// if it's an id
	if (typeof scale_number === "string") {
		that.scale_number = +byID[scale_number].scale_number - 1;

		if (!that.scale_number) {
			console.log("Couldn't find a scale by that ID");
			return;
		}

		that.scale_name = byID[scale_number].name;
	} else if (typeof scale_number === "number") {
		that.scale_number = scale_number;

		let info = byNumber[+that.scale_number + 1];

		if (info) {
			that.scale_name = info[0].name;
		}

	} else {
		console.log("Didn't recognize identifier", scale_number);
		return;
	}	

	if (root) {
		that.root = root; // already set to 'C' in constructor if unspecified
	}

	if (byNumber[that.scale_number + 1]) {
		let all_names = byNumber[that.scale_number + 1].map(d => d.name);

		if (all_names.length > 1) {
			let alt_names = all_names.filter(d => d != that.scale_name);
			that.alt_text = `This is also known as the "${ alt_names.join(",") }"`
		}
	};

	that.slug = that.scale_number + "_" + that.root.replace("#", "s");

	that.rootDropdown.setValue(that.root.replace("#", "s"));
	that.scaleNumberSelector.value = that.scale_number + 1;

	// add name to template
	// `scale_number` is 0-indexed, so add one
	if (that.scale_name) {
		that.el.select(".scale_title").html(`<strong>Scale #${ that.scale_number + 1 }: </strong>&ldquo;${ that.scale_name }&rdquo; in ${ that.root }`);	
	} else {
		that.el.select(".scale_title").html(`<strong>Scale #${ that.scale_number + 1 } in ${ that.root }`);	
	}

	if (that.alt_text) {
		that.el.select(".scale_details").html(that.alt_text);
	} else {
		that.el.select(".scale_details").html("");
	}

	that.intervals = scales[that.scale_number];

	// https://stackoverflow.com/questions/20477177/creating-an-array-of-cumulative-sum-in-javascript
	that.scale = that.intervals.reduce(function(r, a) {
		r.push((r.length && r[r.length - 1] || 0) + a);
		return r;
	}, []);	

	const mode = ROOTS[that.root][1]; // sharps or flats
	const offset = ROOTS[that.root][0] + 39;

	that.notes = [];
	let previous;

	for (let c = 0; c < that.scale.length; c += 1) {
		let n = that.scale[c] + offset;
		let note;
		if (c == 0 || mode !== "flat") {
			note = NOTES[n].canonical[mode];
		} else {
			// if consecutive notes have the same base and the first is flat, add a natural sign
			if (previous.base === NOTES[n].base) {
				note = NOTES[n].natural;
			} else {
				note = NOTES[n].canonical[mode];
			}
		}
		note.data = NOTES[n];
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

	for (let c = 0; c < that.scale.length; c += 1) {
		setTimeout(function() {
			that.playNote(c, duration);
		}, tempo * c);
	}
}