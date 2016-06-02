var xhr = require('xhr');
var has = require('has');
var url = require('url');

var h = require('virtual-dom/h');
var main = require('main-loop');
var state = {
    current: Number(location.pathname.slice(1) || '0') || 0,
    slides: [],
    svgs: {},
    loops: []
};
var loop = main(state, render, require('virtual-dom'));
document.body.appendChild(loop.target);

function onresize () {
    document.body.style.fontSize = (Number(window.innerWidth) / 40) + 'px';
}
window.addEventListener('resize', onresize);
onresize();

xhr('/slides.md', function (err, res, body) {
    var parts = body.toString().split('\n---\n');
    parts.forEach(function (part) {
        state.slides.push(part.trim());
        loop.update(state);
    });
});

function loadsvg (src) {
    var href = url.resolve(location.protocol + '//' + location.host, src);
    for (var i = 0; i < state.loops.length; i++) {
        clearInterval(state.loops[i]);
    }
    state.loops.splice(0);
    var iv = setInterval(loop, 100);
    state.loops.push(iv);
    return h('iframe', { src: href }); // haha onload right
    
    function loop () {
        var frame = document.querySelector('iframe');
        if (!frame) return;
        var win = frame.contentWindow;
        if (!win) return;
        var doc = win.document;
        if (!doc) return;
        if (doc.readyState !== 'complete'
        && doc.readyState !== 'interactive') return;
        if (!doc.querySelector('svg')) return;
        if (!doc.querySelector('svg').style) return;
        clearInterval(iv);
        onload(frame);
    }
    
    function onload (frame) {
        window.scrollTo(0, 0);
        window.iframe = frame;
        window.iwin = frame.contentWindow;
        window.idoc = frame.contentWindow.document;
        var svg = window.idoc.querySelector('svg');
        window.svg = svg;
        svg.style.margin = 'auto';
        frameresize();
        window.addEventListener('resize', frameresize);
        
        function frameresize () {
            var istyle = window.getComputedStyle(frame);
            var svgstyle = window.getComputedStyle(svg);
            var wd = parseInt(svgstyle.width) - parseInt(istyle.width);
            var hd = parseInt(svgstyle.width) - parseInt(istyle.height);
            if (wd > hd) { // wider
                var z = parseInt(istyle.height) / parseInt(svgstyle.width)
                    * parseInt(istyle.width) / parseInt(svgstyle.height)
                    * 0.4
                ;
                svg.style.zoom = z;
            }
            else { // taller
                var z = parseInt(istyle.width) / parseInt(svgstyle.height)
                    * parseInt(istyle.height) / parseInt(svgstyle.width)
                    * 0.4
                ;
                svg.style.zoom = z;
            }
        }
    }
}

function render (state) {
    if (!has(state.slides, state.current)) return empty();
    var txt = state.slides[state.current];
    var lines = txt.split(/(<script[^>]*>[\s\S]*?<\/script[^>]*>)|\n/i);
    return h('pre.slide', [
        lines.map(function (line, ix) {
            if (!line && !lines[ix+1]) return h('div.break', [' '])
            else if (!line) return ''
            var incode = false, m;
            if (/^```/.test(line)) incode = !incode;
            if (/^<script/i.test(line)) {
                return h('script', line
                    .replace(/^<script[^>]*>/i, '')
                    .replace(/<\/script[^>]*>$/i, '')
                );
            }
            else if (!incode && /^#/.test(line)) {
                return h('span', { 'font-color': 'purple' }, line + '\n');
            }
            else if (m = /^\[([^\]]+)\]\(([^\)]+)\)/.exec(line)) {
                return h('a', { href: m[2] }, m[1]);
            }
            else if (m = /^!\[([^\]]+)\]\(([^\)]+)\)/.exec(line)) {
                if (/\.svg$/.test(m[2]) && has(state.svgs, m[2])) {
                    return state.svgs[m[2]];
                }
                else if (/\.svg$/.test(m[2])) {
                    return loadsvg(m[2]);
                }
                else return h('img', {
                    src: m[2],
                    style: 'max-width: 100%; max-height: 100%'
                });
            }
            else return h('span', line + '\n');
        })
    ]);
}

function empty () { return h('div', []) }

window.addEventListener('keydown', function (ev) {
    if (ev.keyCode === 37) { // left
        show(state.current - 1);
    }
    else if (ev.keyCode === 39) { // right
        show(state.current + 1);
    }
    else if (ev.keyCode === 48 || ev.keyCode === 36) { // 0 or home
        show(0);
    }
    else if ((ev.keyCode === 52 && ev.shiftKey) // $
    || ev.keyCode === 35) { // end
        show(state.slides.length - 1);
    }
});

window.addEventListener('popstate', function (ev) {
    var n = Number(location.pathname.slice(1) || '0') || 0;
    show(n);
});

function show (n) {
    n = Math.max(0, n) % state.slides.length;
    state.current = n;
    window.history.pushState(null, String(n), '/' + n);
    loop.update(state);
    window.scrollTo(0, 0);
}
