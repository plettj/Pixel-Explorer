// Basic run-down of the game and it's functions

var unit = Math.floor(window.innerHeight / 72) * 8;
document.body.style.setProperty("--unit", unit + "px");
document.body.style.setProperty("--pixel", unit / 16 + "px");
var totalHeight = 79;
var C = document.getElementById("CursorCanvas");
C.width = unit * 16;
C.height = unit * 9;
var cctx = C.getContext('2d');
var E = document.getElementById("EnemyCanvas");
E.width = unit * 16;
E.height = unit * totalHeight;
var ectx = E.getContext('2d');
var A = document.getElementById("AvatarCanvas");
A.width = unit * 16;
A.height = unit * totalHeight;
var actx = A.getContext('2d');
var R = document.getElementById("CrateCanvas");
R.width = unit * 16;
R.height = unit * totalHeight;
var rctx = R.getContext('2d');
var T = document.getElementById("TrackCanvas");
T.width = unit * 16;
T.height = unit * totalHeight;
var tctx = T.getContext('2d');
var I = document.getElementById("ItemCanvas");
I.width = unit * 16;
I.height = unit * totalHeight;
var ictx = I.getContext('2d');
var M = document.getElementById("MapCanvas");
M.width = unit * 16;
M.height = unit * totalHeight;
var mctx = M.getContext('2d');

var raf;
var paused = true;
var step = 0;
var game_on = false;
var controlsOpen = false; // lol last-minute add-on haha
var saves = [0, false, 1, "00000"] // [bestStage, torchLit, attempts, collKeys]
if (typeof(Storage) !== "undefined") {
  // store & update
	var bestStage = localStorage.getItem('bestStage');
	console.log("Starting on stage " + (parseInt(bestStage) + 1));
	saves[0] = bestStage ? parseInt(bestStage) : 0;
	var torchLit = localStorage.getItem('torchLit');
	saves[1] = torchLit ? (torchLit == 'true') : false;
	var attempts = localStorage.getItem('attempts');
	saves[2] = attempts ? parseInt(attempts) : 1;
	var collKeys = localStorage.getItem('collKeys');
	saves[3] = collKeys ? collKeys : "00000";
	localStorage.setItem('bestStage', saves[0]);
	localStorage.setItem('torchLit', saves[1]);
	localStorage.setItem('attempts', saves[2]);
	localStorage.setItem('collKeys', saves[3]);
} else {
  alert("Note: The game will not be saved if the browser closes or reloads because this browser does not support local storage. If you would like saving to work, try Google Chrome, or Microsoft Edge.");
}

document.addEventListener("mousemove", function(event) {
	cursor.update([event.pageX - (window.innerWidth / 2 - unit * 8), event.pageY - (window.innerHeight / 2 - unit * 4.5)]);
});
document.addEventListener("click", function(event) {
	if (game_on) cursor.click(event);
});
document.addEventListener("contextmenu", function(event) {
	cursor.context(event);
});
document.addEventListener("keydown", function(event) {
	keyPressed(event.keyCode, 1);
});
document.addEventListener("keyup", function(event) {
	keyPressed(event.keyCode, 0);
});

function keyPressed(code, num) {
	if (code > 36 && code < 41) avatar.keys[code - 37] = num;
	else if (code === 65) avatar.keys[0] = num;
	else if (code === 87) avatar.keys[1] = num;
	else if (code === 68) avatar.keys[2] = num;
	else if (code === 83) avatar.keys[3] = num;
	else if (code === 32 && num) space();
	//else if (code === 82 && num) map.startStage(map.bestStage);
}

var avImg = new Image();
avImg.src = "avatar.png";

var ground = new Image();
ground.src = "ground.png";

var fireImg = new Image();
fireImg.src = "fireball.png";

var terrain = new Image();
terrain.src = "terrain.png";

var curImg = new Image();
curImg.src = "cursor.png";

var crushImg = new Image();
crushImg.src = "crush.png";

var trackImg = new Image();
trackImg.src = "tracks.png";

function clear(context, coor, x = 0, y = 0, crush) {
  if (!coor) context.clearRect(0, 0, context.canvas.width, context.canvas.height);
	else if (!crush) context.clearRect(unit * coor[0] + x, unit * coor[1] + y, unit, unit);
	else context.clearRect(unit * coor[0] + x - unit / 2, unit * coor[1] + y - unit / 2, unit * 2, unit * 2);
}

var menu = {
	menu: document.getElementById("Menu"),
	keys: document.getElementById("Keys"),
	pause: document.getElementById("Pause"),
	stats: document.getElementById("Stats"),
	stage: document.getElementById("Stage"),
	resume: document.getElementById("Resume"),
	restart: document.getElementById("Restart"),
	dialogue: document.getElementById("Dialogue"),
	deleteSave: document.getElementById("DeleteSave"),
	fullRestart: document.getElementById("FullRestart"),
	showingDialogue: false,
	text: [
		"&nbsp&nbspIn the jungle, things are not always as they seem. Here, there are levers and shifting blocks.<br>&nbsp&nbspPush a lever, and mysterious things may happen...",
		"&nbsp&nbspYou have completed the first stage. Congratulations!<br>&nbsp&nbspFrom here on, things will start to be a little more complicated. You might have to push a lever more than once.",
		"&nbsp&nbspA wooden crate!<br>&nbsp&nbspCrates like this can be pushed around, can ride blocks, and be broken.<br>&nbsp&nbspAlso: you <i>can</i> drop back down...",
		"&nbsp&nbspCongratulations! You've made it this far.<br>&nbsp&nbspOn this stage, things get pretty tricky; don't move too fast, and try to think ahead.",
		"&nbsp&nbspBeware of Fireballs!<br>&nbsp&nbspThese sneaky guys are perfectly predictable, always climbing the ladders, but they'll still catch you off gaurd, so stay alert!",
		"&nbsp&nbspWhen held down, pressure plates will lower their corresponding spikes.<br><br>&nbsp&nbspDon't touch those spikes though, they can be lethal...",
		"&nbsp&nbspNice job getting this far!<br>&nbsp&nbspMeet the torch. If lit on fire, its corresponding fiery spikes will drop permanently. The only trouble is actually lighting the thing.",
		"&nbsp&nbspThis is the final stage!<br>&nbsp&nbspYou will need to focus and think hard to complete this supremely difficult level.<br>&nbsp&nbspTruly, good luck.",
		"&nbsp&nbspWOW!<br>&nbsp&nbspI am thoroughly impressed you solved that level.<br>&nbsp&nbspYou've reached the end of the jungle! Thanks for playing."
	],
	display: function (display) {
		var m = this;
		if (display) { // open menu
			paused = true;
			m.pause.style.display = "none";
			m.keys.style.display = "none";
			m.stage.style.display = "none";
			m.menu.style.animation = "dropin 0.8s normal";
			m.menu.style.display = "block";
			m.menu.style.marginTop = "0";
			m.menu.style.opacity = "1";
		} else { // resume game
			paused = false;
			m.pause.style.display = "block";
			m.keys.style.display = "block";
			m.stage.style.display = "block";
			m.menu.style.animation = "dropin 0.8s reverse";
			m.menu.style.marginTop = "calc(var(--unit) * -1)";
			m.menu.style.opacity = "0";
			setTimeout(() => {
				if (paused === false) m.menu.style.display = "none";
				else m.display(true);
			}, 800);
		}
	},
	showD: function (index, close) {
		var m = this;
		if (close) {
			paused = false;
			m.pause.style.display = "block";
			m.keys.style.display = "block";
			m.stage.style.display = "block";
			m.showingDialogue = false;
			m.dialogue.style.animation = "dropin 0.8s reverse";
			m.dialogue.style.marginTop = "calc(var(--unit) * -1)";
			m.dialogue.style.opacity = "0";
			setTimeout(() => {m.dialogue.style.display = "none";}, 800);
		} else {
			paused = true;
			m.pause.style.display = "none";
			m.keys.style.display = "none";
			m.stage.style.display = "none";
			m.showingDialogue = true;
			m.dialogue.style.animation = "dropin 0.8s normal";
			m.dialogue.style.display = "block";
			m.dialogue.style.marginTop = "0";
			m.dialogue.style.opacity = "1";
			m.dialogue.innerHTML = m.text[index];
		}
	}
}

var info = {
	displayed: false,
	co: [0, 0],
	dom: document.getElementById("Info"),
	display: function (title, text) {
		this.co = cursor.coor.map(n => n);
		var mock = this.co.map(n => n); // used for edge of screen issues
		if (mock[0] < 1) mock[0] = 1;
		else if (mock[0] > 13) mock[0] = 14;
		if (mock[1] < 2) mock[1] += 2.5;
		this.displayed = true;
		this.dom.innerHTML = "<p>" + title + "</p><br><p>" + text + "</p>";
		this.dom.style.top = "calc(var(--unit) * -4.5 + 50% + var(--unit) * " + (mock[1] - 1.5) + ")";
		this.dom.style.left = "calc(var(--unit) * -8 + 50% + var(--unit) * " + (mock[0] - 1) + ")";
		this.dom.style.display = "block";
	},
	hide: function () {
		this.displayed = false;
		this.dom.style.display = "none";
	}
}

function space() {
	if (info.displayed) info.hide();
	if (menu.showingDialogue) menu.showD(0, true);
	if (avatar.moving || map.moving) return;
	switch (map.data[avatar.coor[1]][avatar.coor[0]]) {
		case 4:
		case 5:
		case 6:
		case 7: // the switches
			avatar.act(avatar.coor, 1);
			break;
	}
}

function deleteSave() {
	if (typeof(Storage) !== undefined) {
		localStorage.setItem('bestStage', 0);
		localStorage.setItem('torchLit', false);
		localStorage.setItem('attempts', 1);
		localStorage.setItem('collKeys', "00000");
	}
	document.getElementById("LastSaved").innerHTML = "Last saved at Stage 1";
}

var cursor = {
	coor: [0, 0],
	type: -1, // 0-black 1-green 2-square
	update: function (coor) {
		if (info.displayed) {
			if (info.co[0] !== this.coor[0] || info.co[1] !== this.coor[1]) info.hide();
		}
		if (coor) this.coor = coor.map(n => Math.floor(n / unit));
	},
	click: function (e) {
		if (info.displayed) info.hide();
		if (menu.showingDialogue && !menu.dialogue.contains(e.target)) {
			menu.showD(0, true);
		}
		if (menu.showingDialogue) return;
		if (menu.pause.contains(e.target)) menu.display(true);
		else if (!menu.menu.contains(e.target) && !controlsOpen) menu.display(false);
		else if (menu.resume.contains(e.target)) menu.display(false);
		else if (menu.restart.contains(e.target)) {
			if (map.startStage(map.bestStage)) menu.display(false);
		} else if (menu.fullRestart.contains(e.target)) {
			if (confirm("Are you sure you want to restart Pixel Explorer from Stage 1?")) {
				deleteSave();
				window.location.reload(false);
			}
		} else if (menu.deleteSave.contains(e.target)) {
			deleteSave();
			menu.display(false);
		}
	},
	context: function (e) {
		if (e.preventDefault !== undefined) e.preventDefault();
  	if (e.stopPropagation !== undefined) e.stopPropagation();
		if (!info.displayed) {
			switch (map.data[this.coor[1] + map.top][this.coor[0]]) {
				case 0: // Track end
					if (map.get(0, [this.coor[0], this.coor[1] + map.top])) {
						info.display("Track", "Indicates where shifting blocks will go.");
					}
					break;
				case 1: // Track start
					if (map.get(1, [this.coor[0], this.coor[1] + map.top])) {
						info.display("Shifting Block", "Moves when corresponding lever is pushed.");
					}
					break;
				case 3: // ladder
					info.display("Ladder", "Can be climbed.");
					break;
				case 4: // switch 1
				case 5: // switch 2
				case 6: // switch 3
				case 7: // switch 4
					info.display("Switch", "Can rearange corresponding blocks on the map.");
					break;
				case 8: // crate
					info.display("Crate", "Can be pushed, ride on moving blocks, and be broken.");
					break;
				case 9: // key
					info.display("Key", "Collect as a bonus challenge.");
					break;
				case 11: // pressure plate
					info.display("Pressure Plate", "When pressed, hides corresponding spikes.");
					break;
				case 12: // spike
					info.display("Spikes", "Lethal when touched.");
					break;
			}
		} else {
			if (info.co[0] === this.coor[0] && info.co[1] === this.coor[1]) info.hide(); 
		}
	}
}

var avatar = {
	coor: [0, 0],
	ox: 0,
	oy: 0,
	vy: 0,
	action: 0, // 0-stopped 1-left 2-up 3-right 4-down 5-fall 6-pull 7-unlock 8-collect 9 - die
	dir: 0, // 0-right 1-left
	moving: false,
	keys: [0, 0, 0, 0], // left up right down
	keyCount: 0,
	inventDOM: document.getElementById("Keys"),
	spawned: true,
	img: avImg,
	act: function (coor, value) {
		if (!this.spawned) return;
		if (value === 1) { // to pull the switch
			this.move(6);
			return;
		}
		if (this.moving || map.moving > 0) return;
		if (!(this.keys[0] || this.keys[1] || this.keys[2] || this.keys[3])) return;
		if (this.keys[1] && !this.keys[3] && this.coor[1] > 0) { // up
			var u = map.data[this.coor[1] - 1][this.coor[0]];
			if (map.data[this.coor[1]][this.coor[0]] === 3 && ((u === 3 || u !== 1) && u !== 8)) {
				this.move(2);
				return;
			}
		} else if (this.keys[3] && !this.keys[1]) { // down
			if (map.data[this.coor[1] + 1][this.coor[0]] === 3) {
				this.move(4);
				return;
			}
		}
		if (this.keys[2] && !this.keys[0] && this.coor[0] < 15) { // right
			var dr = map.data[this.coor[1] + 1][this.coor[0] + 1];
			var r = map.data[this.coor[1]][this.coor[0] + 1];
			if (r !== 1) {
				if (!(dr === 1 || dr === 3 || dr === 8)) {
					for (i = 2; i < 5; i++) {
						if (map.data[this.coor[1] + i][this.coor[0] + 1] === 1 || map.data[this.coor[1] + i][this.coor[0] + 1] === 3 || map.data[this.coor[1] + i][this.coor[0] + 1] === 8) {
							this.move(3, false);
							return;
						}
					}
				} else this.move(3, r === 8);
				return;
			}
		} else if (this.keys[0] && !this.keys[2] && this.coor[0] > 0) { // left
			var dl = map.data[this.coor[1] + 1][this.coor[0] - 1];
			var l = map.data[this.coor[1]][this.coor[0] - 1];
			if (l !== 1) {
				if (!(dl === 1 || dl === 3 || dl === 8)) {
					for (i = 2; i < 5; i++) {
						if (map.data[this.coor[1] + i][this.coor[0] - 1] === 1 || map.data[this.coor[1] + i][this.coor[0] - 1] === 3 || map.data[this.coor[1] + i][this.coor[0] - 1] === 8) {
							this.move(1, false);
							return;
						}
					}
				} else this.move(1, l === 8);
				return;
			}
		}
	},
	move: function (action, pushing, canPush) {
		if (!this.spawned) return;
		this.moving = true;
		this.action = action;
		switch (action) {
			case 1: // left
				this.ox -= unit / 20;
				this.dir = 1;
				if (this.ox <= -unit) {
					if (!pushing) {this.end(0, -1); return;}
					else { // end pushing
						if (canPush) this.end(0, -1);
						else this.end(0, 0);
						return;
					}
				}
				if (!pushing) this.draw([Math.floor(this.ox / unit * -2) % 2 * 144 + 288, 144]);
				else { // push the crate
					if (canPush === undefined) {
						var crate = map.get(8, [this.coor[0] - 1, this.coor[1]]);
						canPush = crate.try(0, 0);
					}
					this.draw([Math.floor(this.ox / unit * -2) % 2 * 144 + 288, 720], !canPush);
				}
				break;
			case 2: // climb up
				this.oy -= unit / 30;
				this.dir = 0;
				if (this.oy <= -unit) {this.end(1, -1); return;}
				if (!pushing) this.draw([Math.floor(this.oy / unit * -2) % 2 * 144, 288]);
				break;
			case 3: // right
				this.ox += unit / 20;
				this.dir = 0;
				if (this.ox >= unit) {
					if (!pushing) {this.end(0, 1); return;}
					else { // end pushing
						if (canPush) this.end(0, 1);
						else this.end(0, 0);
						return;
					}
				}
				if (!pushing) this.draw([Math.floor(this.ox / unit * 2) % 2 * 144, 144]);
				else { // push the crate
					if (canPush === undefined) {
						var crate = map.get(8, [this.coor[0] + 1, this.coor[1]]);
						if (crate !== undefined) canPush = crate.try(2, 0);
					}
					this.draw([Math.floor(this.ox / unit * 2) % 2 * 144, 720], !canPush);
				}
				break;
			case 4: // climb down
				this.oy += unit / 30;
				this.dir = 0;
				if (this.oy >= unit) {this.end(1, 1); return;}
				this.draw([Math.floor(this.oy / unit * 2) % 2 * 144, 288]);
				break;
			case 5: // falling
				if (this.vy < unit / 8) this.vy += unit / 56;
				this.oy += this.vy;
				var b = map.data[this.coor[1] + Math.floor(this.oy / unit) + 1][this.coor[0]];
				if (b === 1 || b === 3 || b === 8) {this.end(1, Math.floor(this.oy / unit)); return;}
				if (map.data[this.coor[1] + Math.floor(this.oy / unit)][this.coor[0]] === 9) this.getKey();
				this.draw([this.dir * 288, 432]);
				break;
			case 6: // pull
				this.vy++;
				var sw = map.data[this.coor[1]][this.coor[0]];
				if (this.vy === 1) this.draw([map.switches[sw - 4] * 288, 576]);
				else if (this.vy === 18) {
					this.draw([map.switches[sw - 4] * 288 + 144, 576]);
					map.update(this.coor, sw, false, true);
				} else if (this.vy === 32) {this.end(0, 0); return;}
				break;
			case 7: // unlock
				this.vy++;
				if (this.vy === 1) this.draw([288, 576]);
				else if (this.vy === 18) {
					this.draw([432, 576]);
					var ch = map.get(10, this.coor);
					ch.locked = false;
					ch.draw();
					this.keyCount--;
					// REMEMBER!!: below line needs work; currently all keys would disappear.
					this.inventDOM.innerHTML = '<img src="key.png" style="margin-top: calc(var(--pixel) * -1); width: calc(var(--pixel) * 10); height: calc(var(--pixel) * 10);">x&thinsp;' + this.keyCount;
				} else if (this.vy === 32) {this.end(0, 0); return;}
				break;
			case 8: // collect
				this.vy++;
				if (this.vy === 1) this.draw([0, 576]);
				else if (this.vy === 14) {
					this.draw([144, 576]);
					var ch = map.get(10, this.coor);
					this.collect(ch.inside);
					ch.inside = 0;
					ch.draw();
				} else if (this.vy === 32) {this.end(0, 0); return;}
				break;
			case 9: // die
				this.vy++;
				if (this.vy === 1) this.draw([288 * this.dir, 864]);
				else if (this.vy === 18) {
					this.draw([288 * this.dir + 144, 864]);
				} else if (this.vy === 40) {this.reset(map.resets[map.bestStage][1]); return;}
		}
		window.requestAnimationFrame(() => {avatar.move(action, pushing, canPush);});
	},
	end: function (co, dir) { // end an animation
		this.coor[co] += dir;
		this.action = 0;
		this.ox = 0;
		this.oy = 0;
		this.vy = 0;
		this.moving = false;
		this.step(Math.floor((step % 4) / 2));
		if (map.data[this.coor[1]][this.coor[0]] === 12) {
			map.startStage(map.bestStage);
			return;
		}
		if (map.data[this.coor[1] + 1][this.coor[0]] !== 1 && map.data[this.coor[1] + 1][this.coor[0]] !== 3 && map.data[this.coor[1] + 1][this.coor[0]] !== 8) this.move(5);
		if (map.data[this.coor[1]][this.coor[0]] === 9) this.getKey();
		if (co) map.newHeight(this.coor[1], dir);
		map.completeStage(this.coor);
	},
	step: function (s) { // s = step % 2
		if (this.moving || !this.spawned) return;
		if (map.data[this.coor[1]][this.coor[0]] === 3 && map.data[this.coor[1] + 1][this.coor[0]] === 3) { // on ladder
			this.draw([s * 144 + 288, 288]);
		} else { // on ground
			this.draw([s * 144 + this.dir * 288, 0]);
		}
	},
	draw: function (a, centered) {
		if (!a) var a = [0, 0];
		clear(actx);
		if (!centered) actx.drawImage(avImg, a[0], a[1], 144, 144, this.coor[0] * unit + this.ox, this.coor[1] * unit + this.oy, unit, unit);
		else actx.drawImage(avImg, a[0], a[1], 144, 144, this.coor[0] * unit, this.coor[1] * unit, unit, unit);
	},
	getKey: function () {
		var key = map.get(9, [this.coor[0], this.coor[1] + Math.floor(this.oy / unit)]);
		if (!key) return;
		if (this.collect(9)) key.end();
	},
	collect: function (item) {
		if (!item) return false;
		switch (item) {
			case 9: // key
				this.keyCount++;
				this.inventDOM.innerHTML = '<img src="key.png" style="margin-top: calc(var(--pixel) * -1); width: calc(var(--pixel) * 10); height: calc(var(--pixel) * 10);">x&thinsp;' + this.keyCount;
				break;
		}
		return true;
	},
	reset: function (coor) {
		// gotta do death animation
		var av = this;
		av.spawned = false;
		av.coor = coor.map(x => x);
		av.dir = 0;
		av.end(1, 0);
		setTimeout(() => {av.spawned = true; av.draw();}, 300);
	}
}

var map = {
	top: 68,
	data: [ // a live world map -- apart from avatar.
		[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 3, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		[0, 3, 1, 1, 1, 3, 1, 0, 1, 0, 0, 0, 1, 1, 3, 0],
		[0, 3, 0, 0, 0, 3, 4, 0, 0, 0, 0, 0, 0, 0, 3, 0],
		[0, 1, 0, 0, 0, 3, 1, 0, 0, 0, 0, 0, 0, 0, 1, 3],
		[0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 5, 3],
		[1, 1, 0, 0, 0, 1, 3, 0, 0, 1, 0, 0, 0, 1, 1, 3],
		[0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 3],
		[0, 0, 0, 0, 1, 1, 3, 1, 0, 0, 0, 1, 3, 1, 0, 3],
		[0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 3, 0, 0, 3],
		[0, 1, 0, 0, 3, 1, 0, 0, 3, 1, 1, 3, 1, 1, 3, 1],
		[0, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 3, 0, 0, 3, 0],
		[0, 3, 0, 1, 1, 0, 3, 0, 1, 0, 3, 1, 1, 0, 3, 0],
		[0, 3, 4, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0],
		[0, 1, 3, 1, 1, 0, 0, 0, 3, 0, 1, 0, 3, 0, 1, 1],
		[0, 0, 3, 0, 0, 5, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0],
		[0, 1, 1, 1, 1, 1, 3, 0, 1, 1, 0, 0, 1, 0, 3, 0],
		[0, 0, 0, 0, 0, 0, 3, 6, 0, 0, 0, 0, 0, 0, 3, 0],
		[3, 1, 1, 1, 0, 0, 1, 1, 0, 1, 1, 1, 0, 0, 1, 3],
		[3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3],
		[3, 1, 0, 0, 0, 0, 0, 0, 0, 0, 3, 1, 1, 0, 0, 3],
		[3, 6, 0, 0, 1, 1, 0, 0, 3, 0, 3, 0, 0, 0, 7, 3],
		[3, 1, 0, 0, 0, 0, 3, 1, 1, 0, 1, 0, 0, 0, 1, 1],
		[3, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		[1, 1, 3, 1, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 1, 3],
		[0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3],
		[0, 0, 1, 0, 0, 3, 0, 3, 1, 0, 0, 1, 0, 0, 3, 1],
		[0, 0, 0, 0, 0, 3, 0, 3, 0, 0, 0, 0, 0, 0, 3, 0],
		[3, 1, 0, 1, 1, 1, 0, 3, 0, 0, 1, 0, 0, 0, 3, 0],
		[3, 0, 0, 0, 0, 0, 0, 3, 5, 0, 0, 0, 0, 0, 3, 0],
		[3, 0, 1, 1, 3, 1, 0, 3, 1, 0, 0, 0, 1, 3, 1, 0],
		[3, 0, 0, 0, 3, 0, 0, 3, 0, 0, 0, 0, 0, 3, 7, 0],
		[1, 3, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 1, 1, 3],
		[0, 3, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3],
		[3, 1, 1, 0, 1, 1, 0, 0, 0, 3, 1, 0, 0, 0, 0, 3],
		[3, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 3, 1, 0, 3],
		[3, 4, 0, 0, 0, 0, 1, 1, 1, 3, 0, 0, 3, 0, 0, 3],
		[1, 3, 0, 3, 0, 0, 0, 0, 0, 3, 0, 0, 1, 0, 0, 3],
		[0, 3, 0, 3, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 1],
		[0, 3, 1, 1, 0, 0, 0, 0, 0, 1, 3, 1, 0, 0, 0, 0],
		[0, 3, 0, 0, 0, 3, 1, 0, 0, 0, 3, 0, 0, 0, 0, 0],
		[0, 3, 0, 0, 0, 3, 0, 0, 0, 0, 3, 0, 0, 7, 0, 0],
		[3, 1, 0, 1, 1, 3, 0, 1, 1, 0, 1, 0, 1, 1, 3, 0],
		[3, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0],
		[3, 0, 0, 0, 0, 1, 3, 0, 0, 0, 0, 1, 1, 1, 3, 0],
		[3, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 3, 0],
		[1, 1, 0, 0, 0, 3, 1, 1, 1, 3, 0, 0, 0, 0, 1, 3],
		[0, 0, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 0, 0, 3],
		[0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 0, 3, 1, 1, 1, 1],
		[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0],
		[3, 1, 0, 0, 0, 0, 0, 3, 1, 0, 0, 1, 0, 0, 1, 3],
		[3, 0, 0, 6, 0, 0, 0, 3, 0, 0, 0, 5, 0, 0, 0, 3],
		[3, 0, 1, 1, 1, 0, 0, 1, 3, 0, 1, 1, 0, 0, 3, 1],
		[3, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 3, 0],
		[1, 1, 0, 3, 1, 0, 1, 1, 1, 0, 0, 3, 1, 0, 1, 0],
		[0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0],
		[0, 0, 0, 1, 1, 1, 1, 3, 0, 0, 1, 1, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0],
		[3, 1, 1, 0, 0, 3, 1, 1, 0, 0, 0, 0, 0, 0, 1, 3],
		[3, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 4, 0, 0, 0, 3],
		[3, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 3],
		[3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3],
		[1, 1, 1, 3, 0, 0, 1, 3, 1, 1, 0, 1, 3, 1, 1, 1],
		[0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 0, 3, 0, 0, 0],
		[0, 0, 0, 3, 0, 2, 0, 3, 0, 0, 0, 0, 3, 0, 0, 0],
		[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
	],
	tracks: [ // 0-left 1-up 2-right 3-down
		[new Track([4, 74], [1, 1, 0, 1, 1, 1], [3, 72]), new Track([13, 70], [0, 1, 1, 3], [12, 67]), new Track([3, 45], [3, 2, 0, 1, 3, 1], [2, 48]), new Track([2, 53], [1, 2], [2, 51]), new Track([9, 53], [1, 1, 2, 2, 3, 1], [11, 53]), new Track([6, 41], [3, 2], [6, 43]), new Track([4, 37], [1, 2], [4, 35]), new Track([12, 39], [3, 1, 0, 1, 3, 1], [11, 41]), new Track([13, 35], [3, 2], [13, 37]), new Track([2, 21], [3, 2], [2, 23]), new Track([5, 23], [1, 1, 2, 1, 1, 1], [6, 21]), new Track([9, 26], [1, 1], [9, 25]), new Track([6, 25], [3, 1, 2, 1], [7, 26]), new Track([11, 15], [0, 1, 1, 2], [10, 13])],
		[new Track([2, 65], [3, 1, 2, 3, 1, 1], [5, 65]), new Track([9, 61], [3, 4], [9, 65]), new Track([12, 61], [3, 2], [12, 63]), new Track([6, 59], [3, 2], [6, 61]), new Track([5, 42], [0, 2, 3, 1], [3, 43]), new Track([1, 37], [1, 1, 2, 2, 3, 1], [3, 37]), new Track([8, 43], [3, 1, 2, 3, 1, 1], [11, 43]), new Track([11, 39], [1, 1, 2, 1, 1, 1], [12, 37]), new Track([9, 35], [1, 2], [9, 33]), new Track([0, 21], [3, 2], [0, 23]), new Track([3, 22], [1, 1], [3, 21]), new Track([7, 23], [3, 2], [7, 25]), new Track([14, 19], [3, 1], [14, 20]), new Track([13, 25], [1, 1, 0, 2, 3, 1], [11, 25]), new Track([11, 27], [3, 1, 2, 2, 1, 1], [13, 27]), new Track([2, 15], [3, 1, 0, 2, 1, 1], [0, 15]), new Track([3, 15], [3, 2], [3, 17]), new Track([9, 15], [3, 1, 2, 2], [11, 16])],
		[new Track([2, 61], [2, 3, 3, 2], [5, 63]), new Track([13, 65], [1, 2], [13, 63]), new Track([4, 57], [0, 2], [2, 57]), new Track([2, 31], [2, 2], [4, 31]), new Track([5, 29], [3, 1, 2, 1, 3, 2], [6, 32]), new Track([7, 32], [1, 2, 2, 1, 1, 1], [8, 29]), new Track([11, 33], [1, 1, 2, 2, 3, 1], [13, 33]), new Track([0, 18], [2, 2, 1, 1], [2, 17]), new Track([8, 19], [1, 1, 0, 1, 1, 1], [7, 17]), new Track([10, 17], [3, 1, 0, 1, 3, 1], [9, 19]), new Track([9, 13], [3, 1, 0, 2, 1, 1], [7, 13]), new Track([13, 15], [3, 1, 0, 1, 3, 1], [12, 17]), new Track([0, 20], [2, 3, 1, 1], [3, 19])],
		[new Track([13, 61], [1, 1, 0, 3, 3, 1], [10, 61]), new Track([7, 59], [1, 1, 2, 3, 3, 1], [10, 59]), new Track([10, 55], [0, 3], [7, 55]), new Track([14, 50], [3, 1, 2, 1, 3, 2], [15, 53]), new Track([5, 49], [2, 2, 3, 2], [7, 51]), new Track([11, 48], [3, 1, 2, 1, 3, 1], [12, 50]), new Track([1, 41], [1, 1, 2, 1, 1, 1], [2, 39]), new Track([9, 39], [3, 4], [9, 43]), new Track([8, 35], [3, 1, 2, 2, 1, 1], [10, 35]), new Track([2, 43], [1, 1, 0, 1], [1, 42]), new Track([4, 17], [1, 2], [4, 15]), new Track([8, 17], [1, 2, 0, 1], [7, 15]), new Track([11, 13], [3, 1, 2, 1, 3, 1], [12, 15])]
	],
	switches: [0, 0, 0, 0],
	crates: [new Crate([12, 54], 0), new Crate([1, 47], 4), new Crate([1, 28], 0), new Crate([10, 32], 3), new Crate([4, 24], 0), new Crate([13, 16], 0), new Crate([12, 12], 0)],
	keys: [new Key([6, 72]), new Key([3, 55]), new Key([4, 48]), new Key([6, 36]), new Key([10, 16])],
	plates: [new Plate([1, 38], [[12, 30]]), new Plate([12, 34], [[9, 28]]), new Plate([1, 20], [[4, 12], [6, 12]]), new Plate([13, 12], [[2, 20]])],
	enemies: [new Fireball([8, 36]), new Fireball([12, 42]), new Fireball([1, 26])],
	torches: [new Torch([13, 26], [[5, 20], [13, 18]])],
	moving: 0,
	movingSI: 0, // Switch index; which is moving
	stages: [68, 60, 52, 44, 36, 28, 20, 12, 4],
	resets: [ // [[switches, 1, 2, 3], [avCoor]]
		[[0, 0, 0, 0], [5, 76]],
		[[1, 0, 0, 0], [7, 66]], 
		[[1, 0, 0, 0], [11, 58]],
		[[1, 0, 1, 1], [1, 49]],
		[[1, 0, 1, 0], [15, 42]],
		[[0, 1, 1, 1], [2, 34]],
		[[0, 1, 1, 1], [6, 26]],
		[[1, 1, 1, 1], [6, 18]],
		[[0, 0, 0, 0], [3, 10]]
	],
	currentHeight: 0,
	bestStage: 0,
	respawnRate: 10000, // milliseconds
	draw: function () {
		document.body.style.setProperty("--top", this.top);
		for (var y = 0; y < this.data.length; y++) {
			for (var x = 0; x < this.data[y].length; x++) {
				this.update([x, y], this.data[y][x]);
			}
		}
		for (var n = 0; n < this.tracks.length; n++) {
			for (var b = 0; b < this.tracks[n].length; b++) {
				this.tracks[n][b].draw(true);
				this.tracks[n][b].drawTracks(n);
			}
		}
		for (var i = 0; i < this.crates.length; i++) {
			this.crates[i].draw();
			this.data[this.crates[i].coor[1]][this.crates[i].coor[0]] = 8;
		}
		for (var i = 0; i < this.keys.length; i++) {
			if (saves[3][i] === "0") this.data[this.keys[i].coor[1]][this.keys[i].coor[0]] = 9;
			else this.keys[i].end();
		}
		for (var i = 0; i < this.plates.length; i++) {
			this.data[this.plates[i].coor[1]][this.plates[i].coor[0]] = 11;
			for (var n = 0; n < this.plates[i].spikes.length; n++) {
				this.data[this.plates[i].spikes[n][1]][this.plates[i].spikes[n][0]] = 12;
			}
			this.plates[i].draw();
		}
		for (var i = 0; i < this.enemies.length; i++) {
			this.enemies[i].draw();
		}
		for (var i = 0; i < this.torches.length; i++) {
			this.torches[i].draw();
		}
		this.moving = 0;
	},
	get: function (type, coor, sw) {
		var toReturn = false;
		switch (type) {
			case 0: // track end/start point
			case 1: // shifting block current location
				if (sw === undefined) {
					this.tracks.forEach((r) => {
						r.forEach((t) => {
							if ((t.start[0] === coor[0] && t.start[1] === coor[1]) || (t.final[0] === coor[0] && t.final[1] === coor[1])) toReturn = t;
						});
					});
				} else {
					this.tracks[sw].forEach((t) => {
						if ((t.start[0] === coor[0] && t.start[1] === coor[1]) || (t.final[0] === coor[0] && t.final[1] === coor[1])) toReturn = t;
					});
				}
				break;
			case 8: // crate
				this.crates.forEach((c) => {
					if (c.coor[0] === coor[0] && c.coor[1] === coor[1]) toReturn = c;
				});
				break;
			case 9: // key
				this.keys.forEach((k) => {
					if (k.coor[0] === coor[0] && k.coor[1] === coor[1]) toReturn = k;
				});
				break;
			case 11: // pressure plate
				this.plates.forEach((p) => {
					if (p.coor[0] === coor[0] && p.coor[1] === coor[1]) toReturn = p;
				});
				break;
		}
		return toReturn;
	},
	update: function ([x, y], value, a, switching) {
		if (value !== -1) this.data[y][x] = value;
		if (!a) var a = [3000, 3000, 304, 304, 0, 0, 1, 1, terrain];
		clear(mctx, [x, y]);
		switch (value) {
			case 1: // ground
				a = [0, 0, 304, 304, 0, 0, 1, 1, ground];
				var s = [this.data[y][x - 1], this.data[y][x + 1]];
				if (s[0] !== 1 && s[0] !== 3 && s[1] !== 1 && s[1] !== 3) a[0] = 912;
				else if ((s[0] === 1 || s[0] === 3) && (s[1] === 1 || s[1] === 3)) a[0] = 304;
				else if (s[0] === 1 || s[0] === 3) a[0] = 608;
				break;
			case 2: // avatar
				avatar.coor = [x, y];
				avatar.draw();
				this.data[y][x] = 0;
				break;
			case 3: // ladder
				if (this.data[y][x - 1] === 1 || this.data[y][x + 1] === 1) {
					a = [304, 304, 304, 304, 0, 0, 1, 1, ground];
					if (this.data[y - 1][x] === 3) a[1] += 304;
					if (this.data[y][x - 1] !== 1) a[0] = 0;
					else if (this.data[y][x + 1] !== 1) a[0] = 608;
				} else a = [304, 304, 304, 304, 0, 0, 1, 1, terrain];
				break;
			case 4: // switch 1
			case 5: // switch 2
			case 6: // switch 3
			case 7: // switch 4
				if (switching) this.switch(value - 4, this.switches[value - 4] * -1 + 1);
				else this.switch(value - 4, this.switches[value - 4]);
				a = [152 * (this.switches[value - 4]), 608 + 152 * (value - 4), 152, 152, 0, unit / 2, 2, 2, terrain];
				break;
		}
		mctx.drawImage(a[8], a[0], a[1], a[2], a[3], x * unit + a[4], y * unit + a[5], unit / a[6], unit / a[7]);
	},
	newHeight: function (y, dir) {
		if (dir === -1) { // av moved up
			if (this.stages[this.currentHeight] > y) this.currentHeight++;
		} else if (this.currentHeight > 0) { // av moved down
			if (this.stages[this.currentHeight - 1] < y + 1) this.currentHeight--;
		}
		this.top = this.stages[this.currentHeight];
		document.body.style.setProperty("--top", this.top);
	},
	switch: function (i, v) {
		if (this.switches[i] === v) return;
		this.switches[i] = v;
		this.movingSI = i;
		for (x = 0; x < 16; x++) {
			for (y = 0; y < this.data.length; y++) {
				if (map.data[y][x] === i + 4) {
					map.update([x, y], i + 4, false, false);
				}
			}
		}
		for (b = 0; b < this.tracks[i].length; b++) {
			this.tracks[i][b].move(v, true);
		  this.moving++;
		}
	},
	step: function (s) { // for animating items
		for (i = 0; i < this.keys.length; i++) {
			this.keys[i].step(s);
		}
		for (i = 0; i < this.torches.length; i++) {
			this.torches[i].draw();
		}
		for (var i = 0; i < this.crates.length; i++) {
			this.crates[i].draw(500);
		}
	},
	completeStage: function (coor) { // for all instances of restarting :)
		for (i = this.bestStage; i < this.resets.length; i++) {
			if (coor[0] === this.resets[i][1][0] && coor[1] === this.resets[i][1][1]) {
				if (i !== this.bestStage) menu.showD(i, false);
				this.bestStage = i;
				saves[0] = i;
				if (localStorage.getItem('bestStage')) localStorage.setItem('bestStage', saves[0]);
				console.log("Current stage is " + (saves[0] + 1));
				document.getElementById("LastSaved").innerHTML = "Last saved at Stage " + (saves[0] + 1);
				menu.stage.innerHTML = "Stage " + (this.bestStage + 1);
				menu.restart.innerHTML = "Restart Stage " + (this.bestStage + 1);
			}
		}
	},
	startStage: function (stage, dead = true) {
		if (this.moving) return false;
		if (dead) {
			avatar.move(9);
			saves[2]++;
			menu.stats.innerHTML = "Attempts: " + saves[2];
			if (localStorage.getItem('attempts')) localStorage.setItem('attempts', saves[2]);
		} else {
			avatar.reset(map.resets[map.bestStage][1]);
		}
		this.crates.forEach((c) => {
			if (c.spawned) c.move(1, 1, true, true, true);
			else c.end(0, 0, true, true, true);
		});
		this.enemies.forEach((e) => {
			e.reset();
		});
		for (i = 0; i < 4; i++) {
			if (this.resets[stage][0][i] !== this.switches[i]) {
				this.switch(i, this.resets[stage][0][i]);
			}
		}
		this.currentHeight = stage;
		this.top = this.stages[this.bestStage];
		document.body.style.setProperty("--top", this.top);
		return true;
	}
}

function Fireball(coor) {
	this.start = coor;
	this.coor = coor.map(x => x);
	this.jumped = false; // so he won't jump more than once LOL
	this.offset = [0, 0];
	this.jInfo = [unit / 12, 0, 0, true]; // [vy, tempDir, xToMove, first]
	this.dir = 0; // 0-right 1-left
	this.action = 0; // 0-stopped 1-left 2-up 3-right 4-down 5-jumping away
	this.offLadder = 0; // -1-up 1-down
	this.moving = false;
	this.draw = function () {
		ectx.drawImage(fireImg, (step % 4) * 304, this.dir * 304, 304, 304, this.coor[0] * unit + this.offset[0], this.coor[1] * unit + this.offset[1], unit, unit);
	};
	this.try = function (repeat) {
		// COMPLICATED STUFF
		var f = this;
		if (map.moving && !f.jumped && f.action % 2) {
			var on = map.get(1, [f.coor[0], f.coor[1] + 1], map.movingSI);
			var over = map.get(1, [f.coor[0] + 1 - 2 * f.jInfo[1], f.coor[1] + 1], map.movingSI);
			if (over && f.jInfo[1] === f.dir) {
				f.jInfo[1] = f.dir;
				f.dir = f.dir * -1 + 1;
			}
			if (on || over) f.move(5);
			else {
				f.move(0);
				f.jumped = true;
			}
			f.jInfo[3] = false;
			return;
		} else if (map.moving) {f.move(0); return;
		}	else if (f.moving) {f.move(f.action); return;}
		var above = map.data[f.coor[1] - 1][f.coor[0]];
		var below = map.data[f.coor[1] + 1][f.coor[0]];
		var curr = map.data[f.coor[1]][f.coor[0]];
		var side = map.data[f.coor[1]][f.coor[0] + 1 - 2 * f.dir];
		var down = map.data[f.coor[1] + 1][f.coor[0] + 1 - 2 * f.dir];
		if ((above === 3 || (curr === 3 && above !== 8 && above !== 12 && above !== 1)) && f.offLadder !== 1) { // gonna climb up
			f.move(2);
		} else if (below === 3 && f.offLadder !== -1) { // gonna climb down
			f.move(4);
		} else { // not gonna climb
			if (side === 1 || side === 8 || side === 12 || (down !== 1 && down !== 3 && down !== 8)) { // changing direction
				f.dir = f.dir * -1 + 1;
				f.jInfo[1] = f.dir;
				var behind = map.data[f.coor[1] + 1][f.coor[0] + 1 - 2 * f.dir];
				side = map.data[f.coor[1]][f.coor[0] + 1 - 2 * f.dir];
				if (side === 1 || side === 8 || side === 12 || (behind !== 1 && behind !== 3 && behind !== 8)) {
					f.dir = f.dir * -1 + 1;
					f.jInfo[1] = f.dir;
					f.offLadder = 0;
					if (!repeat) this.try(true);
				} else {
					f.move(3 - 2 * f.dir);
				}
			} else {
				f.move(3 - 2 * f.dir);
			}
		}
	};
	this.move = function (action) {
		if (paused) return;
		this.moving = true;
		this.action = action;
		clear(ectx, this.coor, ...this.offset);
		switch (action) {
			case 0: // resting
				this.moving = false;
				break;
			case 1: // left
				this.offset[0] -= unit / 40;
				if (this.offset[0] <= -unit) {
					this.end(0, -1);
				}
				break;
			case 2: // up
				this.offset[1] -= unit / 40;
				if (this.offset[1] <= -unit) {
					this.end(1, -1);
				}
				break;
			case 3: // right
				this.offset[0] += unit / 40;
				if (this.offset[0] >= unit) {
					this.end(0, 1);
				}
				break;
			case 4: // down
				this.offset[1] += unit / 40;
				if (this.offset[1] >= unit) {
					this.end(1, 1);
				}
				break;
			case 5: // jump away (in dir)
				if (this.jInfo[3]) {
					if (this.jInfo[1] !== this.dir) this.jInfo[2] = this.offset[0] / -26;
					else if (this.dir === 1) this.jInfo[2] = (this.offset[0] * -1 - unit) / 26;
					else this.jInfo[2] = (this.offset[0] * -1 + unit) / 26;
				}
				this.offset[1] -= this.jInfo[0];
				this.offset[0] += this.jInfo[2];
				this.jInfo[0] -= unit / 158;
				if (this.jInfo[0] <= unit / -12) {
					if (this.jInfo[1] !== this.dir) this.end(0, 0);
					else this.end(0, 1 - this.dir * 2);
					this.jumped = true;
				}
				break;
		}
		if (Math.abs(avatar.coor[0] + avatar.ox / unit - this.coor[0] - this.offset[0] / unit) < 0.4 && Math.abs(avatar.coor[1] + avatar.oy / unit - this.coor[1] - this.offset[1] / unit - 0.2) < 0.5) {
			map.startStage(map.bestStage);
		}
		this.draw();
	};
	this.end = function (axis, dir) {
		var f = this;
		f.coor[axis] += dir;
		if (axis) f.offLadder = dir;
		else f.offLadder = 0;
		f.jInfo[0] = unit / 12;
		f.offset = [0, 0];
		f.action = 0;
		f.moving = false;
		f.jumped = false;
		f.jInfo[2] = 0;
		f.jInfo[3] = true;
		map.torches.forEach((t) => {
			if (t.coor[0] === f.coor[0] && t.coor[1] === f.coor[1]) t.light();
		});
	};
	this.reset = function () {
		clear(ectx, this.coor, ...this.offset);
		this.dir = 0;
		this.end(0, 0);
		this.coor = this.start.map(x => x);
	}
}

function Plate(coor, spikes) {
	this.down = 0; // counts up to 10 to be down... for delay of animation
	this.spikes = spikes;
	this.coor = coor;
	this.draw = function (halfway) {
		if (halfway) {
			clear(ictx, this.coor);
			ictx.drawImage(terrain, 608, 456, 304, 152, this.coor[0] * unit, this.coor[1] * unit + unit / 2, unit, unit / 2);
			this.spikes.forEach((c) => {
				clear(ictx, c);
				ictx.drawImage(terrain, 912, 456, 304, 152, c[0] * unit, c[1] * unit + unit / 2, unit, unit / 2);
			});
		} else if (!this.down) {
			clear(ictx, this.coor);
			ictx.drawImage(terrain, 608, 304, 304, 152, this.coor[0] * unit, this.coor[1] * unit + unit / 2, unit, unit / 2);
			this.spikes.forEach((c) => {
				clear(ictx, c);
				ictx.drawImage(terrain, 912, 304, 304, 152, c[0] * unit, c[1] * unit + unit / 2, unit, unit / 2);
				if (!(map.data[c[1]][c[0]] === 12)) {
					if (map.data[c[1]][c[0]] === 8) {
						var crate = map.get(8, c);
						crate.behind = 12;
					} else map.data[c[1]][c[0]] = 12;
				}
			});
		} else {
			clear(ictx, this.coor);
			this.spikes.forEach((c) => {
				clear(ictx, c);
				if (map.data[c[1]][c[0]] === 12) map.data[c[1]][c[0]] = 0;
				else if (map.data[c[1]][c[0]] === 8) {
					var crate = map.get(8, c);
					crate.behind = 0;
				}
			});
		}
	}
	this.update = function () {
		// deal with avatar
		if (Math.round(avatar.coor[1] + avatar.oy / unit) === this.coor[1] && Math.abs(this.coor[0] - avatar.coor[0] - avatar.ox / unit) < 0.5) {
			if (this.down < 10) {
				this.down++;
				this.draw(true);
				return;
			} else {this.draw(); return;}
		}
		if (map.data[this.coor[1]][this.coor[0]] === 8) {
			if (this.down < 10) {
				this.down++;
				this.draw(true);
				return;
			} else {this.draw(); return;}
		}
		if (this.down > 0) {
			this.down--;
			this.draw(true);
			return;
		}
		this.draw();
	}
}

function Track(coor, track, dest) {
	this.start = coor.map(x => x);
	this.final = dest.map(x => x);
	this.coor = coor.map(x => x);
	this.track = track;
	this.spot = 1;
	this.oy = 0;
	this.ox = 0;
	this.draw = function (done) {
		tctx.drawImage(terrain, 304, 0, 304, 304, this.coor[0] * unit + this.ox, this.coor[1] * unit + this.oy, unit, unit);
		if (done) {
			map.data[this.coor[1]][this.coor[0]] = 1;
			map.moving--;
		}
	};
	this.move = function (dir, first) {
		// *** note *** the extra +/- unit / 20's are the opposite of what you would expect on purpose; otherwise the crate gets ahead. :)
		var b = this;
		var mult = dir ? 1 : -1; // forward, backward
		if (first) {
			if (dir) map.data[b.start[1]][b.start[0]] = 0;
			else map.data[b.final[1]][b.final[0]] = 0;
		}
		clear(tctx, b.coor, b.ox, b.oy);
		switch (b.track[b.spot - 1]) {
			case 0: // left
				b.ox -= unit / 20 * mult;
				if (b.ox * -1 * mult / unit >= b.track[b.spot]) {
					b.ox = 0;
					b.coor[0] -= b.track[b.spot] * mult;
					if ((b.track.length + b.track.length * mult) * mult <= (b.spot + 2 * mult) * 2 * mult) {this.end(dir); return;}
					else b.spot += 2 * mult;
				}
				// pushing
				if (map.data[b.coor[1]][b.coor[0] - Math.floor(((b.ox * -1 - unit / 20 * mult) * mult) / unit) * mult - 1 * mult] === 8) {
					var crate = map.get(8, [b.coor[0] - Math.floor(((b.ox * -1 - unit / 20 * mult) * mult) / unit) * mult - 1 * mult, b.coor[1]]);
					crate.try(1 - mult, 1);
				}
				// riding
				if (map.data[b.coor[1] - 1][b.coor[0] - Math.floor(((b.ox * -1 - unit / 20 * mult) * mult) / unit) * mult] === 8) {
					var crate = map.get(8, [b.coor[0] - Math.floor(((b.ox * -1 - unit / 20 * mult) * mult) / unit) * mult, b.coor[1] - 1]);
					crate.try(1 - mult, 2);
				}
				break;
			case 1: // up
				b.oy -= unit / 20 * mult;
				if (b.oy * -1 * mult / unit >= b.track[b.spot]) {
					b.oy = 0;
					b.coor[1] -= b.track[b.spot] * mult;
					if ((b.track.length + b.track.length * mult) * mult <= (b.spot + 2 * mult) * 2 * mult) {this.end(dir); return;}
					else b.spot += 2 * mult;
				}
				if (map.data[b.coor[1] - Math.floor((b.oy + unit / 20 * mult) / unit * -1 * mult) * mult - 1][b.coor[0]] === 8) { // crate above
					var crate = map.get(8, [b.coor[0], b.coor[1] - Math.floor((b.oy + unit / 20 * mult) / unit * -1 * mult) * mult - 1]);
					crate.try(2 - mult, 1);
				}
				if (map.data[b.coor[1] - Math.floor((b.oy + unit / 20 * mult) / unit * -1 * mult) * mult + 1][b.coor[0]] === 8) { // crate below
					var crate = map.get(8, [b.coor[0], b.coor[1] - Math.floor((b.oy + unit / 20 * mult) / unit * -1 * mult) * mult + 1]);
					crate.try(2 - mult, 1);
				}
				break;
			case 2: // right
				b.ox += unit / 20 * mult;
				if (b.ox * mult / unit >= b.track[b.spot]) {
					b.ox = 0;
					b.coor[0] += b.track[b.spot] * mult;
					if ((b.track.length + b.track.length * mult) * mult <= (b.spot + 2 * mult) * 2 * mult) {this.end(dir); return;}
					else b.spot += 2 * mult;
				}
				if (map.data[b.coor[1]][b.coor[0] + Math.floor(((b.ox - unit / 20 * mult) * mult) / unit) * mult + 1 * mult] === 8) {
					var crate = map.get(8, [b.coor[0] + Math.floor(((b.ox - unit / 20 * mult) * mult) / unit) * mult + 1 * mult, b.coor[1]]);
					crate.try(1 + mult, 1);
				}
				if (map.data[b.coor[1] - 1][b.coor[0] + Math.floor(((b.ox - unit / 20 * mult) * mult) / unit) * mult] === 8) {
					var crate = map.get(8, [b.coor[0] + Math.floor(((b.ox - unit / 20 * mult) * mult) / unit) * mult, b.coor[1] - 1]);
					crate.try(1 + mult, 2);
				}
				break;
			case 3: // down
				b.oy += unit / 20 * mult;
				if (b.oy * mult / unit >= b.track[b.spot]) {
					b.oy = 0;
					b.coor[1] += b.track[b.spot] * mult;
					if ((b.track.length + b.track.length * mult) * mult <= (b.spot + 2 * mult) * 2 * mult) {this.end(dir); return;}
					else b.spot += 2 * mult;
				}
				if (map.data[b.coor[1] + Math.floor((b.oy - unit / 20 * mult) / unit * mult) * mult - 1][b.coor[0]] === 8) {
					var crate = map.get(8, [b.coor[0], b.coor[1] + Math.floor((b.oy - unit / 20 * mult) / unit * mult) * mult - 1]);
					crate.try(2 + mult, 1);
				}
				//console.log(map.data[b.coor[1] + Math.floor((b.oy - unit / 20 * mult) / unit * mult) * mult + 1][b.coor[0]]);
				if (map.data[b.coor[1] + Math.floor((b.oy - unit / 20 * mult) / unit * mult) * mult + 1][b.coor[0]] === 8 && mult === 1) { // crate below
					var crate = map.get(8, [b.coor[0], b.coor[1] + Math.floor((b.oy - unit / 20 * mult) / unit * mult) * mult + 1]);
					crate.try(2 + mult, 1, true);
				}
				break;
		}
		b.draw();
		window.requestAnimationFrame(() => {b.move(dir);})
	};
	this.end = function (dir) {
		var b = this;
		b.ox = 0;
		b.oy = 0;
		if (dir) b.coor = b.final.map(x => x);
		else b.coor = b.start.map(x => x);
		b.draw(true);
	};
	this.drawTracks = function (color) {
		var b = this;
		var goingCo = b.start.map(x => x);
		for (i = 0; i < b.track.length; i += 2) {
			for (c = 0; c < b.track[i + 1]; c++) {
				var axis = b.track[i] % 2; // 0-hor 1-ver
				var opp = axis * -1 + 1;
				if (c === 0 && i === 0) {
					mctx.drawImage(trackImg, axis * (color * 152 + ((b.track[i] - 1) * -1 + 2) * 38), opp * (304 + color * 152 + b.track[i] * 38), opp * 228 + 76, axis * 228 + 76, goingCo[0] * unit + unit / 8 * 3 * axis, goingCo[1] * unit + unit / 8 * 3 * opp, unit * 3 / 4 * opp + unit / 4, unit * 3 / 4 * axis + unit / 4);
				} else {
					if (c === 0 && i > 0) {
						var coor = [1, 1]; // tilesheet coor
						if (b.track[i] === 2 || b.track[i - 2] === 0) coor[0] = 0;
						if (b.track[i] === 3 || b.track[i - 2] === 1) coor[1] = 0;
						mctx.drawImage(trackImg, 304 + coor[0] * 304, 304 + coor[1] * 304, 304, 304, goingCo[0] * unit, goingCo[1] * unit, unit, unit);
					} else {
						mctx.drawImage(trackImg, axis * 304, 912, 304, 304, goingCo[0] * unit, goingCo[1] * unit, unit, unit);
					}
				}
				goingCo[b.track[i] % 2] += Math.floor(b.track[i] / 2) * 2 - 1;
			}
		}
		var axis = b.track[b.track.length - 2] % 2;
		var opp = axis * -1 + 1;
		mctx.drawImage(trackImg, axis * (color * 152 + (b.track[b.track.length - 2] - 1) * 38), opp * (304 + color * 152 + (b.track[b.track.length - 2] * -1 + 2) * 38), opp * 228 + 76, axis * 228 + 76, goingCo[0] * unit + unit / 8 * 3 * axis, goingCo[1] * unit + unit / 8 * 3 * opp, unit * 3 / 4 * opp + unit / 4, unit * 3 / 4 * axis + unit / 4);
	}
}

function Crate(coor, behind = 0) {
	this.original = coor;
	this.coor = coor.map(x => x);
	this.behind = behind;
	this.ox = 0;
	this.oy = 0;
	this.vy = 0;
	this.moving = false;
	this.spawned = true;
	this.draw = function (co, crushFrame) {
		if (co === 500) {
			if (this.spawned && !this.moving) {
				rctx.drawImage(terrain, 608, 0, 304, 304, this.coor[0] * unit + this.ox, this.coor[1] * unit + this.oy, unit, unit);
			}
			return;
		}
		if (crushFrame === undefined) rctx.drawImage(terrain, 608, 0, 304, 304, this.coor[0] * unit + this.ox, this.coor[1] * unit + this.oy, unit, unit);
		else {
			rctx.drawImage(crushImg, (crushFrame % 2) * 608, Math.floor(crushFrame / 2) * 608, 608, 608, this.coor[0] * unit + this.ox - unit / 2, this.coor[1] * unit + this.oy - unit / 2, unit * 2, unit * 2);
		}
		if (co) {
			if (map.data[this.coor[1]][this.coor[0]] !== 8) this.behind = map.data[this.coor[1]][this.coor[0]];
			map.data[this.coor[1]][this.coor[0]] = 8;
		}
	};
	this.try = function (dir, track, crush = false) {
		// dir: 0-left 1-up 2-right 3-down
		// track: false-avatar, 1-track push, 2-track ride
		var c = this;
		if (c.moving || !this.spawned) return;
		var side = map.data[c.coor[1]][c.coor[0] - 1 + dir];
		if (!track) {
			if (side === 1 || side === 8 || map.data[c.coor[1] - 1][c.coor[0]] === 8 || (side === 3 && map.data[c.coor[1]][c.coor[0] + (dir - 1) * 2] === 1)) return false;
			else if (c.coor[0] - 1 + dir < 0 || c.coor[0] - 1 + dir > 15) crush = true;
		} else if (track === 1) { // track forcing
			if (dir % 2 - 1) { // left / right
				if (side === 8) {
					var crate = map.get(8, [c.coor[0] - 1 + dir, c.coor[1]]);
					crate.try(dir, 1);
				} else if (side === 1 || c.coor[0] - 1 + dir < 0 || c.coor[0] - 1 + dir > 15) crush = true;
				if (map.data[c.coor[1] - 1][c.coor[0]] === 8) {
					var crate = map.get(8, [c.coor[0], c.coor[1] - 1]);
					crate.try(dir, 2);
				}
			} else { // up / down
				if (dir === 1) {
					var u = map.data[c.coor[1] - 1][c.coor[0]];
					if (u === 1 || (u === 3 && (map.data[c.coor[1] - 1][c.coor[0] + 1] === 1 || map.data[c.coor[1] - 1][c.coor[0] - 1])) || c.coor[1] === 0) crush = true;
				} else { // down
					var u = map.data[c.coor[1] - 1][c.coor[0]];
					if (u === 8) {
						var crate = map.get(8, [c.coor[0], c.coor[1] - 1]);
						crate.try(3, track);
					}
				}
				if (map.data[c.coor[1] - 1][c.coor[0]] === 8) {
					var crate = map.get(8, [c.coor[0], c.coor[1] - 1]);
					crate.try(dir, track);
				}
			}
		} else { // track riding sideways
			if (side === 8 || side === 1 || (side === 3 && map.data[c.coor[1]][c.coor[0] + (dir - 1) * 2] === 1)) {
				c.fall(true, -2);
				return false;
			} else if (c.coor[0] - 1 + dir < 0 || c.coor[0] - 1 + dir > 15) {
				crush = true;
			} else if (map.data[c.coor[1] - 1][c.coor[0]] === 8) {
				var crate = map.get(8, [c.coor[0], c.coor[1] - 1]);
				crate.try(dir, track);
			} else {
				var crate = map.get(8, [c.coor[0], c.coor[1] - 1]);
				if (crate !== false) {
					crate.try(dir, track);
				}
			}
		}
		c.move(dir, track, crush);
		return true;
	}
	this.move = function (dir, track, crush, restarting) {
		var c = this;
		c.moving = true;
		// dir: 0-left 1-up 2-right 3-down
		clear(rctx, c.coor, c.ox, c.oy, crush);
		switch (dir) {
			case 0: // left
				c.ox -= unit / 20;
				if (Math.floor(c.ox / unit * -1) >= 1) {
					c.end(0, -1, crush, Math.floor(track / 2));
					return;
				}
				if (crush) c.draw(false, Math.floor(c.ox * -1 / unit * 4));
				break;
			case 1: // up
				c.oy -= unit / 20;
				if (Math.floor(c.oy / unit * -1) >= 1) {
					c.end(1, -1, crush, true, restarting);
					return;
				}
				if (crush) c.draw(false, Math.floor(c.oy * -1 / unit * 4));
				break;
			case 2: // right
				c.ox += unit / 20;
				if (Math.floor(c.ox / unit) >= 1) {
					c.end(0, 1, crush, Math.floor(track / 2));
					return;
				}
				if (crush) c.draw(false, Math.floor(c.ox / unit * 4));
				break;
			case 3: // down
				c.oy += unit / 20;
				if (Math.floor(c.oy / unit) >= 1) {
					c.end(1, 1, crush, true);
					return;
				}
				if (crush) c.draw(false, Math.floor(c.oy * 1 / unit * 4));
				break;
		}
		if (!crush) c.draw();
		window.requestAnimationFrame(() => {c.move(dir, track, crush, restarting);});
	}
	this.fall = function (first, delay) {
		var c = this;
		this.moving = true;
		if (delay < 21) { // delay fall until track has passed (1 frame earlier :))
			delay++;
			if (delay >= 20) delay = 100;
		} else {
			if (first) map.data[this.coor[1]][this.coor[0]] = this.behind;
			clear(rctx, c.coor, c.ox, c.oy);
			if (c.vy < unit / 8) c.vy += unit / 56;
			c.oy += c.vy;
			var b = map.data[c.coor[1] + Math.floor(c.oy / unit) + 1][c.coor[0]];
			if (b === 1 || b === 8 || (b === 3 && (map.data[c.coor[1] + Math.floor(c.oy / unit) + 1][c.coor[0] + 1] === 1 || map.data[c.coor[1] + Math.floor(c.oy / unit) + 1][c.coor[0] - 1] === 1))) {c.end(1, Math.floor(c.oy / unit), false, 1); return;}
			c.draw();
		}
		window.requestAnimationFrame(() => {c.fall(false, delay);});
	};
	this.end = function (axis, cells, crush, notFall, restarting) {
		var c = this;
		clear(rctx, c.coor, c.ox, c.oy);
		c.oy = 0;
		c.ox = 0;
		c.vy = 0;
		if (map.data[c.coor[1]][c.coor[0]] !== 1) map.data[c.coor[1]][c.coor[0]] = c.behind;
		if (!restarting) {
			c.coor[axis] += cells;
		}
		c.moving = false;
		if (!crush) {
			c.draw(true);
			var b = map.data[c.coor[1] + 1][c.coor[0]];
			if (b !== 1 && b !== 3 && b !== 8 && !notFall) c.fall(true);
		} else {
			c.spawned = false;
			c.moving = true;
			if (!restarting) setTimeout(() => {if (!c.spawned) c.spawn();}, map.respawnRate);
			else setTimeout(() => {if (!c.spawned) c.spawn();}, 100);
		}
	};
	this.spawn = function () {
		this.coor = this.original.map(x => x);
		this.behind = map.data[this.coor[1]][this.coor[0]];
		map.data[this.coor[1]][this.coor[0]] = 8;
		this.ox = 0;
		this.oy = 0;
		this.vy = 0;
		this.moving = false;
		this.spawned = true;
		this.draw(true);
		this.fall(true);
	};
}

function Key(coor) {
	this.coor = coor;
	this.collected = false;
	this.step = function (s) {
		if (this.collected) return false;
		clear(ictx, this.coor);
		ictx.drawImage(terrain, 912 + s * 152, 0, 152, 304, this.coor[0] * unit + unit / 4, this.coor[1] * unit, unit / 2, unit);
		return true;
	};
	this.end = function () {
		index = 0;
		for (i = 0; i < map.keys.length; i++) {
			if (map.keys[i].coor[0] == this.coor[0] && map.keys[i].coor[1] == this.coor[1]) index = i;
		}
		var temp = saves[3].substr(0, index) + "1" + saves[3].substr(index + 1);
		saves[3] = temp;
		console.log("key is: " + index);
		if (localStorage.getItem('collKeys')) localStorage.setItem('collKeys', saves[3]);
		console.log(saves[3]);
		console.log(localStorage.getItem('collKeys'));
		this.collected = true;
		map.data[this.coor[1]][this.coor[0]] = 0;
		clear(ictx, this.coor);
	};
}

function Torch(coor, spikes) {
	this.lit = false;
	this.spikes = spikes;
	this.coor = coor;
	this.first = true; // so it only draws once before it's lit.
	this.draw = function (halfway) {
		if (halfway) {
			clear(mctx, this.coor);
			mctx.drawImage(terrain, 760 + 152 * (step % 3), 608, 152, 304, this.coor[0] * unit + unit / 4, this.coor[1] * unit, unit / 2, unit);
			this.spikes.forEach((c) => {
				clear(mctx, c);
				mctx.drawImage(terrain, 912, 1064, 304, 152, c[0] * unit, c[1] * unit + unit / 2, unit, unit / 2);
			});
		} else if (this.lit) {
			clear(mctx, this.coor);
			mctx.drawImage(terrain, 760 + 152 * (step % 3), 608, 152, 304, this.coor[0] * unit + unit / 4, this.coor[1] * unit, unit / 2, unit);
		} else if (this.first) {
			clear(mctx, this.coor);
			mctx.drawImage(terrain, 608, 608, 152, 304, this.coor[0] * unit + unit / 4, this.coor[1] * unit, unit / 2, unit);
			this.spikes.forEach((c) => {
				clear(mctx, c);
				mctx.drawImage(terrain, 912, 912, 304, 152, c[0] * unit, c[1] * unit + unit / 2, unit, unit / 2);
				if (!(map.data[c[1]][c[0]] === 12)) {
					if (map.data[c[1]][c[0]] === 8) {
						var crate = map.get(8, c);
						crate.behind = 12;
					} else map.data[c[1]][c[0]] = 12;
				}
			});
			this.first = false;
		}
	};
	this.light = function () {
		var t = this;
		if (t.lit) return false;
		setTimeout(() => {
			t.lit = true;
			saves[1] = true;
			if (localStorage.getItem("torchLit")) localStorage.setItem("torchLit", true);
			t.spikes.forEach((c) => {
				clear(mctx, c);
				if (map.data[c[1]][c[0]] === 12) map.data[c[1]][c[0]] = 0;
				else if (map.data[c[1]][c[0]] === 8) {
					var crate = map.get(8, c);
					crate.behind = 0;
				}
			});
		}, 250);
		this.draw(true);
	};
}

function pixelAnimate() {
	if (!paused) {
		step++;
		avatar.step(Math.floor((step % 4) / 2));
		map.step(Math.floor((step % 4) / 2));
	}
	setTimeout(pixelAnimate, 250);
}

function animate() {
	if (!paused) {
		avatar.act();
		cursor.update();
		map.plates.forEach((p) => {p.update();});
		map.enemies.forEach((e) => {e.try();});
	}
	raf = window.requestAnimationFrame(animate);
}

function startGame() {
	paused = true;
	document.getElementById("Title_Screen").style.display = "none";
	menu.stage.style.display = "none";
	menu.pause.style.display = "none";
	var tempKeyCount = 0;
	for (n in saves[3]) {
		console.log(saves[3][n]);
		tempKeyCount += parseInt(saves[3][n]);
	}
	avatar.keyCount = tempKeyCount;
	avatar.inventDOM.innerHTML = '<img src="key.png" style="margin-top: calc(var(--pixel) * -1); width: calc(var(--pixel) * 10); height: calc(var(--pixel) * 10);">x&thinsp;' + avatar.keyCount;
	menu.keys.style.display = "none";
	map.torches[0].lit = saves[1]; // for saved levels
	menu.stats.innerHTML = "Attempts: " + saves[2];
	map.draw();
	animate();
	pixelAnimate();
	[A, M, T, R, I, E].forEach((e) => {e.style.transitionDuration = "5s";});
	setTimeout(() => {
		paused = false;
		menu.showD(saves[0], false);
		console.log(saves[0]);
		map.top = 68;
		document.body.style.setProperty("--top", 68);
		if (saves[0] > 0) {
			map.completeStage(map.resets[saves[0]][1]);
			map.startStage(saves[0], false);
		}
		document.getElementById("LastSaved").innerHTML = "Last saved at Stage " + (saves[0] + 1);
		// two below lines are for skipping ahead to the level I'm working on.
		//map.completeStage([3, 10]);
		//map.startStage(8);
		[A, M, T, R, I, E, C].forEach((e) => {e.style.transitionDuration = "1s";});
		game_on = true;
	}, 5000);
}

function showControls(show) {
	if (show) {
		document.getElementById("Controls").style.display = "block";
		controlsOpen = true;
	} else {
		document.getElementById("Controls").style.display = "none";
		controlsOpen = false;
	}
}

document.addEventListener('contextmenu', function(e) {e.preventDefault();}, false);
