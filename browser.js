var xhr = require('xhr');
var has = require('has');

var h = require('virtual-dom/h');
var main = require('main-loop');
var state = {
    current: Number(location.pathname.slice(1) || '0') || 0,
    slides: []
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
        state.slides.push(part);
        loop.update(state);
    });
});

function render (state) {
    if (!has(state.slides, state.current)) return empty();
    var txt = state.slides[state.current];
    var lines = txt.split('\n');
    return h('pre.slide', [
        lines.map(function (line) {
            var incode = false;
            if (/^```/.test(line)) incode = !incode;
            if (!incode && /^#/.test(line)) {
                return h('span', { 'font-color': 'purple' }, line + '\n');
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
        show(slides.length - 1);
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
}
