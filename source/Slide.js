;(function($){
	
	"use strict";
	
	window.MSSlide = function(){
		
		this.$element = null;
		
		this.$loading = $('<div></div>').addClass('ms-slide-loading');
		
		/* @ifdef PRO */
		this.layers = [];
		/* @endif */

		this.view 		= null;
		this.index 		= -1;
		
		this.__width 	= 0;
		this.__height 	= 0;
		
		this.preloadCount = 0;
		
		this.fillMode = 'fill'; // fill , fit , stretch , tile , center
		
		this.selected = false;
		this.pselected = false;
		this.autoAppend = true;
		this.isSleeping = true;
		
		this.moz = $.browser.mozilla;
	};
	
	var p = MSSlide.prototype;
		
	/*-------------- METHODS --------------*/
	
	
	/* -----------------------------------------------------
	 * 				Slide Swipe Reaction
	 -----------------------------------------------------*/
	p.onSwipeStart = function(){
		//this.$layers.css(window._csspfx + 'transition-duration' , '0ms');
		if(this.link)  this.linkdis = true;
		if(this.video) this.videodis = true;
	};

	p.onSwipeMove = function (e) {
		var move = Math.max(Math.abs(e.data.distanceX), Math.abs(e.data.distanceY));
		this.swipeMoved = move > 4;
	};
		
	p.onSwipeCancel = function(e){
		//console.log(e.data)
		if ( this.swipeMoved ) { 
			this.swipeMoved = false;
			return;
		}

		if(this.link) this.linkdis = false;
		if(this.video) this.videodis = false;
		//this.$layers.css(window._csspfx + 'transition-duration' , this.view.__slideDuration + 'ms');
	};

	/* @ifdef PRO */

	/* -----------------------------------------------------
	 * 					Slide Layers
	 -----------------------------------------------------*/
	
	p.addLayer = function(layer){
		if(!this.hasLayers)
			this.$layers  = $('<div></div>').addClass('ms-slide-layers');
		
		this.hasLayers = true;
		
		this.$layers.append(layer.$element);
		this.layers.push(layer);
		layer.slide = this;
		layer.create();
		
		// @since 1.7.0
		if( layer.parallax ){
			this.hasParallaxLayer = true;
		}

		if(layer.needPreload) this.preloadCount ++;		
	};
	
	/* @endif */

	// This method will be called by the last layer after loading all of layers.
	p.___onlayersReady = function(){
		this.ready = true;
		this.slider.api._startTimer();
		
		/* @ifdef PRO */
		if( this.selected || (this.pselected && this.slider.options.instantStartLayers) ){
			/*this.initLayers();
			this.locateLayers();
			this.startLayers();*/

			this.showLayers();

			if(this.vinit){
				this.bgvideo.play();
				if( !this.autoPauseBgVid ) {
					this.bgvideo.currentTime = 0;
				}
			}

		}
		/* @endif */	

		if(!this.isSleeping)
			this.setup();

		CTween.fadeOut(this.$loading , 300 , true);
		
		//sequence loading
		if((this.slider.options.preload === 0 || this.slider.options.preload === 'all') && this.index < this.view.slideList.length - 1){
			this.view.slideList[this.index + 1].loadImages();
		}
		else if(this.slider.options.preload === 'all' && this.index === this.view.slideList.length - 1)
			this.slider._removeLoading();
		
	};

	/*
	p.updateLayers = function(){
		if(!this.hasLayers) return;
		
		var value = -parseInt(this.$element.css('left')) - this.view.__contPos;
		
		this.$layers[0].style.opacity = (1 - Math.abs(value / this.__width));
		//this.$layers.css('opacity' ,  1 - Math.abs(value / this.__width));
	};
	*/
	/* @ifdef PRO */
	p.startLayers = function(){
		for(var i = 0 , l = this.layers.length; i < l; ++i)
			this.layers[i].start();
	};
	
	p.initLayers = function(force){
		if(this.init && !force || this.slider.init_safemode) return;
		this.init = true;
		for(var i = 0 , l = this.layers.length; i < l; ++i)
			this.layers[i].init();
	};
	
	p.locateLayers = function(){
		for(var i = 0 , l = this.layers.length; i < l; ++i)
			this.layers[i].locate();
	};
	
	p.resetLayers = function(){
		this.$layers.css('display' , 'none');
		this.$layers.css('opacity' ,  1);
		for(var i = 0 , l = this.layers.length; i < l; ++i)
			this.layers[i].reset();
	};
	
	p.hideLayers = function(){
		if(this.preloadCount !== 0) return;
		for(var i = 0 , l = this.layers.length; i < l; ++i)
			this.layers[i].hide();
	};

	p.showLayers = function(){
		if(!this.hasLayers) return;


		if(this.lht){
			if(this.lht.reset)
				this.lht.reset();
			else
				this.lht.stop(true);
		}
		

		this.resetLayers();
		this.$layers.css('opacity' ,  1)
					.css('display' , 'block');
		var that = this;

		if(this.preloadCount === 0){
			this.initLayers();
			this.locateLayers();
			this.startLayers();
		} 
	}
	
	/* -----------------------------------------------------*/
	p.applyParallax = function(x, y, fast){
		for(var i = 0 , l = this.layers.length; i !== l; ++i){
			if( this.layers[i].parallax != null ){
				this.layers[i].moveParallax(x, y, fast);
			}  
		}
	};

	p.enableParallaxEffect = function(){
		
		if( !this.hasParallaxLayer ){
			return;
		}

		if( this.slider.options.parallaxMode === 'swipe' ){
			this.view.addEventListener(MSViewEvents.SCROLL, this.swipeParallaxMove, this);
		} else {
			this.$element.on('mousemove' , {that:this}, this.mouseParallaxMove)
						 .on('mouseleave', {that:this}, this.resetParalax);
			/**
			 * Calculates new position of parallax based on device orintation gamma and beta
			 * @param  {Event} e 
			 * @since 1.6.0
			 */
			/*if( window._mobile && window.DeviceOrientationEvent ){
				
				var that = this;
				this.orientationParallaxMove = function(e){
					var beta = Math.round(e.beta),
						gamma = Math.round(e.gamma);
					
					that.applyParallax(beta * that.__width / 360 , -gamma * that.__height / 360);
				};

				window.addEventListener('deviceorientation', this.orientationParallaxMove, false);
			}*/
		}
	};

	p.disableParallaxEffect = function(){

		if( !this.hasParallaxLayer ){
			return;
		}

		if( this.slider.options.parallaxMode === 'swipe' ){
			this.view.removeEventListener(MSViewEvents.SCROLL, this.swipeParallaxMove, this);
		} else {
			this.$element.off('mousemove', this.mouseParallaxMove)
						 .off('mouseleave', this.resetParalax);
			
			/*if( window._mobile && window.DeviceOrientationEvent ){
				window.removeEventListener('deviceorientation', this.orientationParallaxMove);
			}*/
		}
	};

	p.resetParalax = function(e){
		var that = e.data.that;
		that.applyParallax(0,0);
	};

	/**
	 * Calculates new mouse position over slide and moves layers
	 * @since 1.6.0
	 */
	p.mouseParallaxMove = function(e){
		var that = e.data.that,
			os = that.$element.offset(),
			slider = that.slider;

			if( slider.options.parallaxMode !== 'mouse:y-only' ){
				var x = e.pageX - os.left - that.__width  / 2;
			} else {
				var x = 0;
			}

			if( slider.options.parallaxMode !== 'mouse:x-only' ){
				var y = e.pageY - os.top  - that.__height / 2;
			} else {
				var y = 0;
			}

		that.applyParallax(-x, -y);
	};


	/**
	 * Calculates new position of parallax based on slide position
	 * @param  {Event} e
	 * @since 1.6.0
	 */
	p.swipeParallaxMove = function(e){
		var value = this.position - this.view.__contPos;
		this.applyParallax(value, 0, true);
	};

	/* -----------------------------------------------------*/
	
	/* @endif */ 

	p.setBG = function(img){
		this.hasBG = true;	
		var that = this;
		
		this.$imgcont = $('<div></div>').addClass('ms-slide-bgcont');
		
		this.$element.append(this.$loading)
			   		 .append(this.$imgcont);
		
		this.$bg_img = $(img).css('visibility' , 'hidden');
		this.$imgcont.append(this.$bg_img);
		
		this.bgAligner = new MSAligner(that.fillMode , that.$imgcont, that.$bg_img );
		this.bgAligner.widthOnly = this.slider.options.autoHeight;
			
		if(that.slider.options.autoHeight && (that.pselected || that.selected))
			 that.slider.setHeight(that.slider.options.height);
		
		if(this.$bg_img.data('src') !== undefined){
			this.bg_src = this.$bg_img.data('src');
			this.$bg_img.removeAttr('data-src');
		}else{
			this.$bg_img.one('load', function(event) {that._onBGLoad(event);})
						.each($.jqLoadFix);
		}
		
		this.preloadCount++;	
	};
	
	p._onBGLoad = function(event){
		this.bgNatrualWidth = event.width;
		this.bgNatrualHeight = event.height;

		this.bgLoaded = true;
		
		if($.browser.msie)
			this.$bg_img.on('dragstart', function(event) { event.preventDefault(); }); // disables native dragging
		
		this.preloadCount--;
		
		if(this.preloadCount === 0){
			this.___onlayersReady();
		}
	};
	
	p.loadImages = function(){
		if(this.ls)return;

		this.ls = true;
		
		// @since 1.7.0 
		// There is nothing to preload? so slide is ready to show.
		if( this.preloadCount === 0 ){
			this.___onlayersReady();
		}

		/* @ifdef PRO */
		if(this.bgvideo)
			this.bgvideo.load();
		/* @endif */

		if(this.hasBG && this.bg_src){
			var that = this;
			this.$bg_img.preloadImg(this.bg_src , function(event) {that._onBGLoad(event);});
		}

		/* @ifdef PRO */
		for(var i = 0 , l = this.layers.length; i < l; ++i){
			if(this.layers[i].needPreload)this.layers[i].loadImage();
		}
		/* @endif */
	};
	
	/* -----------------------------------------------------*/

	/* @ifdef PRO */
	p.setBGVideo = function($video){
		if(!$video[0].play) return;

		// disables video in mobile devices
		if(window._mobile){
			$video.remove();
			return;
		}

		this.bgvideo  = $video[0];
		var that = this;

		$video.addClass('ms-slide-bgvideo');
		
		if($video.data('loop') !== false){
			this.bgvideo.addEventListener('ended' , function(){
				//that.bgvideo.currentTime = -1;
				that.bgvideo.play();
			});
		}	

		if($video.data('mute') !== false){
			this.bgvideo.muted = true;
		}

		if($video.data('autopause') === true){
			this.autoPauseBgVid = true;
		}

		this.bgvideo_fillmode = $video.data('fill-mode') || 'fill'; // fill , fit , none
		
		if(this.bgvideo_fillmode !== 'none') {
			this.bgVideoAligner = new MSAligner(this.bgvideo_fillmode , this.$element, $video );
			
			this.bgvideo.addEventListener('loadedmetadata' , function(){
				if(that.vinit) return;

				that.vinit = true;
				that.video_aspect = that.bgVideoAligner.baseHeight/that.bgVideoAligner.baseWidth;
				that.bgVideoAligner.init(that.bgvideo.videoWidth , that.bgvideo.videoHeight);

				//alert(that.bgvideo.videoWidth + ' ' + that.selected)
				that._alignBGVideo();
				CTween.fadeIn($(that.bgvideo) , 200);
				if(that.selected)
					that.bgvideo.play();
			});
		}

		$video.css('opacity' , 0);

		this.$bgvideocont = $('<div></div>').addClass('ms-slide-bgvideocont').append($video);

		if(this.hasBG){
			this.$imgcont.before(this.$bgvideocont);
		}else{
			this.$bgvideocont.appendTo(this.$element);
		}
	};

	p._alignBGVideo = function(){
		if(!this.bgvideo_fillmode || this.bgvideo_fillmode === 'none') return;
		this.bgVideoAligner.align();
	};

	/* -----------------------------------------------------*/
	
	/* @endif */

	p.setSize = function(width , height , hard){

		this.__width  = width;
		
		if(this.slider.options.autoHeight){
			if(this.bgLoaded){
				this.ratio = this.__width / this.bgWidth;
				height = Math.floor(this.ratio * this.bgHeight);
				this.$imgcont.height(height);
			}else{
				this.ratio = width / this.slider.options.width;
				height = this.slider.options.height * this.ratio;
			}
		}
	
		this.__height = height;
		this.$element.width(width).height(height);

		if(this.hasBG && this.bgLoaded)this.bgAligner.align();
		
		/* @ifdef PRO */
		this._alignBGVideo();
		
		if(hard && this.selected) this.initLayers(hard);
		if(this.selected) {
			//clearTimeout(this.locateLayersTo);
			//this.locateLayersTo = setTimeout(function(that){
				this.locateLayers();
			//},20,this);
		}
		
		
		if(this.hasLayers){
			if(this.slider.options.autoHeight){
				this.$layers[0].style.height = this.getHeight() + 'px';
			}
			
			if(this.slider.options.layersMode == 'center') 
				this.$layers[0].style.left = Math.max( 0 ,  (this.__width - this.slider.options.width) / 2 ) + 'px';
		}
		/* @endif */
	};

	
	p.getHeight = function(){
		if( this.hasBG && this.bgLoaded ) return this.bgHeight * this.ratio;
		return Math.max(this.$element[0].clientHeight, this.slider.options.height * this.ratio);
	};

	/* -----------------------------------------------------*/
	// YouTube and Vimeo videos	
	p.__playVideo = function(){
		if(this.vplayed || this.videodis) return;
		this.vplayed = true;
		if(!this.slider.api.paused){
			this.slider.api.pause();
			this.roc = true; // resume on close;
		}
		this.vcbtn.css('display' , '');
		CTween.fadeOut(this.vpbtn 	, 500 , false);
		CTween.fadeIn(this.vcbtn 	, 500);
		CTween.fadeIn(this.vframe 	, 500);
		this.vframe.css('display' , 'block').attr('src' , this.video + '&autoplay=1');
		this.view.$element.addClass('ms-def-cursor');
		
		// if swipe navigation enabled		
		if ( this.view.swipeControl ) {
			this.view.swipeControl.disable();
		}
		
		this.slider.slideController.dispatchEvent(new MSSliderEvent(MSSliderEvent.VIDEO_PLAY));
	};
	
	p.__closeVideo = function(){
		if(!this.vplayed) return;
		this.vplayed = false;
		if(this.roc)
			this.slider.api.resume();
		var that = this;
		
		CTween.fadeIn(this.vpbtn	, 500);
		CTween.animate(this.vcbtn   , 500 , {opacity:0} , {complete:function(){	that.vcbtn.css  ('display'  , 'none'); }});
		CTween.animate(this.vframe  , 500 , {opacity:0} , {complete:function(){	that.vframe.attr('src'  , 'about:blank').css('display'  , 'none');}});
		
		// if swipe navigation enabled		
		if ( this.view.swipeControl ) {
			this.view.swipeControl.enable();
		}
		
		this.view.$element.removeClass('ms-def-cursor');
		this.slider.slideController.dispatchEvent(new MSSliderEvent(MSSliderEvent.VIDEO_CLOSE));
	};

	/* -----------------------------------------------------*/

	p.create = function(){
		var that = this;

		/* @ifdef PRO */
		if(this.hasLayers){			
			this.$element.append(this.$layers);
			
			if(this.slider.options.layersMode == 'center')
				this.$layers.css('max-width' , this.slider.options.width + 'px');
		}
		/* @endif */

		if(this.link){
			this.link.addClass('ms-slide-link').html('').click(function(e){
				if ( that.linkdis ) {
					e.preventDefault();
				}
			});

			// this.$element.css('cursor' , 'pointer')
			// 			 .click(function(){ if(!that.linkdis) window.open(that.link , that.link_targ || '_self'); });
		}
		
		if(this.video){

			if(this.video.indexOf('?') === -1) this.video += '?';
			this.vframe = $('<iframe></iframe>')
						  .addClass('ms-slide-video')
						  .css({width:'100%' , height:'100%' , display:'none'})
						  .attr('src' , 'about:blank')
						  .attr('allowfullscreen', 'true')
						  .appendTo(this.$element);
			
			this.vpbtn = $('<div></div>')
						.addClass('ms-slide-vpbtn')
						.click(function(){that.__playVideo();})
						.appendTo(this.$element);	
			
			this.vcbtn = $('<div></div>')
						.addClass('ms-slide-vcbtn')
						.click(function(){that.__closeVideo();})
						.appendTo(this.$element)
						.css('display','none');

			if(window._touch){
				this.vcbtn.removeClass('ms-slide-vcbtn')
						  .addClass('ms-slide-vcbtn-mobile')
						  .append('<div class="ms-vcbtn-txt">Close video</div>')
						  .appendTo(this.view.$element.parent());
			}
		}	
		
		if(!this.slider.options.autoHeight && this.hasBG){
			this.$imgcont.css('height' , '100%');
			
			if(this.fillMode === 'center' || this.fillMode === 'stretch')
				this.fillMode = 'fill';		
		}

		if( this.slider.options.autoHeight ) { 
			this.$element.addClass('ms-slide-auto-height');
		}


		this.sleep(true);
	};
	
	
	p.destroy = function(){
		/* @ifdef PRO */
		for(var i = 0 , l = this.layers.length; i < l; ++i){
			this.layers[i].$element.stop(true).remove();
		}
		/* @endif */

		this.$element.remove();
		this.$element = null;
	};
	
	p.setup = function(){

		//if(this.isSettedup) return;
		//this.isSettedup = true;

		if(!this.initBG && this.bgLoaded){
			this.initBG = true;
			this.$bg_img.css('visibility' , '');
			this.bgWidth  = this.bgNatrualWidth  || this.$bg_img.width();
			this.bgHeight = this.bgNatrualHeight || this.$bg_img.height();

			CTween.fadeIn(this.$imgcont , 300);	

			if(this.slider.options.autoHeight){
				this.$imgcont.height(this.bgHeight * this.ratio);
			}
			
			this.bgAligner.init(this.bgWidth  , this.bgHeight);
			this.setSize(this.__width , this.__height);
			
			if(this.slider.options.autoHeight && (this.pselected || this.selected))
			 	this.slider.setHeight(this.getHeight());
		}
		
	};

	p.prepareToSelect = function(){


		if(this.pselected || this.selected) return;
		this.pselected = true;		
		
		if(this.link || this.video){
			this.view.addEventListener(MSViewEvents.SWIPE_START  , this.onSwipeStart  , this);
			this.view.addEventListener(MSViewEvents.SWIPE_MOVE  , this.onSwipeMove  , this);
			this.view.addEventListener(MSViewEvents.SWIPE_CANCEL , this.onSwipeCancel , this);
			this.linkdis = false;
			this.swipeMoved = false;	
		}

		this.loadImages();

		/* @ifdef PRO */
		if(this.preloadCount === 0){
			if( this.bgvideo ){
				this.bgvideo.play();
			}

			if( this.slider.options.instantStartLayers){
				this.showLayers();
			}
		}

		// enables parallax effect 
		// @since 1.6.0
		this.enableParallaxEffect();
		/* @endif */

		if( this.moz ){
			this.$element.css('margin-top' , '');
		}


	};
	
	/*p.prepareToUnselect = function(){
		if(!this.pselected || !this.selected) return;
		
		this.pselected = false;
		
	};*/
	
	p.select = function(){
		if(this.selected) return;
		this.selected = true;
		this.pselected = false;
		this.$element.addClass('ms-sl-selected');
		
		/* @ifdef PRO */
		if(this.hasLayers){
			if(this.slider.options.autoHeight)
				this.$layers[0].style.height = this.getHeight() + 'px';
			
			if( !this.slider.options.instantStartLayers ) {
				this.showLayers();
			}

			//this.view.addEventListener(MSViewEvents.SCROLL 		, this.updateLayers  , this)
		} 	
		

		if( this.preloadCount === 0 && this.bgvideo ) {
			this.bgvideo.play();
		}
		/* @endif */
		
		// @since 1.8.0 
		// Autoplay iframe video
		if ( this.videoAutoPlay ) {
			this.videodis = false;
			this.vpbtn.trigger('click');
		}

	};
	
	p.unselect = function(){
		this.pselected = false;
		if(this.moz)
			this.$element.css('margin-top' , '0.1px');

		if(this.link || this.video){
			this.view.removeEventListener(MSViewEvents.SWIPE_START 	 , this.onSwipeStart  , this);
			this.view.removeEventListener(MSViewEvents.SWIPE_MOVE  , this.onSwipeMove  , this);
			this.view.removeEventListener(MSViewEvents.SWIPE_CANCEL  , this.onSwipeCancel , this);
		}

		/* @ifdef PRO */
		if(this.bgvideo){
			this.bgvideo.pause();
			if(!this.autoPauseBgVid && this.vinit)
				this.bgvideo.currentTime = 0;
		}

		// hide layers
		if( this.hasLayers && (this.selected || this.slider.options.instantStartLayers) ){
			var that = this;
			that.lht = CTween.animate(this.$layers ,500 , {opacity:0} , {complete:function(){	that.resetLayers();	}});
			//this.view.removeEventListener(MSViewEvents.SCROLL 		, this.updateLayers  , this);
			
			// disables parallax effect
			// @since 1.6.0
			this.disableParallaxEffect();
		}
		/* @endif */
			
		if(!this.selected) return;
		this.selected = false;

		this.$element.removeClass('ms-sl-selected');		
		if(this.video && this.vplayed){
			this.__closeVideo();
			this.roc = false;
		}	
		
	};	

	p.sleep = function(force){
		if(this.isSleeping && !force) return;
		this.isSleeping = true;
		if(this.autoAppend)
			this.$element.detach();
	};
	
	p.wakeup = function(){
		if(!this.isSleeping) return;
		this.isSleeping = false;
		
		if(this.autoAppend)
			this.view.$slideCont.append(this.$element);

		if(this.moz)
			this.$element.css('margin-top' , '0.1px');
		
		this.setup();

		// aling bg
		if(this.hasBG)
			this.bgAligner.align();
	};

})(jQuery);