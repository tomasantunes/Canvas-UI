(function(window, document, undefined) {

var UI = (function() {
	var canvas;
	var canvas_id;
	var ctx;
	var tree;
	var mousePos = {x: 0, y: 0};
	var currentTheme = "default";
	var themes = {
		"default": {
			borderColor: hexToRgb("#000000"),
			borderSize: 0,
			borderRadius: 0,
			backgroundColor: "transparent",
			headerColor: hexToRgb("#aaaaaa"),
			padding: 0,
			margin: 0,
			fontSize: "12px",
			fontFamily: "Arial",
			fontColor: hexToRgb("#000000"),
			textBaseline: "top",
			lineHeight: 20
		}
	};
	
	var isFullscreen = false;
	var originalDimensions;

	function hexToRgb(str) {
		if(str.charAt(0) === "#") {
			str = str.substr(1);
		}

		var r = parseInt(str.substr(0, 2), 16);
		var g = parseInt(str.substr(2, 2), 16);
		var b = parseInt(str.substr(4, 2), 16);

		return "rgb(" + r + "," + g + "," + b + ")";
	}

	/*
	* Draw the UI to the canvas
	*/
	function draw(p) {
		if(!p) {
			p = tree;
		}

		var children = p._children;
		var len = children.length;
		var child;
		
		for(var i = 0; i < len; ++i) {
			child = children[i];

			calculate(p, child);
			child.draw(ctx);
			draw(children[i]);
		}
	}
	
	/**
	* Evaluate an expression
	* Must seperate with spaces and use units
	*/
	function expr(str, p, w, h) {
		//if number, use that
		if(typeof str === "number") return str;
		var tokens = str.split(' ');
		var a, b;
		
		//evaluate the first number
		a = parseInt(tokens[0], 10);
		if(tokens[0].indexOf("%") !== -1) {
			a = p * (a / 100);
		} else if(tokens[0] === "w" || tokens[0] === "width") {
			a = w;
		} else if(tokens[0] === "h" || tokens[0] === "height") {
			a = h;
		}
		
		//if no expression
		if(tokens.length === 1) return a;
		
		//evaluate the second number
		b = parseInt(tokens[2], 10)
		if(tokens[2].indexOf("%") !== -1) {
			b = p * (b / 100);
		} else if(tokens[2] === "w" || tokens[2] === "width") {
			b = w;
		} else if(tokens[2] === "h" || tokens[2] === "height") {
			b = h;
		}
		
		switch(tokens[1]) {
			case "+": return a + b
			case "-": return a - b;
			case "*": return a * b;
			case "/": return a / b;
		}
	}

	function calculate(p, c) {
		var width, height;
		var outerWidth, outerHeight;
		var minWidth, maxWidth, minHeight, maxHeight;
		var x, y;

		//calculate widths/heights
		outerWidth = expr(c.width, p._actual.width);
		width = outerWidth - (p.paddingLeft + p.paddingRight + c.borderSizeLeft + c.borderSizeRight + c.marginLeft + c.marginRight);
		outerHeight = expr(c.height, p._actual.height);
		height = outerHeight - (p.paddingTop + p.paddingBottom + c.borderSizeTop + c.borderSizeBottom + c.marginTop + c.marginBottom);
		
		//calculate the min/max width/heights
		if(c.minWidth !== undefined) minWidth = expr(c.minWidth, p._actual.width);
		if(c.minHeight !== undefined) minHeight = expr(c.minHeight, p._actual.height);
		if(c.maxWidth !== undefined) maxWidth = expr(c.maxWidth, p._actual.width);
		if(c.maxHeight !== undefined) maxHeight = expr(c.maxHeight, p._actual.height);
		
		//calculate the position
		x = expr(c.x, p._actual.width, outerWidth, outerHeight) + p.paddingLeft + c.marginLeft + p._actual.x + c.borderSizeLeft;
		y = expr(c.y, p._actual.height, outerWidth, outerHeight) + p.paddingTop + c.marginTop + p._actual.y + c.borderSizeTop;
		
		//make sure size within min and max
		if(width < (minWidth || 0)) width = minWidth || 0;
		if(height < (minHeight || 0)) height = minHeight || 0;
		if(maxWidth && width > maxWidth) width = maxWidth;
		if(maxHeight && height > maxHeight) height = maxHeight;

		c._actual = {
			x: ~~x,
			y: ~~y,
			width: ~~width,
			height: ~~height
		};

		if(c.calculate) c.calculate();
	}

	function loopTree(tree, func) {
		for (var i in tree._children) {
			var node = tree._children[i];
			func(node);
			loopTree(node, func);
		}
	}

	function triggerClick(node) {
		if (typeof node.click !== "undefined") { 
			node.click(UI);
		}
	}

	function triggerMouseMove(node) {
		if (typeof node.mousemove !== "undefined") { 
			node.mousemove(UI);
		}
	}
	
	/**
	* Determine the actualy property values
	* from CSS style syntax
	* e.g. margin: 0 0 0 5; padding: 5; border-width: 5 10
	*/
	function parseProperty(node, prop) {
		var p = node[prop];
		if(p === undefined) return;
		
		var top, right, bottom, left;
		var tokens;
		
		//set all sides to same value
		if(typeof p === "number") {
			top = right = bottom = left = p;
		} else if(typeof p === "string") {
			//evaluate values seperated by spaces
			tokens = p.split(/\s+/);
			if(tokens.length === 1) {
				top = right = bottom = left = parseInt(tokens[0], 10);
			} else if(tokens.length === 2) {
				top = bottom = parseInt(tokens[0], 10);
				left = right = parseInt(tokens[1], 10);
			} else if(tokens.length === 4) {
				top = parseInt(tokens[0], 10);
				right = parseInt(tokens[1], 10);
				bottom = parseInt(tokens[2], 10);
				left = parseInt(tokens[3], 10);
			} else throw "Too many values in " + prop;
		
		} else throw "Incorrect value for " + prop + ": " + p.toString();
		
		node[prop + "Top"] = top;
		node[prop + "Right"] = right;
		node[prop + "Bottom"] = bottom;
		node[prop + "Left"] = left;
	}

	/**
	* A UI node in the display tree
	*/
	function node(opts) {
		if(!opts) return;
		
		//copy all properties
		for(var key in opts) {
			this[key] = opts[key];
		}
		
		if(!this.width) this.width = "100%";
		if(!this.height) this.height = "100%";
		if(!this.x) this.x = 0;
		if(!this.y) this.y = 0;

		//save the actual props for the root
		if(!tree) {
			//actual coords
			this._actual = {
				x: 0,
				y: 0,
				width: this.width,
				height: this.height
			};
		}

		//copy the theme properties
		
		var theme = themes[opts.theme || currentTheme];
		for(var key in theme) {
			if(this[key] === undefined)
				this[key] = theme[key];
		}
		
		parseProperty(this, "padding");
		parseProperty(this, "margin");
		parseProperty(this, "borderSize");
		parseProperty(this, "borderRadius");

		//array of child nodes
		this._children = [];

		//if no parent, take the root
		if(!this.parent) {
			if(tree) tree.addChild(this);
		} else {
			this.parent.addChild(this);
		}
	}

	/*
	* Add functions to the node
	*/
	node.prototype = {
		addChild: function(n) {
			this._children.push(n);
			n.parent = this;
		},

		removeChild: function(n) {
			var child = this._children;
			var len = child.length;
			for(var i = 0; i < len; ++i) {
				if(child[i] === n) {
					child.splice(i, 1);
					n.parent = null;
					return;
				}
			}
		},
		
		roundRect: function(ctx, x, y, width, height, radiusTop, radiusRight, radiusBottom, radiusLeft, fill) {
			ctx.beginPath();
			
			ctx.moveTo(x + radiusTop, y);
			ctx.lineTo(x + width - radiusRight, y);
			ctx.quadraticCurveTo(x + width, y, x + width , y + radiusRight);
			
			ctx.lineTo(x + width , y + height - radiusBottom);
			ctx.quadraticCurveTo(x + width, y + height, x + width - radiusBottom, y + height);
			
			ctx.lineTo(x + radiusLeft, y + height);
			ctx.quadraticCurveTo(x, y + height, x, y + height - radiusLeft);
			
			ctx.lineTo(x, y + radiusTop);
			ctx.quadraticCurveTo(x, y, x + radiusTop, y);
			ctx.closePath();
			
			ctx.fillStyle = fill;
			ctx.fill();
		},

        draw: function(ctx) {
            ctx.save();
            
            //only draw a border when needed
            if(this.borderSizeLeft || this.borderSizeTop || this.borderSizeRight || this.borderSizeBottom) {
                this.roundRect(
                    ctx,
                    this._actual.x - this.borderSizeLeft,
                    this._actual.y - this.borderSizeTop,
                    this._actual.width + this.borderSizeRight + this.borderSizeLeft,
                    this._actual.height + this.borderSizeBottom + this.borderSizeTop,
                    //short circuit logic to only add the size if the radius is > 0
                    this.borderRadiusTop && this.borderRadiusTop + this.borderSizeTop,
                    this.borderRadiusRight && this.borderRadiusRight + this.borderSizeRight,
                    this.borderRadiusBottom && this.borderRadiusBottom + this.borderSizeBottom,
                    this.borderRadiusLeft && this.borderRadiusLeft + this.borderSizeLeft,
                    this.borderColor
                );
            }
            
            if(this.backgroundColor !== "transparent") {
                //main rect
                this.roundRect(
                    ctx,
                    this._actual.x,
                    this._actual.y,
                    this._actual.width,
                    this._actual.height,
                    this.borderRadiusTop,
                    this.borderRadiusRight,
                    this.borderRadiusBottom,
                    this.borderRadiusLeft,
                    this.backgroundColor
                );
            }
            
            if(this.text) {
                var lines = this.text.split("\n");
                var len = lines.length;
                var line;
                
                ctx.font = this.fontSize + " " + this.fontFamily;
                ctx.fillStyle = this.fontColor;
                ctx.textBaseline = this.textBaseline;
                
                for(var i = 0; i < len; ++i) {
                    
                    ctx.fillText(
                        lines[i],
                        this._actual.x + this.paddingLeft + this.borderSizeLeft,
                        (this._actual.y + this.paddingTop + this.borderSizeTop) + i * this.lineHeight
                    );
                }
            }

            ctx.restore();
		},
	};

	return {
		/**
		* Initialize UI.js
		* Pass in a string for the ID, a canvas object
		* or default to id of "canvas"
		*/
		init: function(cv) {
			if(cv) {
				if(typeof cv === "string") {
					canvas = document.getElementById(cv);
					canvas_id = cv;
				} else {
					canvas = cv;
				}
			} else {
				canvas = document.getElementById("canvas");
				canvas_id = "canvas";
			}

			ctx = canvas.getContext("2d");
			tree = new node({
				width: canvas.width,
				height: canvas.height,
				parent: null
			});
			
			//save the original dimensions
			originalDimensions = {
				width: canvas.width,
				height: canvas.height
			};

			canvas.onclick = function(e) {
				var rect = canvas.getBoundingClientRect();
				mousePos = {
					x: e.clientX - rect.left,
					y: e.clientY - rect.top
				};
				loopTree(tree, triggerClick)
			};

			canvas.onmousemove = function(e) {
				var rect = canvas.getBoundingClientRect();
				mousePos = {
					x: e.clientX - rect.left,
					y: e.clientY - rect.top
				};
				loopTree(tree, triggerMouseMove)
			};
		},

		getMousePos: function() {
			return mousePos;
		},

		getCanvasID: function() {
			return canvas_id;
		},

		/**
		* Define a widget for the UI library
		*/
		e: function(name, def) {
			var c = function(opts) {
				opts.type = name;
				node.call(this, opts);
                if(this.init) this.init(opts);
			};

			c.prototype = new node;
			c.prototype.constructor = c;
            c.prototype.supr = node.prototype;

			this[name] = function(opts) {
				return new c(opts);
			}
			
			for(var key in def) {
				c.prototype[key] = def[key];
			}
		},

		debug: function() {
			console.log(tree, canvas, ctx, themes, currentTheme);
		},
		
		createTheme: function(name, parent, def) {
			if(arguments.length === 2) {
				def = parent;
				parent = "default";
			}
			
			//get the theme object
			parent = themes[parent];
			var theme = {};
			
			//copy properties from parent
			for(var key in parent) {
				theme[key] = parent[key];
			}
			
			//copy properties from definition
			for(var key in def) {
				theme[key] = def[key];
			}
			
			themes[name] = theme;
		},
		
		setTheme: function(theme) {
			currentTheme = theme;
		},
		
		reflow: function() {
			if(isFullscreen) {
				tree.width = canvas.width = window.innerWidth;
				tree.height = canvas.height = window.innerHeight;
				
				tree._actual.width = tree.width;
				tree._actual.height = tree.height;
			}
			
			UI.repaint();
		},
		
		fullscreen: function(q) {
			if(q === undefined) {
				q = !isFullscreen;
			}
			
			if(q) {
				tree.width = canvas.width = window.innerWidth;
				tree.height = canvas.height = window.innerHeight;
				isFullscreen = true;
				window.onresize = this.reflow;
			} else {
				tree.width = canvas.width = originalDimensions.width;
				tree.height = canvas.height = originalDimensions.height;
				isFullscreen = false;
				window.onresize = null;
			}
			
			//update the actual dims
			tree._actual.width = tree.width;
			tree._actual.height = tree.height;
			
			this.repaint();
		},

		repaint: draw
	};

})();
//end UI def
	
/**
* UI Panel Definition
*/
UI.e("panel", {
	draw: function(ctx) {
        //call parent
		this.supr.draw.call(this, ctx);
	}
});

UI.e("image", {
    _src: null,

    init: function(opts) {
        this._src = new Image();
        this._src.src = opts.src;

        this._src.onload = function() {
            UI.repaint();
        }
    },

    calculate: function() {
        if(!this._src.complete) return;
        this.width = this._src.width;
        this.height = this._src.height;
    },

    draw: function(ctx) {
       this.supr.draw.call(this, ctx);
       if(this._src.complete === false) return;

       ctx.drawImage(
            this._src,
            this._actual.x,
            this._actual.y
       );
    }
});

UI.e("button", {
    _src: null,

    init: function(opts) {
        this._src = new Image();
		this._src.src = opts.src;
		this.callback = opts.callback;

        this._src.onload = function() {
            UI.repaint();
		}
    },

    calculate: function() {
        if(!this._src.complete) return;
        this.width = this._src.width;
		this.height = this._src.height;
		
    },

    draw: function(ctx) {
       this.supr.draw.call(this, ctx);
       if(this._src.complete === false) return;

       ctx.drawImage(
            this._src,
            this._actual.x,
            this._actual.y
       );
	},
	
	click: function() {
		var mousePos = UI.getMousePos();

		var x = this._actual.x - this.borderSizeLeft;
		var y = this._actual.y - this.borderSizeTop;
		
		if (mousePos.x < x + this.width &&
			mousePos.x > x &&
			mousePos.y < y + this.height &&
			mousePos.y > y) {
				this.callback();
		}
	}
});

UI.e("input", {
    _src: null,

    init: function(opts) {
        this._src = new CanvasInput();

        this._src.onload = function() {
            UI.repaint();
		}
    },

    calculate: function() {
		if(!this._src.complete) return;
        this.width = this._src.width;
		this.height = this._src.height;
    },

    draw: function(ctx) {
		this.supr.draw.call(this, ctx);
		if(this._src.complete === false) return;

		this._src = new CanvasInput({
			canvas: document.getElementById(UI.getCanvasID()),
			fontSize: 18,
			fontFamily: 'Arial',
			fontColor: '#212121',
			fontWeight: 'bold',
			padding: 8,
			borderWidth: 1,
			borderColor: '#000',
			borderRadius: 3,
			boxShadow: '1px 1px 0px #fff',
			innerShadow: '0px 0px 5px rgba(0, 0, 0, 0.5)',
			x: this._actual.x,
			y: this._actual.y,
		});

		this._src.render();
	}
});
UI.e("dropdown", {
	_src: null,
	selected: "Selected item",
	labels: ["1","2","3"],
	mainDrop: null,
	itemDrop: null,
	visible: false,
	ctx: null,
	mousePos: {x: 0, y: 0},

	init: function(opts) {
		
	},

	calculate: function() {

	},

	drawDropdown: function(ctx, selected, items, x, y, w, h) {
		ctx.strokeStyle = "black";
		ctx.strokeRect(x, y, w, h);
		ctx.fillText(selected, x + (w / 10), y + (h / 4));
	},

	drawItems(ctx, labels, x, y, w, h)
	{
		for(var i = 0; i < labels.length; i++) {
			if (i == 0) {
				ctx.strokeRect(x, y + h, w, h);
				ctx.fillText(labels[i], x + (w / 10), y + h + (h / 2));
			}
			else {
				ctx.strokeRect(x, y + ( h * (i + 1)), w, h);
				ctx.fillText(labels[i], x + (w / 10), y + (h * (i + 1)) + (h / 2));
			}
		}
	},

	isInside: function(pos, rect) {
		return pos.x < rect.x + rect.width &&
			pos.x > rect.x &&
			pos.y < rect.y + rect.height &&
			pos.y > rect.y;
	},

	insideItem: function(mousePos){
		var mouseY = mousePos.y;
		var startPos;
		var nextPos;
		for(var i = 0; i < this.labels.length; i++) {
			startPos = this.mainDrop.y + (this.mainDrop.height * (i + 1));
			nextPos = startPos + this.mainDrop.height;
			console.log(mouseY);
			console.log(startPos);
			console.log(nextPos);
			if (mouseY < nextPos && mouseY > startPos) {
				return this.labels[i];
			}        
		}
		return this.selected;
	},

	newLabel: function(newLabel, removedLabel){
		UI.repaint();
		this.selected = newLabel;
		this.labels[this.labels.indexOf(this.selected)] = removedLabel;
		UI.repaint();
		this.drawDropdown(this.ctx, this.selected, this.labels, this.mainDrop.x, this.mainDrop.y, this.mainDrop.width, this.mainDrop.height);
		this.visible = false;
	},

	click: function() {
		var mousePos = UI.getMousePos();

		var x = this._actual.x - this.borderSizeLeft;
		var y = this._actual.y - this.borderSizeTop;

		var labelsHeight = this.mainDrop.y + this.mainDrop.height + (this.mainDrop.height * (this.labels.length + 1));

		if (this.isInside(mousePos, {x: this.itemDrop.x, y: this.mainDrop.y, width: this.mainDrop.width, height: labelsHeight})) {
			var item = this.insideItem(mousePos);
			var oldItem = this.selected;
			if(item != this.selected) {
				this.newLabel(item, oldItem);
				UI.repaint();
			}
		}
	},

	mousemove: function() {
		var mousePos = UI.getMousePos();
		var labelsHeight = this.mainDrop.y + this.mainDrop.height + (this.mainDrop.height * (this.labels.length + 1));
		if (this.isInside(mousePos, {x: this.mainDrop.x, y: this.mainDrop.y, width: this.mainDrop.width, height: labelsHeight})) {
			UI.repaint();
			this.drawDropdown(this.ctx, this.selected, this.labels, this.mainDrop.x, this.mainDrop.y, this.mainDrop.width, this.mainDrop.height);
			this.drawItems(this.ctx, this.labels, this.mainDrop.x, this.mainDrop.y, this.mainDrop.width, this.mainDrop.height);
			this.visible = true;
			
		}
		else if (!this.isInside(mousePos, {x: this.mainDrop.x, y: this.mainDrop.y, width: this.mainDrop.width, height: labelsHeight})) {
			UI.repaint();
			//ctx.clearRect(0,0, canvas.width, canvas.height);
			this.drawDropdown(this.ctx, this.selected, this.labels, this.mainDrop.x, this.mainDrop.y, this.mainDrop.width, this.mainDrop.height);
			visible = false;
		}
	},

	draw: function(ctx) {
		this.supr.draw.call(this, ctx);
		this.ctx = ctx;

		this.mainDrop = {
			x: this._actual.x,
			y: this._actual.y,
			width: this.width,
			height: this.height
		};
		this.itemDrop = {
			x: this.mainDrop.x,
			width: this.mainDrop.width,
			height: this.mainDrop.height
		};

		var canvas = document.getElementById(UI.getCanvasID())
	},

	getValue: function() {

	}
});
	
window.UI = UI;
})(window, window.document);
