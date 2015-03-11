var Sprite = function(name, painter, behavior){
	if (name !== undefined) this.name = name;
	if (painter !== undefined)this.painter = painter;
	this.top = 0;
	this.width = 0;
	this.height = 10;
	this.velocityX = 0;
	this.velocityY = 0;
	this.visible = true;
	this.animating = false;
	this.behaviors = behavior || [];
	return this;
}

Sprite.prototype = {
	paint: function(context){
		if (this.painter !== undefined && this.visible) {
			this.painter.paint(this, context);
		};
	},
	update: function(context, time){
		for(var i=0; i< this.behaviors.length; ++i){
			this.behaviors[i].execute(this, context, time);
		}
	}
}

var ImagePainter = function (imageUrl) {
   	this.image = new Image();
   	this.image.src = imageUrl;
};
ImagePainter.prototype = {
   	paint: function (sprite, context) {

      	if (this.image.complete) {
        	context.drawImage(this.image, sprite.left, sprite.top, sprite.width, sprite.height)} 
	}
};

var SpriteSheetPainter = function(cells, spritesheet){
	this.cells = cells || [];
	this.cellIndex = 0;
	this.spritesheet = spritesheet
};

SpriteSheetPainter.prototype = {
	advance: function(){
		if (this.cellIndex == this.cells.length-1) {
			this.cellIndex = 0;
		}else{
			this.cellIndex++;
		}
	},
	paint: function(sprite, context){
		var cell = this.cells[this.cellIndex];
		//console.log(cell)
		console.log(sprite)
		context.drawImage(this.spritesheet, cell.left, cell.top, cell.width, cell.height,
						sprite.left, sprite.top, cell.width, cell.height);
		sprite.width = cell.width
	}
}

var SpriteAnimator = function(painters, elapsedCallback){
	this.painters = painters || [];
	this.elapsedCallback = elapsedCallback;
	this.duration = 1000;
	this.startTime = 0;
	this.index = 0;
};
SpriteAnimator.prototype = {
	end: function(sprite, oringinalPainter){
		sprite.animating = false;
		if (this.elapsedCallback) this.elapsedCallback(sprite);
		else 					  sprite.painter = oringinalPainter
	},
	start: function(context, sprite, duration){
		console.log(this)
		var endTime = +new Date() + duration,
			period = duration / (this.painters.length),
			animator = this,
			oringinalPainter = sprite.painter,
			lastUpdate = 0;

		this.index = 0;
		sprite.animating = true;
		sprite.painter = this.painters[this.index];

		requestNextAnimationFrame(function spriteAnimatorAnimate(time){
			if (time < endTime) {
				if ((time - lastUpdate) > period) {
					sprite.painter = animator.painters[++animator.index];
					sprite.paint(context)
					lastUpdate = time
				}
				requestNextAnimationFrame(spriteAnimatorAnimate)
			}else{
				animator.end(sprite, oringinalPainter);
			}
		})
	}
};

var Stopwatch = function(){}

Stopwatch.prototype = {
	startTime: 0,
	running: false,
	elapsed: undefined,
	start: function(){
		this.startTime = +new Date();
		this.elapsedTime = undefined;
		this.running = true;
	},
	stop: function(){
		this.elapsedTime = (+new Date() - this.startTime);
		this.running = false;
	},
	getElapsedTime: function(){
		if (this.running) {
			return (+new Date()) - this.startTime;
		}else{
			return this.elapsed;
		}
	},
	isRunning: function(){
		return this.running;
	},
	reset: function(){
		this.elapsed = 0;
	}
}
var AnimationTimer = function(duration, timeWarp){
	this.DEFAULT_ELASTIC_PASSES = 3;
	if (timeWarp !== undefined) this.timeWarp = timeWarp;
	if (duration !== undefined) this.duration = duration;
	this.stopwatch = new Stopwatch();
};

AnimationTimer.prototype = {
	start: function(){
		this.stopwatch.start()
	},
	stop: function(){
		this.stopwatch.stop();
	},
	getElapsedTime: function(){
		var elapsedTime = this.stopwatch.getElapsedTime(),
			percentComplete = elapsedTime / this.duration;

		if (!this.stopwatch.running) return undefined;
		if (this.timeWarp == undefined) return elapsedTime;
		return elapsedTime * (this.timeWarp(percentComplete) / percentComplete);
	},
	getRealElapesdTime: function(){
		var elapsedTime = this.stopwatch.getElapsedTime();
		return elapsedTime;
	},
	isRunning: function(){
		return this.stopwatch.running;
	},
	isOver: function(){
		return this.stopwatch.getElapsedTime() > this.duration;
	},
	reset: function(){
		this.stopwatch.reset();
	}
};

AnimationTimer.makeEaseIn = function(strength){
	return function (percentComplete){
		return Math.pow(percentComplete, strength*2);
	}
}

AnimationTimer.makeEaseOut = function(strength){
	return function (percentComplete){
		return 1 - Math.pow(1 - percentComplete, strength*2);
	}
}

AnimationTimer.makeEaseInOut = function(){
	return function (percentComplete){
		return percentComplete - Math.sin(percentComplete * 2 * Math.PI) / (2*Math.PI);
	}
}

AnimationTimer.makeElastic = function(passes){
	passes = passes || this.DEFAULT_ELASTIC_PASSES;
	return function (percentComplete){
		return ((1 - Math.cos(percentComplete * Math.PI * passes)) * 
			(1 - percentComplete)) + percentComplete; 
	}
}

AnimationTimer.makeBounce = function(bounce){
	var fn = AnimationTimer.makeElastic(bounce);
	return function (percentComplete){
		percentComplete = fn(percentComplete);
		return percentComplete <= 1 ? percentComplete : 2 - percentComplete
	}
}

AnimationTimer.makeLinear = function(){
	return function (percentComplete){
		return percentComplete;
	}
}