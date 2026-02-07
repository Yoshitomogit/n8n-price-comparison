$(function (){
    // 2重送信防止
    $('form:not([allowSecondTry], [target=_blank])').submit(function(){
        $(this).find('input[type=button], input[type=submit], button').prop("disabled", true);
        $(this).find('a').removeAttr("href").removeAttr("onclick").prop("tabindex", '-1');
    });

    //親要素へイベントを伝搬させない
    $('[stopPropagation]').click(function(e){
        e.stopPropagation();
    });

    // selectタグのreadonly
    $("select[readonly] > option:not(:selected)").attr('disabled', 'disabled');
})

// bfcache対策
window.onbeforeunload = function() {
};
window.onunload = function() {
};
window.addEventListener("pageshow", function(event){
    if (event.persisted) {
        window.location.reload();
    }
});

// ajax通信時にcsrfトークンを付与
$.ajaxSetup({
    headers: {
        'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
    }
});

function sendGAEvent(event) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
        event: 'ga_event',
        ga_event_name: event
    })
}
