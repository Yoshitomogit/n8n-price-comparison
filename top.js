$(function(){

	//下層スライダー
	$('.top_slider').slick({
		prevArrow: '<div class="slide-arrow slick-prev"></div>',
		nextArrow: '<div class="slide-arrow slick-next"></div>',
		centerMode: true,
		variableWidth: true,
		infinite: true,
		arrows: true,
		dots: true,
		autoplay: true,
		speed: 1500,
		autoplaySpeed: 3000,
		customPaging: function(slick,index) {
			return index;
		}
	});

	function sliderSetting(){
		var width = $(window).width();
		if(width <= 768){
			$('.top_point .inner .slider').not('.slick-initialized').slick({
				prevArrow: '<div class="slide-arrow slick-prev"></div>',
				nextArrow: '<div class="slide-arrow slick-next"></div>',
				centerMode: true,
				variableWidth: true,
				infinite: true,
				arrows: true,
				dots: true,
				autoplay: true,
				speed: 1500,
				autoplaySpeed: 3000,
				customPaging: function(slick,index) {
					return index;
				}
			});
		} else {
			$('.top_point .inner .slider.slick-initialized').slick('unslick');
		}
	}
	// 初期表示時の実行
	sliderSetting();
	// リサイズ時の実行
	$(window).resize( function() {
		sliderSetting();
	});

});