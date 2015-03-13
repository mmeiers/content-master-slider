window.MSViewEvents = function (type, data){
	this.type = type;
	this.data = data;
};

MSViewEvents.SWIPE_START      = 'swipeStart';
MSViewEvents.SWIPE_END        = 'swipeEnd';
MSViewEvents.SWIPE_MOVE		 = 'swipeMove';
MSViewEvents.SWIPE_CANCEL   	 = 'swipeCancel';
MSViewEvents.SCROLL 			 = 'scoll';
MSViewEvents.CHANGE_START     = 'slideChangeStart';
MSViewEvents.CHANGE_END	     = 'slideChangeEnd';

