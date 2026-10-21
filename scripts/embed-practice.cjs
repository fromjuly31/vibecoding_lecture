// Keep the download a single offline HTML while editing practice sources separately.
const fs = require('node:fs');
const assert = require('node:assert/strict');
let html = fs.readFileSync('index.html', 'utf8');
function replace(re, value) {
  assert(re.test(html), 'Missing embed marker: ' + re);
  html = html.replace(re, () => value);
}
const read = name => fs.readFileSync('assets/practice/' + name, 'utf8');
for (const [kind, id] of [['uiux', 'practice-source'], ['animation', 'animation-source']]) {
  let source = read(kind + '.html');
  if (kind === 'uiux') {
    source = source.replace('/* RESPONSIVE_DEMO */', () => read('responsive.js'));
    source = source.replace('/* RESPONSIVE_PREVIEW */""', () => JSON.stringify(read('responsive-preview.html')).replace(/</g, '\\u003c'));
  }
  source = source.replace('<body>', '<body data-practice-kind="' + kind + '">');
  source = source.replace('</head>', '<style id="practice-layout-style">\n' + read('typography.css') + '\n' + read('layout.css') + '\n' + read('activities.css') + '\n' + read('animation-scroll.css') + '\n' + read('buttons.css') + '</style>\n</head>');
  source = source.replace('</body>', '<script id="practice-layout-script">\n' + read('frame.js') + '</script>\n</body>');
  for (const match of source.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)) new Function(match[1]);
  const re = new RegExp('<script type="application/json" id="' + id + '">[\\s\\S]*?<\\/script>');
  const previous = JSON.parse(html.match(re)[0].replace(/^[^>]*>/, '').replace(/<\/script>$/, ''));
  replace(re, '<script type="application/json" id="' + id + '">' + JSON.stringify({...previous, html: source}).replace(/</g, '\\u003c') + '</script>');
}
const style = '<style id="practice-focus-style">\n' + read('shell.css') + '\n' + read('buttons.css') + '</style>';
if (html.includes('id="practice-focus-style"')) replace(/<style id="practice-focus-style">[\s\S]*?<\/style>/, style);
else html = html.replace('</head>', style + '\n</head>');
const script = '<script id="practice-focus-script">\n' + read('shell.js') + '</script>';
new Function(read('shell.js'));
// Put this before the main script so ORIGINAL_HTML also captures it for offline export.
html = html.replace(/<script id="practice-focus-script">[\s\S]*?<\/script>\s*/, '');
assert(html.includes('<script>'), 'Missing main script');
html = html.replace('<script>', () => script + '\n<script>');
new Function(read('export.js'));
replace(/function exportHTML\(\)\{[\s\S]*?\nfunction buildPrint\(/, read('export.js').trim() + '\nfunction buildPrint(');
replace(/(<button data-command="html">)[^<]*(<\/button>)/, '<button data-command="html">강의 + 실습 HTML 다운로드</button>');
fs.writeFileSync('index.html', html);
console.log('Embedded both practice pages and fullscreen layout.');
