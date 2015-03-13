;(function($){
	
	window.MSLayerElement = function(){
		
		//this.$element = $('<div></div>').addClass('layer-element');
		this.$cont	  = $('<div></div>').addClass('layer-cont');//.append(this.$element);
			
		this.start_anim = {
			name		: 'fade',
			duration	: 1000,
			ease 		: 'linear',
			delay		: 0		
		};
		
		this.end_anim = {
			duration	: 1000,
			ease 		: 'linear'
		};
		
		this.type = 'text'; // video , image
		
		//this.swipe 		= true;
		this.resizable 	= true;
		this.minWidth 	= -1;
		this.isVisible  = true;
		
		this.__cssConfig = [
			'margin-top' 	,      'padding-top'	,
			'margin-bottom'	,      'padding-left'	,
			'margin-right'	,      'padding-right'	,
			'margin-left'	,      'padding-bottom' ,
			
			
			'font-size' 	,  		'line-height'	,
			/*'height'		, */	'width'			,			
			'left'			,       'right'			, 
			'top'			,       'bottom'		
		];
		
		this.baseStyle = {};
	};
	
	var p = MSLayerElement.prototype;
	
	/*-------------- METHODS --------------*/	
	p.__playAnimation = function(animation , css){	
		var options = {};
		//if(animation.delay > 0) options.delay = animation.delay;
		if(animation.ease)		options.ease = animation.ease;
		
		options.transProperty = window._csspfx + 'transform,opacity';

		this.show_tween = CTween.animate(this.$element, animation.duration , css , options);					
	};
	
	p._randomParam = function(value){
		var min = Number(value.slice(0,value.indexOf('|')));
		var max = Number(value.slice(value.indexOf('|')+1));
		
		return min + Math.random() * (max - min);
	};
	
	p._parseEff = function(eff_name){
		
		var eff_params = [];
		
		if(eff_name.indexOf('(') !== -1){
			var temp   = eff_name.slice(0 , eff_name.indexOf('(')).toLowerCase();
			var	value;
			
			eff_params = eff_name.slice(eff_name.indexOf('(') + 1 , -1).replace(/\"|\'|\s/g , '').split(',');
			eff_name   = temp;
		
			for(var i = 0 , l = eff_params.length; i < l ; ++i){
				value = eff_params[i];
				
				if(value in MSLayerEffects.presetEffParams)
					value = MSLayerEffects.presetEffParams[value];
				
				eff_params[i] = value;
			}
		}
		
		return {eff_name:eff_name , eff_params:eff_params};
	};
	
	p._parseEffParams = function(params){
		var eff_params = [];
		for(var i = 0 , l = params.length; i < l ; ++i){
			var value = params[i];
			if(typeof value === 'string' && value.indexOf('|') !== -1) value = this._randomParam(value);
			
			eff_params[i] = value;
		}
		
		return eff_params;
	};
	
	p._checkPosKey = function(key , style){		
		if(key === 'left' && !(key in this.baseStyle) && 'right' in this.baseStyle){
			 style.right = -parseInt(style.left) + 'px';
			 delete style.left;
			 return true;
		}
		
		if(key === 'top'  && !(key in this.baseStyle) && 'bottom' in this.baseStyle){
			style.bottom = -parseInt(style.top) + 'px';
			delete style.top;
			return true;
		} 
		
		return false;
	};
	
	
	/*
	---------------------------------------------------
	 					Public Methods
	---------------------------------------------------
	*/	
	p.setStartAnim = function(anim){ 
		$.extend(this.start_anim , anim); $.extend(this.start_anim  , this._parseEff(this.start_anim.name)); 
		this.$element.css('visibility' , 'hidden');
	};
	p.setEndAnim   = function(anim){ $.extend(this.end_anim   , anim ); };
	
	p.create = function(){
		this.$element.css('display', 'none')
					 .removeAttr('data-delay')
					 .removeAttr('data-effect')
					 .removeAttr('data-duration')
					 .removeAttr('data-type');
		
		// resizable layer
		if( this.$element.data('resize') !== undefined ) {
			this.resizable = this.$element.data('resize');
			this.$element.removeAttr('data-resize');
		}

		// fixed positioning
		if( this.$element.data('fixed') !== undefined ){
			this.fixed = this.$element.data('fixed');
			this.$element.removeAttr('data-fixed');
		}

		// hide under parameter
		if( this.$element.data('widthlimit') !== undefined ) {
			this.minWidth = this.$element.data('widthlimit');
			this.$element.removeAttr('data-widthlimit');
		}

		if( !this.end_anim.name ) {
			this.end_anim.name = this.start_anim.name;
		}

		if( this.end_anim.time ) {
			this.autoHide = true;//this.end_anim.delay = this.slide.delay * 1000 - this.end_anim.duration;
		}

		// create action event
		// @since v1.7.2
		if( this.$element.data('action') !== undefined ) {
			var slideController = this.slide.slider.slideController;
			this.$element.on('click', function(event){
				slideController.runAction($(this).data('action'));
				event.preventDefault();
			}).addClass('ms-action-layer');
		} 
		
		$.extend(this.end_anim  , this._parseEff(this.end_anim.name));
		this.slider = this.slide.slider;
		
		// new alignment method
		// @since v1.6.1
		var layerOrigin = this.layerOrigin = this.$element.data('origin');
		if ( layerOrigin ){

			var vOrigin  = layerOrigin.charAt(0),
				hOrigin  = layerOrigin.charAt(1),
				offsetX  = this.$element.data('offset-x'),
				offsetY  = this.$element.data('offset-y');

			if( offsetY !== undefined ){
				this.$element.removeAttr('data-offset-y');
			} else {
				offsetY = 0;
			}

			switch ( vOrigin ){
				case 't':
					this.$element[0].style.top = offsetY + 'px';
					break;
				case 'b':
					this.$element[0].style.bottom = offsetY + 'px';
					break;
				case 'm':
					this.$element[0].style.top = offsetY + 'px';
					this.middleAlign = true;
			}
			
			if( offsetX !== undefined ){
				this.$element.removeAttr('data-offset-x');
			} else {
				offsetX = 0;
			}

			switch ( hOrigin ){
				case 'l':
					this.$element[0].style.left = offsetX + 'px';
					break;
				case 'r':
					this.$element[0].style.right = offsetX + 'px';
					break;
				case 'c':
					this.$element[0].style.left = offsetX + 'px';
					this.centerAlign = true;
			}

			this.$element.removeAttr('data-origin');
		}

		// parallax effect 
		// @since v1.6.0
		this.parallax = this.$element.data('parallax')
		if( this.parallax != null ) {
			this.parallax /= 100;
			this.$parallaxElement = $('<div></div>').addClass('ms-parallax-layer');
			if( this.link ) { // only for image layer
				this.link.wrap(this.$parallaxElement);
				this.$parallaxElement = this.link.parent();
			} else {
				this.$element.wrap(this.$parallaxElement);
				this.$parallaxElement = this.$element.parent();
			}
			
			this._lastParaX = 0;
			this._lastParaY = 0;
			this._paraX = 0;
			this._paraY = 0;


			// add bottom 0 to the parallax element if layer origin specified to the bottom
			this.alignedToBot = this.layerOrigin && this.layerOrigin.indexOf('b') !== -1;
			if( this.alignedToBot ) {
				this.$parallaxElement.css('bottom', 0);
			}

			if( window._css3d ){
				this.parallaxRender = this.parallaxCSS3DRenderer;	
			} else if ( window._css2d ){
				this.parallaxRender = this.parallaxCSS2DRenderer;
			} else {
				this.parallaxRender = this.parallax2DRenderer;
			}

			if( this.slider.options.parallaxMode !== 'swipe' ){ // mouse mode
				averta.Ticker.add(this.parallaxRender, this);
			}
		}
	};

	/*---------------------------------------------------------*/
	/**
	 * Change the detestation of parallax position 
	 * @param  {Number} x 
	 * @param  {Number} y
	 * @since  1.6.0
	 */
	p.moveParallax = function(x, y , fast){
		this._paraX = x;
		this._paraY = y;
		if( fast ){
			this._lastParaX = x;
			this._lastParaY = y;
			this.parallaxRender();
		}
	};

	p.parallaxCalc = function(){
		var x_def = this._paraX - this._lastParaX,
			y_def = this._paraY - this._lastParaY;

		this._lastParaX += x_def / 12;
		this._lastParaY += y_def / 12;

		if( Math.abs( x_def ) < 0.019 ) {
			this._lastParaX = this._paraX;
		}

		if( Math.abs( y_def ) < 0.019 ) {
			this._lastParaY = this._paraY;
		}

	}

	/**
	 * Parallax move ticker function
	 */
	p.parallaxCSS3DRenderer = function(){
		this.parallaxCalc();
		this.$parallaxElement[0].style[window._jcsspfx + 'Transform'] = 'translateX(' + this._lastParaX * this.parallax + 'px) translateY(' + this._lastParaY * this.parallax + 'px) translateZ(0)';
	};

	p.parallaxCSS2DRenderer = function(){
		this.parallaxCalc();
		this.$parallaxElement[0].style[window._jcsspfx + 'Transform'] = 'translateX(' + this._lastParaX * this.parallax + 'px) translateY(' + this._lastParaY * this.parallax + 'px)';
	};

	p.parallax2DRenderer = function(){
		this.parallaxCalc();
		
		// change bottom instead of top if layer aligned to the bottom (origin)
		if( this.alignedToBot ) {
			this.$parallaxElement[0].style.bottom  = this._lastParaY * this.parallax + 'px';
		} else { 
			this.$parallaxElement[0].style.top  = this._lastParaY * this.parallax + 'px';
		}
		
		this.$parallaxElement[0].style.left = this._lastParaX * this.parallax + 'px';
	};

	/*---------------------------------------------------------*/

	p.init = function(){
		//if(this.initialized) return;
		this.initialized = true;

		var value;
		
		this.$element.css('visibility' , '');
		// store initial layer styles
		for(var i = 0 , l = this.__cssConfig.length; i < l ; i ++){
			var key = this.__cssConfig[i];
			if( this.type === 'text' && key === 'width'){ // in some browsers using computed style for width in text layer causes unexpected word wrapping 
				value = this.$element[0].style.width;
			} else {
				value = this.$element.css(key);

				// fix for Google Chrome in ios, sometimes image layers over first slide not showing correctly. 
				if ( (key === 'width' || key === 'height') && value === '0px' ) {
					value = this.$element.data(key) + 'px';
				}
			}
			
			if(value != 'auto' && value != "" && value != "normal") 
				this.baseStyle[key] = parseInt(value);
		}

		// @since v1.6.0
		if ( this.middleAlign ){
			this.baseHeight = this.$element.outerHeight(false);//this.$element.height();
		}

		if ( this.centerAlign ){
			// in some browsers using computed style for width in text layer causes unexpected word wrapping 
			//if ( this.type === 'text' ){
			//	this.baseWidth = parseInt(this.$element[0].style.width);
			//} else {
				this.baseWidth = this.$element.outerWidth(false);
			//}
		}

	};
	
	p.locate = function(){
		
		// is slide ready?		
		if ( !this.slide.ready ) {
			return;
		}

		var layer_cont 	= this.slide.$layers,
			width 		= parseFloat(layer_cont.css('width')),
			height 		= parseFloat(layer_cont.css('height')),
			factor, isPosition;
		
		if( this.$element.css('display') === 'none' && this.isVisible) {
			this.$element.css('display', 'block')
						 .css('visibility', 'hidden');
		} 

		//if(!this.resizable) return;
		
		factor = this.resizeFactor 	= width / this.slide.slider.options.width;

		// updated @since v1.6.1
		for(var key in this.baseStyle){

			isPosition = key === 'top' || key === 'left' || key === 'bottom' || key === 'right';

			//switch resize/position factor
			if( this.fixed && isPosition ){
				factor = 1;
			} else {
				factor = this.resizeFactor;
			}

			if( !this.resizable && !isPosition ){
				continue;
			}

			if ( key === 'top' && this.middleAlign ){
				this.$element[0].style.top = '0px';
				this.baseHeight = this.$element.outerHeight(false);
				this.$element[0].style.top = this.baseStyle['top'] * factor + (height - this.baseHeight) / 2  + 'px';
			} else if ( key === 'left' && this.centerAlign ){
				this.$element[0].style.left = '0px';
				this.baseWidth = this.$element.outerWidth(false);
				this.$element[0].style.left = this.baseStyle['left'] * factor + (width - this.baseWidth) / 2  + 'px';
			} else { 
				this.$element.css(key , this.baseStyle[key] * factor + 'px');
			}
		}
		
		//console.trace(this.minWidth , width)
		this.visible(this.minWidth < width);
	};
	
	p.start = function(){

		if(this.isShowing) return;
		this.isShowing = true;
		
		var key , base, layer_cont = this.slide.$layers;

		// reads css value form LayerEffects
		MSLayerEffects.rf = this.resizeFactor;
		var effect_css = MSLayerEffects[this.start_anim.eff_name].apply(null , this._parseEffParams(this.start_anim.eff_params));
		
		// checkes effect css and defines TO css values
		var start_css_eff = {};
		
		// set from position
		for(key in effect_css){

			// check the position key (top, left, right or bottom) for animatin
			// It mostly will be used in old browsers
			// In effect left:100, layer base style right:300 -> effect changes to right:100
			if( this._checkPosKey(key , effect_css) ){
				continue;
			}

			// set default value from Layer Effects Class
			if( MSLayerEffects.defaultValues[key] != null ){
				start_css_eff[key] = MSLayerEffects.defaultValues[key];
			}

			if( key in this.baseStyle ){
				base = this.baseStyle[key];

				// updated @since v1.6.1
				if ( this.middleAlign && key === 'top' ){
					base += (parseInt(layer_cont.height()) - this.$element.outerHeight(false)) / 2;				
				}

				if ( this.centerAlign && key === 'left' ){
					base += (parseInt(layer_cont.width()) - this.$element.outerWidth(false)) / 2;				
				}
				//----------------------

				effect_css[key] = base + parseFloat(effect_css[key]) + 'px';
				start_css_eff[key] = base + 'px';
			}

			this.$element.css(key , effect_css[key]);
		}
		
		var that = this;

		clearTimeout(this.to);
		this.to = setTimeout(function(){
			//that.locate();
			that.$element.css('visibility', '');
			that.__playAnimation(that.start_anim , start_css_eff);
		} , that.start_anim.delay || 0.01);
		
		
		this.cl_to = setTimeout(function(){
			that.show_cl = true;
		},(this.start_anim.delay || 0.01) + this.start_anim.duration);
		 
		if( this.autoHide ){
			clearTimeout(this.hto);
			this.hto = setTimeout(function(){that.hide();} , that.end_anim.time );
		}

	};
	
	p.hide = function(){
		this.isShowing = false;
		
		// reads css value form LayerEffects
		var effect_css = MSLayerEffects[this.end_anim.eff_name].apply(null , this._parseEffParams(this.end_anim.eff_params));
		
		for(key in effect_css){
			
			if(this._checkPosKey(key , effect_css)) continue;
			
			if( key === window._jcsspfx + 'TransformOrigin' ){
				this.$element.css(key , effect_css[key]);
			}

			if(key in this.baseStyle){
				effect_css[key] = this.baseStyle[key] + parseFloat(effect_css[key]) +  'px';
			}
				
		}
		
		this.__playAnimation(this.end_anim , effect_css);
		
		clearTimeout(this.to);
		clearTimeout(this.hto);		
		clearTimeout(this.cl_to);		
	};
	
	p.reset = function(){
		this.isShowing = false;
		//this.$element.css(window._csspfx + 'animation-name', ''	);
		this.$element[0].style.display = 'none';
		this.$element.css('opacity', '100');
		this.$element[0].style['transitionDuration'] = '0ms';
		
		if(this.show_tween)
			this.show_tween.stop(true);
		
		clearTimeout(this.to);
		clearTimeout(this.hto);
	};
		
	p.destroy = function(){
		this.reset();
		this.$element.remove();
		this.$cont.remove();
	};
	
	p.visible = function(value){
		if(this.isVisible == value) return;

		this.isVisible = value;
		
		this.$element.css('display' , (value ? '' : 'none'));		
	};
	
})(jQuery);
