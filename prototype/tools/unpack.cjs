// Desempaqueta un export de Claude Design (HTML "bundler") en sus archivos.
// Uso: node prototype/tools/unpack.cjs <carpeta-con-un-solo-.html> <carpeta-de-salida>
// Cada página anidada es a su vez un bundle: correr de nuevo sobre el .html extraído.
// Salida: _template.html (página raíz), <uuid>.html|.js|.css|.font (recursos).
const fs = require('fs'), zlib = require('zlib'), path = require('path');
const [, , dir, out] = process.argv;
const fn = fs.readdirSync(dir).find((n) => n.endsWith('.html'));
const html = fs.readFileSync(path.join(dir, fn), 'utf8');
function block(t) {
  const open = '<script type="__bundler/' + t + '">';
  const i = html.lastIndexOf(open);
  if (i < 0) return null;
  const start = i + open.length;
  const end = html.indexOf('</script>', start);
  return html.slice(start, end).trim();
}
const manifest = JSON.parse(block('manifest'));
const template = JSON.parse(block('template'));
const order = JSON.parse(block('page_order') || '[]');
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, '_template.html'), template);
fs.writeFileSync(path.join(out, '_order.json'), JSON.stringify(order));
for (const [id, e] of Object.entries(manifest)) {
  let b = Buffer.from(e.data, 'base64');
  if (e.compressed) b = zlib.gunzipSync(b);
  const m = e.mime || '';
  const ext = m.includes('javascript') ? '.js' : m.includes('css') ? '.css' : m.includes('html') ? '.html' : m.includes('font') ? '.font' : '.bin';
  fs.writeFileSync(path.join(out, id + ext), b);
  console.log(id, m, b.length);
}
