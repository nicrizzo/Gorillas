dojo.provide("Gorillas.init");

	dojo.declare("demo.Gorillas", null, {
		constructor: function(){
			this.startup();
		},
		gTemplate: "<pre class='gorilla'> ^___^\n &gt;<span class='arm'>--</span>I<span class='arm'>--</span>&lt;\n<span class='legs'> / \\</span class='legs'></pre>",
		gTemplateBoom: "<pre class='gorilla'> <span class='xeye'>X</span>___<span class='xeye'>X</span>\n &gt;<span class='arm'>--</span>I<span class='arm'>--</span>&lt;\n<span class='legs'> / \\</span class='legs'></pre>",
		// pixels / meter
		pxmt: 7,
		currentFrame: 0,
		weaponFrames: ["|", "/", "-", "\\", "|", "/", "-", "\\"],
		gWidth: 0,
		status: "",
		gHeight: 0,
		gPos: null,
		currentPlayer: 0,
		turns: 0,
		wSum: 0,
		games: 0,
		score: [0,0],
		weapon: null,
		gorillas: [],
		playAgain: null,
		buildingsCoords: [],
		rotateWeapon: function(signum){
			this.weapon.innerHTML = this.weaponFrames[(this.currentFrame+=signum+8) % 8];
		},
		makeGorillas: function(){
			var buildingsCoords = this.buildingsCoords;
			this.gorillas = [];
			for(var i = 0, pos = [buildingsCoords[1], buildingsCoords[buildingsCoords.length-3]]; i < pos.length; i++){
				var gNode = dojo.create("div",{
					innerHTML: this.gTemplate,
					id: "g" + i,
					style:{
						position: "absolute",
						visibility: "hidden"
					}
				}, "city");
				this.gPos = dojo.coords(gNode);
				this.gHeight = this.gPos.h;
				this.gWidth = this.gPos.w;
				this.gorillas[i] = {
					bottom: parseInt(pos[i].y),
					left: parseInt(pos[i].x + (pos[i].w - this.gWidth) / 2),
					height: this.gHeight,
					width: this.gWidth
				};
				dojo.style(gNode, {
					visibility: "visible",
					bottom: pos[i].y + "px",
					left: pos[i].x + (pos[i].w - this.gWidth) / 2 + "px"
				});
			}
		},
		makeWeapon: function(){
			this.weapon = dojo.create("div", {
				innerHTML: "\\",
				className: "weapon",
				display: "none",
				style: {
					position: "absolute",
					bottom: "0",
					left: "0"
				}
			}, "city");
		},
		boom: function(){
			dojo.attr(this.weapon,{
				innerHTML: "\\|/<br />---<br />/|\\",
				style: {
					color: "red"
				}
			});
		},
		shoot: function(/* Object */ args){
			dojo.query("div.controls").style("display", "none");
			var currentGorilla = this.gorillas[args.which],
				weapon = this.weapon,
				g = 9.81*this.pxmt,
				detectGorillaCollision = this.detectGorillaCollision, detectCollision = this.detectCollision,
				self = this,
				timer = 0,
				cTime = 0,
				angle = args.angle * Math.PI / 180,
				signum = args.which === 0 ? 1 : -1,
				speed = args.speed*this.pxmt,
				xSpeed = speed*Math.cos(angle),
				ySpeed = speed*Math.sin(angle),
				building = this.buildingsCoords[args.which === 0 ? 1 : this.buildingsCoords.length-3],
				// max duration
				duration = Math.round(1000*(ySpeed / g + Math.sqrt((Math.pow(ySpeed, 2) / g + 2*building.y) / g))),
				wRotation = 0
			;
			dojo.style(this.weapon, "left", currentGorilla.left + "px");
			var anim = new dojo.Animation({
				duration: duration,
				curve: [],
				rate:30,
				easing: function(n){ return n }, // linear
				beforeBegin: function(){
					dojo.attr(weapon,{
						style: {
							bottom: currentGorilla.bottom + "px",
							left: Math.round(currentGorilla.left + self.gWidth / 2) + "px",
							color: "yellow",
							display: ""
						},
						innerHTML: "\\"
					});
					timer = (new Date).getTime();
					wRotation = setInterval(dojo.hitch(self, self.rotateWeapon, signum), 80);
				},
				onEnd: function(){
					clearInterval(wRotation);
					self.status === "" && (self.status = "collision");
					self.turns = (self.turns+1)%2;
					self.showMsg();
				},
				onStop: function(){
					clearInterval(wRotation);
					self.turns = (self.turns+1)%2;
					self.showMsg();
				},
				onAnimate: function(){
					cTime = ((new Date).getTime() - timer) / 1000;
					var wLeft = currentGorilla.left + self.gWidth / 2 + signum*xSpeed*cTime,
						wBottom = currentGorilla.bottom + currentGorilla.height + ySpeed*cTime + Math.round(-g * Math.pow(cTime, 2) / 2)
					;
					dojo.style(weapon, {
						bottom: wBottom + "px",
						left:  wLeft + "px"
					});
					if(detectGorillaCollision.call(self, ({x: wLeft, y: wBottom }))){
						self.status = "gcollision";
						this.stop();
					}else if(detectCollision.call(self, ({x: wLeft, y: wBottom }))){
						self.status = "collision";
						self.boom();
						this.stop();
					}
				}
			});
			anim.play();
		},
		hideMsg: function(){
			dojo.query("#city .playAgain").style("display", "none");
		},
		showMsg: function(){
			dojo.query("#city .playAgain").style("display", "block");
		},
		detectCollision: function(/* Object */ args){
			var left = args.x,
				bottom = args.y
			;
			return dojo.some(this.buildingsCoords, function(item){
				return (left > item.x && left < item.x + item.w && bottom < item.y);
			});
		},
		detectGorillaCollision: function(/* Object */ args){
			var left = args.x,
				bottom = args.y,
				collision = false, current = 0
			;
			dojo.forEach(this.gorillas, function(item, i){
			 if(left > item.left && left < item.left + item.width && bottom < item.bottom + item.height){
				 collision = true;
				 current = (i^1);
				 dojo.byId("g" + i).innerHTML = this.gTemplateBoom;
				 this.score[current]++;

				 dojo.query("#city .p" + (current + 1) + "Score span").attr("innerHTML", this.score[current]);
			 }
			}, this);
			return collision;
		},
		makeBuildings: function(){
			this.buildingsCoords = [];
			this.wSum = 0;
			while(this.wSum < 800){
				var h = Math.random() * 200 + 80,
					w = Math.random() * 40 + 60
				;
				dojo.create("div",{
					className: "building",
					style:{
						position:"absolute",
						bottom:      "0",
						left:        this.wSum + "px",
						height:      h + "px",
						width:       w + "px",
						borderTop:   "1px solid #666",
						borderRight: "1px solid #333",
						borderLeft:  "1px solid #999",
						borderBottom: "none",
						background:   "#ccc"
					}
				}, "city");
				this.buildingsCoords.push({
					x: this.wSum,
					y: parseInt(h),
					w: parseInt(w)
				});

				this.wSum += w;
			}
			this.games++;
		},
		makeMessageBar: function(){
			var mb = dojo.create("div", {
				id: "messageBar",
				className: "messageBar"
			}, "city");
			for(var i = 2; i--;){
				dojo.create("div", {
					className: "p" + (i + 1) + "Score",
					innerHTML: "player " + (i + 1) + ": <span>0</span>"
				}, mb);
			}
		},
		turn: function(){
			this.hideMsg();
			this.status = "";
			this.currentPlayer = this.turns & 1;
			dojo.style(this.weapon, "display", "none");
			dojo.style("g" + this.currentPlayer + "controls", "display", "block");
			dijit.byId("g" + this.currentPlayer + "speed").focus();
		},
		reset: function(){
			dojo.query(".building, #g0, #g1").forEach(function(node){ dojo.destroy(node)});
			this.makeBuildings();
			this.makeGorillas();
			dojo.place(this.weapon, "city");
			dojo.place(this.playAgain, "city");
			dojo.place("messageBar", "city");
		},
		startup: function(){
			this.makeBuildings();
			dojo.style("splash", "display", "none");
			dojo.style("main", "display", "block");
			dojo.query(".controls").style("opacity", ".7");
			this.makeGorillas();
			this.makeMessageBar();
			this.makeWeapon();
			this.makeReplayMessage();
			this.bindEvents();
			this.turn();
		},
		makeReplayMessage: function(){
			this.playAgain = dojo.create("div",
				{
					innerHTML: "<div class='playAgain'>PRESS ANY KEY</div>"
				}, "city"
			);
		},
		onKeyUp: function(){
			if(this.status === "collision"){
				this.turn();
			}else if(this.status === "gcollision"){
				this.reset();
				this.turn();
			}
		},
		bindEvents: function(){
			var self = this;
			dojo.connect(dijit.byId("g0shoot"), "onClick", function(evt){
				evt.target.blur();
				self.shoot({
					which:0,
					speed: dijit.byId("g0speed").attr("value"),
					angle: dijit.byId("g0angle").attr("value")
				});
			});
			dojo.connect(dijit.byId("g1shoot"), "onClick", function(evt){
				evt.target.blur();
				self.shoot({
					which:1,
					speed: dijit.byId("g1speed").attr("value"),
					angle: dijit.byId("g1angle").attr("value")
				});
			});
			dojo.connect(dojo.doc, "onkeyup", this, "onKeyUp");
		}
	});
	dojo.ready(function(){
		new demo.Gorillas
	});
