

var storage = sessionStorage;

var ss_err_mass = '検索することができませんでした。\n「プライベートブラウズ」や「シークレットモード」などがONになっていますと検索条件を保持ないためこのエラーが出る場合がございます。';
function req_ss_save(key,value){
	try {
		storage.setItem(key,value);
	} catch (e) {
		if (e.code === DOMException.QUOTA_EXCEEDED_ERR || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
// 			storage_err_send();
			alert(ss_err_mass);
		}
		sessionStorage.removeItem(key);
		return false;
	}
}


function moveToScroll(_elm,_speed){
	var elm = _elm || $("body");
	var speed = _speed || 1000;
	var position = elm.offset().top;
	$("html,body").animate({scrollTop:position},speed);
	return false;
}

getUrlVars = function(){
	var vars = {};
	var param = location.search.substring(1).split('&');
	if(param[0] == ''){
		return null;
	}
	$.each(param,function(i,v){
		p_val = v.replace(/\?/g,"");
		kv = p_val.split("=");
		var arr_search = kv[0].search(/\[\]/g);
		var pkey = '';
		if(arr_search != -1 && kv[1] != ''){
			pkey = kv[0].replace(/\[\]/g,'');
			if(!vars[pkey]){
				vars[pkey] = new Array();
				vars[pkey].push(decodeURIComponent(kv[1]));
			} else {
				vars[pkey].push(decodeURIComponent(kv[1]));
			}
		} else if(arr_search == -1 && kv[1] != ''){
			var pkey = kv[0];
			vars[pkey] = decodeURIComponent(kv[1]);
		}
	})
	return vars;

}

function genre_reset(){
	$.each($("#s_genre option"),function(){
		if($(this).val() != ''){
			$(this).remove();
		}
	})
	$("#s_genre optgroup").remove();
	$("#s_genre").prop("disabled",false);
	$("#s_genre").removeClass("disabled");
}

function maker_reset(){
	$.each($("#s_maker option"),function(){
		if($(this).val() != ''){
			$(this).remove();
		}
	})
	$("#s_maker optgroup").remove();
	$("#s_maker").prop("disabled",false);
	$("#s_maker").removeClass("disabled");
}
function item_reset(){
	$.each($("#s_items option"),function(){
		if($(this).val() != ''){
			$(this).remove();
		}
	})
	$("#s_items optgroup").remove();
	$("#s_items").prop("disabled",false);
	$("#s_items").removeClass("disabled");
}

function fw_search(_cat,_word,_ofs){
	var ofs = _ofs || null;
	var ret;
	s_data = {
		"flag":"fw_search",
		"fw_cat":_cat,
		"word":_word,
		"offset":ofs
	}
	$.ajax({
		type:"POST",
		url:"/script/ajaxcon_search.php",
		dataType:"html",
		data:s_data,
		async:false,
		success:function(r_data){
			ret = r_data;
		}
	});
	return ret;
}

function pd_search(_cat,_genre,_maker,_items,_ofs){
	var cat = _cat || null;
	var genre = _genre || null;
	var maker = _maker || null;
	var items = _items || null;
	var ofs = _ofs || 0;
	var ret;
	s_data = {
		"flag":"get_result",
		"cat":cat,
		"genre":genre,
		"maker":maker,
		"items":items,
		"offset":ofs
	}
	$.ajax({
		type:"POST",
		url:"/script/ajaxcon_search.php",
		dataType:"html",
		data:s_data,
		async:false,
		success:function(r_data){
			ret = r_data;
		}
	});
	return ret;
}

function ch_category(cat,_callback){
	s_data = {
		"flag":"get_genre",
		"cat":cat
	}
	callback = _callback || function(){return false;}
	if(cat != ''){
		$.ajax({
			type:"POST",
			url:"/script/ajaxcon_search.php",
			dataType:"json",
			data:s_data,
			async:true,
			success:function(r_data){
				var r = r_data;
				if(r["state"] == "error"){
					genre_reset();
					maker_reset();
					item_reset();
					//$("#s_maker").html("");
					//$("#s_items").html("");
					return false;
				} else if(r["state"] == "success"){
					genre_reset();
					maker_reset();
					item_reset();
					$.each(r["data"],function(i,v){
						$("#s_genre").append('<option value="'+v+'">'+v+'</option>');
					})
					$("#s_genre").append('<optgroup label=""></optgroup>');
					callback();
				}

			}
		});
	} else {
		genre_reset();
		maker_reset();
		item_reset();
	}
}

// カテゴリ選択時
$(document).on("change","#s_cat",function(){
	var cat = $(this).val();
	$("#s_genre").prop("disabled",true);
	$("#s_genre").addClass("disabled");
	ch_category(cat,function(){
		$("#s_genre").prop("disabled",false);
		$("#s_genre").removeClass("disabled",false);
	});
})

function ch_genre(cat,genre,_callback){
	var callback = _callback || function(){return false;}
	s_data = {
		"flag":"get_maker",
		"cat":cat,
		"genre":genre
	}
	if(genre != ''){
		$.ajax({
			type:"POST",
			url:"/script/ajaxcon_search.php",
			dataType:"json",
			data:s_data,
			async:true,
			success:function(r_data){
				var r = r_data;
				if(r["state"] == "error"){
					maker_reset();
					item_reset();
					//$("#s_maker").html("");
					//$("#s_items").html("");
					return false;
				} else if(r["state"] == "success"){
					maker_reset();
					item_reset();
					$.each(r["data"],function(i,v){
						$("#s_maker").append('<option value="'+v+'">'+v+'</option>');
					})
					$("#s_maker").append('<optgroup label=""></optgroup>');
					callback();
				}

			}
		});
	} else {
		maker_reset();
		item_reset();
	}
}

// ジャンル選択時
$(document).on("change","#s_genre",function(){
	var cat = $("#s_cat").val();
	var genre = $(this).val();
	$("#s_maker").prop("disabled",true);
	$("#s_maker").addClass("disabled");
	ch_genre(cat,genre,function(){
// 		$("#s_maker").append('<optgroup label=""></optgroup>');
		$("#s_maker").prop("disabled",false);
		$("#s_maker").removeClass("disabled");
	});

})

function ch_maker(cat,genre,maker,_callback){
	var callback = _callback || function(){return false;}
	s_data = {
		"flag":"get_items",
		"cat":cat,
		"genre":genre,
		"maker":maker
	}
	if(maker != ''){
		$.ajax({
			type:"POST",
			url:"/script/ajaxcon_search.php",
			dataType:"json",
			data:s_data,
			async:true,
			success:function(r_data){
				var r = r_data;
				if(r["state"] == "error"){
					item_reset();
					return false;
				} else if(r["state"] == "success"){
					item_reset();
					$.each(r["data"],function(i,v){
						$("#s_items").append('<option value="'+v+'">'+v+'</option>');
					})
					$("#s_items").append('<optgroup label=""></optgroup>');
					callback();
				}

			}
		});
	} else {
		item_reset();
	}
}

// メーカー選択時
$(document).on("change","#s_maker",function(){
	var cat = $("#s_cat").val();
	var genre = $("#s_genre").val();
	var maker = $(this).val();
	$("#s_items").prop("disabled",true);
	$("#s_items").addClass("disabled");
	ch_maker(cat,genre,maker,function(){
// 		$("#s_items").append('<optgroup label=""></optgroup>');
		$("#s_items").prop("disabled",false);
		$("#s_items").removeClass("disabled");
	});
})

// 検索ボタン（プルダウン）
$(document).on("click","#search_pd",function(){
	var cat = $("#s_cat").val();
	var genre = $("#s_genre").val();
	var maker = $("#s_maker").val();
	var items = $("#s_items").val();
	if(cat == ''){
		alert("カテゴリ選択は必須です。以降は未選択でも検索できます。");
		return false;
	}
	req_ss_save('search','{"flag":"pd_search","cat":"'+cat+'","genre":"'+genre+'","maker":"'+maker+'","items":"'+items+'"}');
/* 	storage.setItem("search",'{"flag":"pd_search","cat":"'+cat+'","genre":"'+genre+'","maker":"'+maker+'","items":"'+items+'"}'); */
	$("#fw_cat").val("");
	$("#s_word").val("");
	if(location.pathname == '/search.php'){
		var result = pd_search(cat,genre,maker,items,null);
		$("#s_result .search_list").html(result);
		if($("#t_count").val()){
			if($("#t_count").val() == "0"){
				$(".search_result").html('該当する商品はありませんでした。')
			} else {
				$(".search_result").html($("#t_count").val()+'件該当しました。');
			}
		}

		moveToScroll($("#s_top"),300);
		$("img.lazy").lazyload();
		$("img.lazy").removeAttr("width");
		$("img.lazy").removeAttr("height");
	} else {
		location.href = "/search.php";
	}
})

// 検索ボタン（フリーワード）
$(document).on("click","#search_word",function(){
	var cat = $("#fw_cat").val();
	var word = $("#s_word").val();
	if(!cat && !word){
		alert("カテゴリを選択、または検索ワードを入力して検索をしてください");
		return false;
	}
	req_ss_save("search",'{"flag":"fw_search","cat":"'+cat+'","word":"'+word+'"}');
// 	storage.setItem("search",'{"flag":"fw_search","cat":"'+cat+'","word":"'+word+'"}');
	if(location.pathname == '/search.php'){
		var result = fw_search(cat,word,null);
		$("#s_result .search_list").html(result);
		console.debug($("#t_count").val());
		if($("#t_count").val()){
			if($("#t_count").val() == "0"){
				$(".search_result").html('該当する商品はありませんでした。<br><span class="well mtop10 well-sm center-block"><strong>検索のコツ</strong><br>・ストレージ容量やカラーを検索ワードに含めずにお試しください。</span>');
			} else {
				$(".search_result").html($("#t_count").val()+'件該当しました。');
			}
		}
		$("#s_cat").val("");
		genre_reset();
		maker_reset();
		item_reset();
		moveToScroll($("#s_top"),300);
		$("img.lazy").lazyload();
		$("img.lazy").removeAttr("width");
		$("img.lazy").removeAttr("height");
	} else {
		location.href = "/search.php";
	}
})

$(document).on("keypress","#s_word",function(e){


	if(e.keyCode == 13){
		var cat = $("#fw_cat").val();
		var word = $(this).val();
		if(cat || word){
			if(location.pathname == '/admin/get_create.php'){
				$("#get-create-fw").click();
				return false;
			}
			req_ss_save("search",'{"flag":"fw_search","cat":"'+cat+'","word":"'+word+'"}');
// 			storage.setItem("search",'{"flag":"fw_search","cat":"'+cat+'","word":"'+word+'"}');
			if(location.pathname == '/search.php'){
				var result = fw_search(cat,word,null);
				$("#s_result .search_list").html(result);

				if($("#t_count").val()){
					if($("#t_count").val() == "0"){
						$(".search_result").html('該当する商品はありませんでした。<br><span class="well mtop10 well-sm center-block"><strong>検索のコツ</strong><br>・ストレージ容量やカラーを検索ワードに含めずにお試しください。</span>');
					} else {
						$(".search_result").html($("#t_count").val()+'件該当しました。');
					}
				}
				$("#s_cat").val("");
				genre_reset();
				maker_reset();
				item_reset();
				moveToScroll($("#s_top"),300);
				$("img.lazy").lazyload();
				$("img.lazy").removeAttr("width");
				$("img.lazy").removeAttr("height");
			} else {
				location.href = "/search.php";
			}
		}
	}
})

$(document).on("click","#totop",function(){
	moveToScroll($("#s_top"),300);
})

$(document).ready(function(){
	var gtVal = getUrlVars();
	if(gtVal && gtVal["flag"] == 'fw_search'){
		if(gtVal["cat"] || gtVal["word"]){
			cat = gtVal["cat"] || '';
			word = gtVal["word"] || '';
			req_ss_save("search",'{"flag":"fw_search","cat":"'+cat+'","word":"'+word+'"}');
// 			storage.setItem("search",'{"flag":"fw_search","cat":"'+cat+'","word":"'+word+'"}');
		}
	} else if(gtVal && gtVal["flag"] == 'pd_search'){
		if(gtVal["cat"]){
			cat = gtVal["cat"] || '';
			genre = gtVal["genre"] || '';
			maker = gtVal["maker"] || '';
			items = gtVal["items"] || '';
			req_ss_save("search",'{"flag":"pd_search","cat":"'+cat+'","genre":"'+genre+'","maker":"'+maker+'","items":"'+items+'"}');
// 			storage.setItem("search",'{"flag":"pd_search","cat":"'+cat+'","genre":"'+genre+'","maker":"'+maker+'","items":"'+items+'"}');
		}
	}
	var ss_search = storage.getItem("search");
	var ss_obj = null;
	try {
		ss_obj = JSON.parse(ss_search);
	} catch(e){
		storage.removeItem('search');
		return true;
	}
	if(ss_obj){
		if(ss_obj.flag == 'fw_search'){
			$("#fw_cat").val(ss_obj.cat);
			$("#s_word").val(ss_obj.word);
			if(document.getElementById("s_result") && location.pathname == '/search.php'){
				var result = fw_search(ss_obj.cat,ss_obj.word,null);
				$("#s_result .search_list").html(result);
				moveToScroll($("#s_top"),300);
				$("img.lazy").lazyload();
				$("img.lazy").removeAttr("width");
				$("img.lazy").removeAttr("height");
			}
		} else if(ss_obj.flag == 'pd_search'){
			$("#s_cat").val(ss_obj.cat);
			if(ss_obj.genre){
				ch_category(ss_obj.cat,function(){
					$("#s_genre").val(ss_obj.genre);
					if(ss_obj.maker){
						ch_genre(ss_obj.cat,ss_obj.genre,function(){
							$("#s_maker").val(ss_obj.maker);
							if(ss_obj.items){
								ch_maker(ss_obj.cat,ss_obj.genre,ss_obj.maker,function(){
									$("#s_items").val(ss_obj.items);
								})
							} else {
								ch_maker(ss_obj.cat,ss_obj.genre,ss_obj.maker,null);
							}
						})
					} else {
						ch_genre(ss_obj.cat,ss_obj.genre,null);
					}
				})
			} else {
				ch_category(ss_obj.cat,null);
			}


/*

			$("#s_genre").val(ss_obj.genre);
			$("#s_maker").val(ss_obj.maker);
			$("#s_items").val(ss_obj.items);
*/
			if(document.getElementById("s_result") && location.pathname == '/search.php'){
				var result = pd_search(ss_obj.cat,ss_obj.genre,ss_obj.maker,ss_obj.items,null);
				$("#s_result .search_list").html(result);

				moveToScroll($("#s_top"),300);
				$("img.lazy").lazyload();
				$("img.lazy").removeAttr("width");
				$("img.lazy").removeAttr("height");
			}

		}
	}

	if($("#t_count").val()){
		if($("#t_count").val() == "0"){
			$(".search_result").html('該当する商品はありませんでした。<br><span class="well mtop10 well-sm center-block"><strong>検索のコツ</strong><br>・ストレージ容量やカラーを検索ワードに含めずにお試しください。</span>')
		} else {
			$(".search_result").html($("#t_count").val()+'件該当しました。');
		}
	}
	/* 	サジェスト検索	 */
/* 	if(document.getElementById("s_word")){ */
		$( "#s_word" ).autocomplete({
// 			appendTo:"#sug-list",
			source: function(request,response){
				s_data = {
					"flag":"sugest",
					"fw_cat":$("#fw_cat").val(),
					"term":request.term
					}
				var data = Array();
				$.ajax({
					type:"POST",
					url:"/script/ajaxcon_search.php",
					dataType:"json",
					data:s_data,
					async:false,
					success:function(r_data){
						var r = r_data;
						data = r_data;
						response(
							$.grep(data, function(value){
								return value;
								console.debug(value);
							})
						);
					}
				});
			},
			minLength: 2,		//サジェストが発動する最小文字数
			focus: function( event, ui ){

			},
			select: function( event, ui ) {
				var cat = $("#fw_cat").val();
				var word = ui.item.value;
				req_ss_save("search",'{"flag":"fw_search","cat":"'+cat+'","word":"'+word+'"}');
// 				storage.setItem("search",'{"flag":"fw_search","cat":"'+cat+'","word":"'+word+'"}');
				if(location.pathname == '/search.php'){
					var result = fw_search(cat,word,null);
					$("#s_result .search_list").html(result);

					if($("#t_count").val()){
						if($("#t_count").val() == "0"){
							$(".search_result").html('該当する商品はありませんでした。<br><span class="well mtop10 well-sm center-block"><strong>検索のコツ</strong><br>・ストレージ容量やカラーを検索ワードに含めずにお試しください。</span>')
						} else {
							$(".search_result").html($("#t_count").val()+'件該当しました。');
						}
					}
					$("#s_cat").val("");
					genre_reset();
					maker_reset();
					item_reset();
					moveToScroll($("#s_top"),300);
					$("img.lazy").lazyload();
					$("img.lazy").removeAttr("width");
					$("img.lazy").removeAttr("height");
				} else {
					if(location.pathname == '/admin/get_create.php'){
						$("#get-create-fw").click();
					} else {
						location.href = "/search.php";
					}
				}
			}
		});
// 	}
	/* 	サジェスト検索	 */

	$("img.lazy").lazyload();
	$("img.lazy").removeAttr("width");
	$("img.lazy").removeAttr("height");

	$(window).scroll(function(){
		var trg = $("#s_result");
		if(trg && $("#s_result .search_list div").length != 0 && document.getElementById("s_trg")){
			// 引き金となる要素の位置を取得
			var triggerNodePosition = $("#s_trg").offset().top - $(window).height();
			// 現在のスクロール位置が引き金要素の位置より下にあれば‥
			if ($(window).scrollTop() > triggerNodePosition) {
				var last_li = document.getElementById( "s_trg" ).previousElementSibling;
				var last_con = $(last_li).attr("data-rcon");
				var s_txt = storage.getItem("search");
				try{
					var s_obj = JSON.parse(s_txt);
					var result = '';
					if(s_obj.flag == 'fw_search'){
						result = fw_search(s_obj.cat,s_obj.word,parseInt(last_con)+1);
					} else if(s_obj.flag == 'pd_search'){
						result = pd_search(s_obj.cat,s_obj.genre,s_obj.maker,s_obj.items,parseInt(last_con)+1);
					}
					$("#s_trg").remove();

					$("#s_result .search_list").append(result);
					$("img.lazy").lazyload();
					$("img.lazy").removeAttr("width");
					$("img.lazy").removeAttr("height");
				} catch(e){
					return false;
				}
			}
		}

	})
});
