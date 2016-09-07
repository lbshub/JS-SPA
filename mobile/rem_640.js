// 设计宽度为750 则 num = 750
// 设计宽度为640 则 num = 640
(function(document, window) {
    var d = document,
        doc = d.documentElement,
        isIOS = navigator.userAgent.match(/iphone|ipod|ipad/gi),
        dpr = isIOS ? Math.min(window.devicePixelRatio, 3) : 1,
        resizeEvt = 'orientationchange' in window ? 'orientationchange' : 'resize';
    doc.dataset.dpr = dpr;
    var recalc = function() {
        var width = doc.clientWidth,
            num = 640;
        if (width / dpr > num) width = num * dpr;
        doc.style.fontSize = 100 * (width / num) + 'px';
    };
    recalc();
    if (!d.addEventListener) return;
    window.addEventListener(resizeEvt, recalc, false);
})(document, window);