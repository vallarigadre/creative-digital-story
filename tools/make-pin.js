// Makes a 1000 x 1500 Pinterest image for a post: the tall cover photo as the
// background, with the pin title written on a soft cream band at the top.
// Saves it as static/images/<slug>-pin.jpg, which the site then shows in the
// "Save this for later" box at the end of the post.
//
// Usage: node tools/make-pin.js            (every post that has a tall cover)
//        node tools/make-pin.js <slug> ... (only those posts)
// Needs Playwright with Chromium (preinstalled in Claude's workspace).

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const matter = require('gray-matter');

function loadPlaywright() {
  try { return require('playwright'); } catch (e) {}
  const root = execSync('npm root -g').toString().trim();
  return require(path.join(root, 'playwright'));
}

const ROOT = path.join(__dirname, '..');
const IMG = path.join(ROOT, 'static', 'images');
const FONTS = path.join(__dirname, 'pin-fonts');
const font = f => 'data:font/woff2;base64,' + fs.readFileSync(path.join(FONTS, f)).toString('base64');
const esc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;');

function page(p, photo) {
  const title = p.pin_title || p.title;
  const size = title.length > 70 ? 66 : title.length > 50 ? 76 : 88;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:F;src:url(${font('fraunces-latin-600-normal.woff2')});font-weight:600}
@font-face{font-family:F;src:url(${font('fraunces-latin-400-italic.woff2')});font-style:italic}
@font-face{font-family:M;src:url(${font('dm-mono-latin-500-normal.woff2')})}
@font-face{font-family:N;src:url(${font('nunito-latin-700-normal.woff2')});font-weight:700}
*{box-sizing:border-box;margin:0}
body{width:1000px;height:1500px;position:relative;overflow:hidden;background:#FBF5EE}
.bg{position:absolute;inset:0;background:url(${photo}) center/cover no-repeat}
.fade{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(251,245,238,.97) 0%,rgba(251,245,238,.93) 34%,rgba(251,245,238,0) 58%)}
.top{position:absolute;left:80px;right:80px;top:90px;text-align:center}
.label{font:500 22px/1 M;letter-spacing:.22em;text-transform:uppercase;color:#7A4A2E}
.rule{width:70px;height:3px;background:#EDBDBF;margin:26px auto 30px;border-radius:2px}
h1{font:600 ${size}px/1.08 F;color:#3B2A21;letter-spacing:-.01em}
.sub{font:italic 400 34px/1.3 F;color:#86705F;margin-top:24px}
.foot{position:absolute;left:0;right:0;bottom:70px;text-align:center}
.pill{display:inline-block;background:#FBF5EE;color:#5E3720;font:700 26px N;padding:16px 34px;border-radius:999px;box-shadow:0 6px 24px rgba(59,42,33,.18)}
</style></head><body><div class="bg"></div><div class="fade"></div>
<div class="top"><p class="label">Creative Digital Story</p><div class="rule"></div><h1>${esc(title)}</h1>${p.pin_subtitle ? `<p class="sub">${esc(p.pin_subtitle)}</p>` : ''}</div>
<div class="foot"><span class="pill">creativedigitalstory.netlify.app</span></div></body></html>`;
}

(async () => {
  const want = process.argv.slice(2);
  const posts = fs.readdirSync(path.join(ROOT, 'posts')).filter(f => f.endsWith('.md')).map(f => {
    const { data } = matter(fs.readFileSync(path.join(ROOT, 'posts', f), 'utf8'));
    return { ...data, slug: data.slug || f.replace(/\.md$/, '').replace(/^\d{4}-\d{2}-\d{2}-/, '') };
  }).filter(p => want.length ? want.includes(p.slug) : p.cover_shape === 'tall');
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch(fs.existsSync('/opt/pw-browsers/chromium') ? {} : {});
  const tab = await browser.newPage({ viewport: { width: 1000, height: 1500 } });
  for (const p of posts) {
    const cover = path.join(IMG, path.basename(p.cover || ''));
    if (!p.cover || !fs.existsSync(cover)) { console.log(`skip ${p.slug}: cover photo not uploaded yet`); continue; }
    const photo = 'data:image/jpeg;base64,' + fs.readFileSync(cover).toString('base64');
    await tab.setContent(page(p, photo), { waitUntil: 'load' });
    await tab.evaluate(() => document.fonts.ready);
    const out = path.join(IMG, `${p.slug}-pin.jpg`);
    await tab.screenshot({ path: out, type: 'jpeg', quality: 85 });
    console.log(`made ${path.relative(ROOT, out)}`);
  }
  await browser.close();
})();
