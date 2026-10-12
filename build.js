// Creative Digital Story: static site builder.
// Reads markdown posts from posts/, writes the finished site to dist/.
// Run: npm run build

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');

const ROOT = __dirname;
const OUT = path.join(ROOT, 'dist');
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'site.config.json'), 'utf8'));
const IMG_DIR = path.join(ROOT, 'static', 'images');
const products = JSON.parse(fs.readFileSync(path.join(ROOT, 'products.json'), 'utf8'));

const SECTIONS = [
  { name: 'Behind the Build', slug: 'behind-the-build', tone: 'blush',
    blurb: 'How each blog, tool and product actually got made, with the real prompts, screenshots and setbacks.' },
  { name: 'AI Tools', slug: 'ai-tools', tone: 'cocoa',
    blurb: 'Plain-English walkthroughs of the tools that do the heavy lifting, written for people who do not code.' },
  { name: 'Income Experiments', slug: 'income-experiments', tone: 'sand',
    blurb: 'What I tried, what it cost, and what it earned. Honest numbers, including the flops.' },
  { name: 'Playbooks', slug: 'playbooks', tone: 'rose',
    blurb: 'Step-by-step plans for Etsy, Pinterest, Threads, print on demand and digital products.' },
];
const sectionByName = Object.fromEntries(SECTIONS.map(s => [s.name, s]));

// ---------- helpers ----------
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fmtDate = d => new Date(d + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const isoDate = d => (d instanceof Date ? d.toISOString().slice(0, 10) : String(d));
const imgExists = p => p && fs.existsSync(path.join(IMG_DIR, path.basename(p)));
const relImg = p => 'images/' + path.basename(p);
const pad = n => String(n).padStart(2, '0');
// Internal links written as /slug become relative slug.html; outside links open in a new tab.
function fixLinks(html) {
  return html
    .replace(/href="\/(?!\/)([^"#]*)(#[^"]*)?"/g, (m, p, hash = '') => {
      const clean = p.replace(/\/$/, '');
      const target = !clean ? 'index.html' : /\.[a-z]+$/i.test(clean) ? clean : clean + '.html';
      return `href="${target}${hash}"`;
    })
    .replace(/<a href="(https?:\/\/[^"]+)"/g, '<a href="$1" target="_blank" rel="noopener"');
}

// ---------- load posts ----------
const allPosts = fs.readdirSync(path.join(ROOT, 'posts'))
  .filter(f => f.endsWith('.md'))
  .map(f => {
    const raw = fs.readFileSync(path.join(ROOT, 'posts', f), 'utf8');
    const { data, content } = matter(raw);
    const date = isoDate(data.date);
    const slug = data.slug || f.replace(/\.md$/, '').replace(/^\d{4}-\d{2}-\d{2}-/, '');
    if (!sectionByName[data.category]) throw new Error(`${f}: category must be one of ${SECTIONS.map(s => s.name).join(', ')}`);
    // Drop photo spots whose image has not been uploaded yet, and make image paths relative.
    let body = content.replace(/^!\[([^\]]*)\]\(([^)]+)\)\s*$/gm, (m, alt, src) =>
      imgExists(src) ? `![${alt}](${relImg(src)})` : '');
    let html = marked.parse(body);
    html = fixLinks(html);
    const words = body.split(/\s+/).filter(Boolean).length;
    return { ...data, date, slug, html, words, minutes: Math.max(1, Math.round(words / 230)), section: sectionByName[data.category], file: f };
  })
  .sort((a, b) => a.date.localeCompare(b.date) || (a.order || 0) - (b.order || 0) || a.file.localeCompare(b.file));
// Drafts (draft: true) get a private preview page but stay off every list, the sitemap and RSS.
const drafts = allPosts.filter(p => p.draft === true);
const posts = allPosts.filter(p => p.draft !== true);
posts.forEach((p, i) => (p.no = i + 1));
drafts.forEach((p, i) => (p.no = posts.length + 1 + i));
const newestFirst = [...posts].reverse();

// ---------- styles ----------
const CSS = `
/* Layout: a maker's notebook. Wide masthead, single reading column, entries listed like a build log. */
:root{
  --cream:#FBF5EE; --paper:#FFFCF8; --ink:#3B2A21; --muted:#86705F; --line:#EBDDD2;
  --blush:#EDBDBF; --blush-soft:#F8E4E2; --brown:#7A4A2E; --brown-ink:#5E3720;
  --tone-blush:#F3CFCD; --tone-cocoa:#D9BFAE; --tone-sand:#EFE0C9; --tone-rose:#E9C2C6;
  --display:"Fraunces", Georgia, "Times New Roman", serif;
  --body:"Nunito", "Segoe UI", system-ui, sans-serif;
  --mono:"DM Mono", ui-monospace, "SFMono-Regular", Menlo, monospace;
  color-scheme:light;
}
@media (prefers-color-scheme: dark){ :root:not([data-theme="light"]){
  --cream:#221814; --paper:#2C201A; --ink:#F2E5DC; --muted:#BBA393; --line:#45332A;
  --blush:#E3AEB2; --blush-soft:#3A2824; --brown:#E0AE8C; --brown-ink:#F0C7A9;
  --tone-blush:#4A3130; --tone-cocoa:#4A3529; --tone-sand:#463A2A; --tone-rose:#4B3034; color-scheme:dark; } }
:root[data-theme="dark"]{
  --cream:#221814; --paper:#2C201A; --ink:#F2E5DC; --muted:#BBA393; --line:#45332A;
  --blush:#E3AEB2; --blush-soft:#3A2824; --brown:#E0AE8C; --brown-ink:#F0C7A9;
  --tone-blush:#4A3130; --tone-cocoa:#4A3529; --tone-sand:#463A2A; --tone-rose:#4B3034; color-scheme:dark; }
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--cream);color:var(--ink);font:400 1.0625rem/1.7 var(--body);padding-inline:clamp(16px,4vw,40px)}
img{max-width:100%;height:auto;display:block}
a{color:var(--brown);text-decoration-color:var(--blush);text-decoration-thickness:2px;text-underline-offset:3px}
a:hover{color:var(--brown-ink);text-decoration-color:var(--brown)}
a:focus-visible,button:focus-visible,input:focus-visible{outline:2px solid var(--brown);outline-offset:3px;border-radius:4px}
.wrap{max-width:1080px;margin-inline:auto}
.read{max-width:680px;margin-inline:auto}
h1,h2,h3{font-family:var(--display);font-weight:500;line-height:1.15;text-wrap:balance;color:var(--ink);letter-spacing:-.01em}
.label{font:500 .72rem/1.2 var(--mono);letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}

/* masthead */
.top{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:8px 20px;padding-block:14px;border-bottom:1px solid var(--line)}
.top .shop{font:600 .85rem var(--body);text-decoration:none;padding:6px 14px;border-radius:999px;background:var(--blush);color:#3B2A21}
.top .shop:hover{background:var(--brown);color:var(--paper)}
.mast{padding-block:28px 18px;text-align:left}
.mast a{text-decoration:none;color:inherit}
.wordmark{font-family:var(--display);font-size:clamp(2.2rem,7vw,4.4rem);line-height:1;margin:0;font-weight:400;font-variation-settings:"SOFT" 100,"WONK" 1}
.wordmark em{font-style:italic;color:var(--brown)}
.tagline{margin:10px 0 0;color:var(--muted);font-size:1rem}
nav.sections{display:flex;flex-wrap:wrap;gap:6px 22px;padding-block:12px;border-block:1px solid var(--line);margin-bottom:8px}
nav.sections a{text-decoration:none;color:var(--ink);font-weight:600;font-size:.95rem}
nav.sections a[aria-current]{color:var(--brown);text-decoration:underline;text-decoration-color:var(--blush)}

/* home lead */
.lead{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);gap:clamp(20px,4vw,48px);align-items:center;padding-block:36px}
.lead h2{font-size:clamp(1.8rem,4.4vw,2.9rem);margin:10px 0 12px}
.lead h2 a{color:inherit;text-decoration:none}
.lead p{margin:0 0 16px;color:var(--muted)}
.btn{display:inline-block;font:700 .92rem var(--body);padding:11px 20px;border-radius:999px;background:var(--brown);color:var(--paper);text-decoration:none}
.btn:hover{background:var(--brown-ink);color:var(--paper)}
@media (max-width:760px){.lead{grid-template-columns:1fr}}

/* covers */
.cover{aspect-ratio:3/2;max-width:100%;border-radius:6px;overflow:hidden;position:relative;background:var(--tone-blush)}
.cover img{width:100%;height:100%;object-fit:cover}
.cover.t-cocoa{background:var(--tone-cocoa)} .cover.t-sand{background:var(--tone-sand)} .cover.t-rose{background:var(--tone-rose)}
.cover .gen{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:space-between;padding:clamp(16px,4%,28px)}
.cover .gen .no{font:400 clamp(3rem,10vw,6rem)/.9 var(--display);color:var(--brown);font-variation-settings:"SOFT" 100}
.cover .gen .t{font:500 clamp(1rem,2.4vw,1.35rem)/1.25 var(--display);color:var(--ink);max-width:22ch}

/* log list */
.log{padding-block:8px 40px}
.log h2.h{font-size:1.5rem;margin:0 0 6px}
.entry{display:grid;grid-template-columns:4.5rem minmax(0,1fr) auto;gap:4px 18px;align-items:baseline;padding-block:18px;border-top:1px solid var(--line)}
.entry:last-child{border-bottom:1px solid var(--line)}
.entry .no{font:400 1.8rem/1 var(--display);color:var(--brown)}
.entry h3{margin:0 0 4px;font-size:1.3rem}
.entry h3 a{color:inherit;text-decoration:none}
.entry h3 a:hover{color:var(--brown)}
.entry p{margin:0;color:var(--muted);font-size:.97rem}
.entry .meta{white-space:nowrap}
@media (max-width:600px){.entry{grid-template-columns:3rem minmax(0,1fr)}.entry .meta{grid-column:2;white-space:normal}}

/* sections strip */
.shelf{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:0;border-top:1px solid var(--line);margin-block:10px 40px}
.shelf a{display:block;padding:20px 20px 22px 0;text-decoration:none;color:inherit;border-bottom:1px solid var(--line)}
.shelf a:hover h3{color:var(--brown)}
.shelf h3{margin:8px 0 6px;font-size:1.25rem}
.shelf p{margin:0;color:var(--muted);font-size:.95rem}
.dot{display:inline-block;width:.7rem;height:.7rem;border-radius:50%;background:var(--tone-blush);vertical-align:middle}
.dot.t-cocoa{background:var(--tone-cocoa)}.dot.t-sand{background:var(--tone-sand)}.dot.t-rose{background:var(--tone-rose)}

/* article */
.post-head{padding-block:34px 18px}
.post-head h1{font-size:clamp(2rem,5.4vw,3.2rem);margin:12px 0 12px}
.post-head .sub{font:400 1.2rem/1.5 var(--display);font-style:italic;color:var(--muted);margin:0 0 18px}
.byline{display:flex;flex-wrap:wrap;gap:6px 16px;align-items:center}
.tools{display:flex;flex-wrap:wrap;gap:6px;margin-top:14px;align-items:center}
.chip{font:500 .74rem var(--mono);letter-spacing:.04em;padding:4px 10px;border-radius:999px;border:1px solid var(--line);background:var(--paper);color:var(--ink)}
.post-cover{margin-block:8px 30px}
.prose{font-size:1.09rem}
.prose h2{font-size:1.75rem;margin:2.2em 0 .5em}
.prose h3{font-size:1.3rem;margin:1.8em 0 .4em}
.prose p,.prose ul,.prose ol{margin:0 0 1.15em}
.prose li{margin-bottom:.4em}
.prose li::marker{color:var(--brown)}
.prose strong{color:var(--ink);font-weight:700}
.prose em:first-child:last-child{color:var(--muted)}
.prose blockquote{margin:1.6em 0;padding:4px 0 4px 20px;border-left:3px solid var(--blush);font:400 1.2rem/1.5 var(--display);font-style:italic}
.prose img{border-radius:6px;margin-block:1.6em .4em}
.prose code{font:500 .88em var(--mono);background:var(--blush-soft);padding:1px 6px;border-radius:4px}
.prose pre{background:var(--paper);border:1px solid var(--line);border-radius:6px;padding:16px;overflow-x:auto;font:500 .85rem/1.6 var(--mono);white-space:pre-wrap}
.prose pre code{background:none;padding:0}
.prose hr{border:0;border-top:1px solid var(--line);margin:2.4em 0}
.table-wrap{overflow-x:auto;margin-bottom:1.2em}
.prose table{border-collapse:collapse;width:100%;font-size:.95rem}
.prose th,.prose td{text-align:left;padding:8px 10px;border-bottom:1px solid var(--line);vertical-align:top}
.prose th{font:500 .74rem var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}

/* product + newsletter */
.product{margin-block:40px;padding:24px;border-radius:8px;background:var(--blush-soft);border:1px solid var(--blush)}
.product h3{margin:6px 0 8px;font-size:1.4rem}
.product p{margin:0 0 16px}
.news{margin-block:48px;padding:clamp(22px,4vw,36px);border-radius:8px;background:var(--paper);border:1px solid var(--line)}
.news h2{margin:6px 0 8px;font-size:1.6rem}
.news p{margin:0 0 16px;color:var(--muted)}
.news form{display:flex;flex-wrap:wrap;gap:10px}
.news input[type=email]{flex:1 1 220px;min-width:0;font:1rem var(--body);padding:11px 14px;border-radius:999px;border:1px solid var(--line);background:var(--cream);color:var(--ink)}
.news button{font:700 .95rem var(--body);padding:11px 22px;border-radius:999px;border:0;background:var(--brown);color:var(--paper);cursor:pointer}
.news button:hover{background:var(--brown-ink)}
.news .ok{margin:12px 0 0;color:var(--brown);font-weight:600}
.hp{position:absolute;left:-9999px}
.related{padding-block:10px 20px}
.pinsave{margin-block:36px;text-align:center}
.pinsave img{max-width:340px;width:100%;margin:12px auto 14px;border-radius:8px;box-shadow:0 6px 24px rgba(59,42,33,.12)}
.pinsave h2{font-size:1.4rem;margin:4px 0 0}
.pinsave p{margin:4px 0 14px;color:var(--muted)}

/* home hero */
.hero{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.05fr);gap:clamp(22px,4vw,56px);align-items:center;padding-block:clamp(28px,5vw,56px) 36px}
.hero h1{font-size:clamp(2.1rem,5.2vw,3.5rem);margin:12px 0 16px}
.hero h1 em{color:var(--brown);font-style:italic}
.hero p{margin:0 0 14px;color:var(--ink);font-size:1.08rem;max-width:52ch}
.hero .ctas{display:flex;flex-wrap:wrap;gap:10px;margin-top:22px}
.btn.ghost{background:transparent;color:var(--brown);border:1.5px solid var(--brown)}
.btn.ghost:hover{background:var(--brown);color:var(--paper)}
.hero-img{aspect-ratio:4/3;border-radius:14px;overflow:hidden;background:linear-gradient(140deg,var(--blush-soft),var(--tone-blush) 55%,var(--tone-cocoa));position:relative}
.hero-img img{width:100%;height:100%;object-fit:cover}
.hero-img .ph{position:absolute;inset:0;display:flex;align-items:flex-end;padding:clamp(18px,4%,30px)}
.hero-img .ph span{font:italic 400 clamp(1.3rem,3vw,1.9rem)/1.2 var(--display);color:var(--brown-ink);max-width:16ch}
@media (max-width:820px){.hero{grid-template-columns:1fr}.hero-img{order:-1}}
.band{padding-block:34px 10px;border-top:1px solid var(--line)}
.band-head{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:baseline;gap:8px 20px;margin-bottom:18px}
.band-head h2{font-size:clamp(1.5rem,3.4vw,2rem);margin:6px 0 0}
.band-head a{font-weight:700;font-size:.95rem}
.pillars{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin-bottom:30px}
.pillars div{background:var(--paper);border:1px solid var(--line);border-radius:10px;padding:20px}
.pillars h3{font-size:1.2rem;margin:6px 0 6px}
.pillars p{margin:0;color:var(--muted);font-size:.96rem}

/* products */
.feature{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.2fr);gap:0;border-radius:12px;overflow:hidden;border:1px solid var(--blush);background:var(--blush-soft);margin-bottom:34px}
.feature .art{min-height:220px;background:linear-gradient(150deg,var(--tone-blush),var(--tone-cocoa));display:flex;align-items:flex-end;padding:24px}
.feature .art img{width:100%;height:100%;object-fit:cover}
.feature .art.has-img{padding:0}
.feature .art span{font:400 clamp(1.6rem,3.6vw,2.4rem)/1.1 var(--display);color:var(--brown-ink);font-variation-settings:"SOFT" 100}
.feature .txt{padding:clamp(22px,4vw,36px)}
.feature h3{font-size:clamp(1.4rem,3vw,1.9rem);margin:8px 0 10px}
.feature p{margin:0 0 18px}
@media (max-width:760px){.feature{grid-template-columns:1fr}}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:18px;margin-bottom:34px}
.card{display:flex;flex-direction:column;background:var(--paper);border:1px solid var(--line);border-radius:12px;overflow:hidden}
.card .art{aspect-ratio:5/2;background:var(--tone-blush);display:flex;align-items:flex-end;padding:18px}
.card .art img{width:100%;height:100%;object-fit:cover}
.card .art.has-img{padding:0;aspect-ratio:1/1}
.card .art span{font:400 1.45rem/1.15 var(--display);color:var(--brown-ink);font-variation-settings:"SOFT" 100}
.card .art.t-cocoa{background:var(--tone-cocoa)}.card .art.t-sand{background:var(--tone-sand)}.card .art.t-rose{background:var(--tone-rose)}
.card .body{padding:18px 18px 20px;display:flex;flex-direction:column;flex:1}
.card h3{font-size:1.2rem;margin:6px 0 8px}
.card p{margin:0 0 16px;color:var(--muted);font-size:.95rem;flex:1}
.card .btn{align-self:flex-start;padding:9px 18px;font-size:.88rem}

/* blog filters */
.filters{display:flex;flex-wrap:wrap;gap:8px;margin:4px 0 22px}
.filters a{font:600 .88rem var(--body);text-decoration:none;padding:7px 14px;border-radius:999px;border:1px solid var(--line);background:var(--paper);color:var(--ink)}
.filters a:hover,.filters a[aria-current]{background:var(--blush);border-color:var(--blush);color:#3B2A21}

/* plain pages + footer */
.page{padding-block:34px 20px}
.page h1{font-size:clamp(2rem,5vw,3rem);margin:0 0 18px}
footer{border-top:1px solid var(--line);margin-top:30px;padding-block:28px 40px;color:var(--muted);font-size:.92rem}
footer .cols{display:flex;flex-wrap:wrap;justify-content:space-between;gap:16px}
footer nav{display:flex;flex-wrap:wrap;gap:6px 18px}
footer a{color:var(--muted)}
@media (prefers-reduced-motion:no-preference){a,.btn,.news button{transition:color .15s,background-color .15s}}
`;

// ---------- page shell ----------
const analytics = cfg.cloudflareAnalyticsToken
  ? `<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token":"${esc(cfg.cloudflareAnalyticsToken)}"}'></script>` : '';

function shell({ title, description, file, current, body, ogImage, jsonld, type = 'website', noindex = false }) {
  const canonical = `${cfg.url}/${file === 'index.html' ? '' : file.replace(/\.html$/, '')}`;
  const nav = [['index.html', 'Home', 'home'], ['blog.html', 'Blog', 'blog'], ['shop.html', 'Shop', 'shop'], ['about.html', 'About', 'about']]
    .map(([href, label, key]) => `<a href="${href}"${current === key ? ' aria-current="page"' : ''}>${label}</a>`).join('');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${canonical}">${noindex ? '\n<meta name="robots" content="noindex, nofollow">' : ''}
<meta property="og:type" content="${type}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:site_name" content="${esc(cfg.title)}">
${ogImage ? `<meta property="og:image" content="${cfg.url}/${ogImage}">\n<meta name="twitter:card" content="summary_large_image">` : '<meta name="twitter:card" content="summary">'}
<link rel="alternate" type="application/rss+xml" title="${esc(cfg.title)}" href="feed.xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Fraunces:ital,opsz,wght,SOFT,WONK@0,9..144,300..700,0..100,0..1;1,9..144,300..700,0..100,0..1&family=Nunito:ital,wght@0,400;0,600;0,700;1,400&display=swap">
<style>${CSS}</style>
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>` : ''}
${analytics}
</head>
<body>
<div class="wrap">
<div class="top"><span class="label">A build log by ${esc(cfg.author)}</span><a class="shop" href="${cfg.shopUrl}" target="_blank" rel="noopener">Shop the guides</a></div>
<header class="mast"><a href="index.html"><p class="wordmark">Creative <em>Digital</em> Story</p></a><p class="tagline">${esc(cfg.tagline)}</p></header>
<nav class="sections" aria-label="Main">${nav}</nav>
</div>
<main>
${body}
</main>
<div class="wrap"><footer><div class="cols">
<div>© ${new Date().getFullYear()} ${esc(cfg.title)}.<br>Written with AI help, edited and tested by a human.</div>
<nav aria-label="Footer"><a href="blog.html">Blog</a><a href="shop.html">Shop</a><a href="about.html">About</a><a href="disclosure.html">Disclosure</a><a href="privacy.html">Privacy</a><a href="feed.xml">RSS</a></nav>
</div></footer></div>
<script>
document.querySelectorAll('form[data-netlify]').forEach(function(f){f.addEventListener('submit',function(e){
  if(location.hostname.indexOf('netlify')<0 && location.hostname.indexOf(${JSON.stringify(cfg.url.replace(/^https?:\/\//, ''))})<0){e.preventDefault();var ok=f.parentNode.querySelector('.ok');if(ok)ok.hidden=false;f.reset();}
});});
</script>
</body>
</html>`;
}

// ---------- components ----------
function cover(p, big) {
  if (imgExists(p.cover)) return `<div class="cover t-${p.section.tone}"><img src="${relImg(p.cover)}" alt="${esc(p.cover_alt || p.title)}"${big ? '' : ' loading="lazy"'}></div>`;
  return `<div class="cover t-${p.section.tone}" role="img" aria-label="${esc(p.title)}"><div class="gen"><span class="no">${pad(p.no)}</span><span class="t">${esc(p.title)}</span></div></div>`;
}
const entryLine = p => `<article class="entry">
<span class="no">${pad(p.no)}</span>
<div><h3><a href="${p.slug}.html">${esc(p.title)}</a></h3><p>${esc(p.subtitle || p.description)}</p></div>
<span class="label meta"><span class="dot t-${p.section.tone}"></span> ${p.section.name} · ${p.minutes} min</span>
</article>`;

const newsletter = () => `<section class="news" aria-labelledby="news-h">
<span class="label">Every Saturday</span>
<h2 id="news-h">${esc(cfg.newsletterName)}</h2>
<p>One new build log a week, plus the prompts and tools behind it. No hype, no get-rich-quick promises.</p>
<form name="saturday-build" method="POST" data-netlify="true" netlify-honeypot="company" action="thanks.html">
<input type="hidden" name="form-name" value="saturday-build">
<p class="hp"><label>Leave this empty <input name="company" tabindex="-1" autocomplete="off"></label></p>
<label class="hp" for="email">Email address</label>
<input id="email" type="email" name="email" placeholder="Your email address" required autocomplete="email">
<button type="submit">Join the list</button>
</form>
<p class="ok" hidden>Thank you, you're on the list.</p>
</section>`;

function productBox(p) {
  if (!p.product) return '';
  const pr = p.product;
  return `<aside class="product" aria-label="Related guide">
<span class="label">Go further</span>
<h3>${esc(pr.name)}</h3>
<p>${esc(pr.blurb)}</p>
<a class="btn" href="${esc(pr.url || cfg.shopUrl)}" target="_blank" rel="noopener">${esc(pr.cta || 'See the guide')}</a>
</aside>`;
}

const TONES = ['blush', 'cocoa', 'sand', 'rose'];
const prodArt = (pr, cls) => imgExists(pr.image)
  ? `<div class="art has-img ${cls || ''}"><img src="${relImg(pr.image)}" alt="${esc(pr.name)} cover" loading="lazy"></div>`
  : `<div class="art ${cls || ''}" aria-hidden="true"><span>${esc(pr.name)}</span></div>`;
const featureCard = pr => `<article class="feature">${prodArt(pr)}<div class="txt"><span class="label">Featured ${esc(pr.type || '').toLowerCase()}</span>
<h3>${esc(pr.name)}</h3><p>${esc(pr.blurb)}</p><a class="btn" href="${esc(pr.url)}" target="_blank" rel="noopener">${esc(pr.cta || 'See it')}</a></div></article>`;
const productCard = (pr, i) => `<article class="card">${prodArt(pr, 't-' + TONES[i % 4])}<div class="body"><span class="label">${esc(pr.type || 'Guide')}</span>
<h3>${esc(pr.name)}</h3><p>${esc(pr.blurb)}</p><a class="btn" href="${esc(pr.url)}" target="_blank" rel="noopener">${esc(pr.cta || 'See it')}</a></div></article>`;
const featured = products.find(p => p.featured) || products[0];
const others = products.filter(p => p !== featured);
const filterBar = cur => `<nav class="filters" aria-label="Topics"><a href="blog.html"${cur === 'all' ? ' aria-current="page"' : ''}>All posts</a>${SECTIONS.map(s => `<a href="${s.slug}.html"${cur === s.slug ? ' aria-current="page"' : ''}>${s.name}</a>`).join('')}</nav>`;

function pinBlock(p) {
  if (!imgExists(p.pin_image)) return '';
  const url = `${cfg.url}/${p.slug}`, media = `${cfg.url}/${relImg(p.pin_image)}`;
  const desc = p.pin_description || p.description || p.title;
  const href = `https://www.pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&media=${encodeURIComponent(media)}&description=${encodeURIComponent(desc)}`;
  return `<aside class="pinsave" aria-label="Save to Pinterest"><span class="label">Save this for later</span>
<h2>${esc(p.pin_title || p.title)}</h2>
<img src="${relImg(p.pin_image)}" alt="${esc(p.pin_alt || p.pin_title || p.title)}" loading="lazy" data-pin-description="${esc(desc)}">
<p>Pin it to your Pinterest board so you can come back to it.</p>
<a class="btn" href="${href}" target="_blank" rel="noopener">Save to Pinterest</a></aside>`;
}

// ---------- write pages ----------
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'images'), { recursive: true });
if (fs.existsSync(IMG_DIR)) for (const f of fs.readdirSync(IMG_DIR)) fs.copyFileSync(path.join(IMG_DIR, f), path.join(OUT, 'images', f));
const write = (f, html) => fs.writeFileSync(path.join(OUT, f), html);

// Home
{
  const hero = `<section class="hero">
<div><span class="label">Hi, I'm ${esc(cfg.author)}</span>
<h1>Building an income stream with <em>AI</em>, one small system at a time</h1>
<p>I'm a mom in my 30s building a little online business, so I can spend more of my days with my kid. AI does a lot of the heavy lifting: my blogs draft their own posts, and my guides and courses are built with Claude.</p>
<p>This is where I show exactly how it all works, mistakes included.</p>
<div class="ctas"><a class="btn" href="blog.html">Read the blog</a><a class="btn ghost" href="shop.html">Shop the guides</a></div></div>
<div class="hero-img">${imgExists('home-hero.jpg') ? `<img src="images/home-hero.jpg" alt="A hand holding a cup of coffee next to an open laptop on a cream desk">` : `<div class="ph"><span>Built with AI, edited by a human.</span></div>`}</div>
</section>`;
  const pillars = `<div class="pillars">
<div><span class="label">01</span><h3>Blogs that draft themselves</h3><p>Scheduled AI tasks research and write each post. I review, edit and publish.</p></div>
<div><span class="label">02</span><h3>Products made with AI</h3><p>Interactive guides, trackers and courses, built with Claude from plain-language ideas.</p></div>
<div><span class="label">03</span><h3>Honest, step by step</h3><p>No get-rich-quick promises. Just the real setup, so you can build your own.</p></div>
</div>`;
  const latest = newestFirst.slice(0, 3);
  const body = `<div class="wrap">${hero}
<section class="band" aria-labelledby="what-h"><div class="band-head"><div><span class="label">What I build</span><h2 id="what-h">A business that runs around family life</h2></div></div>${pillars}</section>
<section class="band" aria-labelledby="feat-h"><div class="band-head"><div><span class="label">New</span><h2 id="feat-h">Start with the course</h2></div><a href="shop.html">See everything in the shop</a></div>${featureCard(featured)}</section>
<section class="band" aria-labelledby="log-h"><div class="band-head"><div><span class="label">Every Saturday</span><h2 id="log-h">Latest from the blog</h2></div><a href="blog.html">All posts</a></div>
<div class="log" style="padding-top:0">${latest.map(entryLine).join('\n') || '<p class="label">The first post lands on Saturday.</p>'}</div></section>
<section class="band" aria-labelledby="shop-h"><div class="band-head"><div><span class="label">The shop</span><h2 id="shop-h">Guides and courses</h2></div><a href="shop.html">See all ${products.length}</a></div>
<div class="grid">${others.slice(0, 3).map(productCard).join('')}</div></section>
<div class="read">${newsletter()}</div></div>`;
  write('index.html', shell({ title: `${cfg.title}: ${cfg.tagline}`, description: 'A mom building an income stream with AI: blogs that draft themselves, digital products made with Claude, and the honest steps behind them.', file: 'index.html', current: 'home', body,
    jsonld: { '@context': 'https://schema.org', '@type': 'Blog', name: cfg.title, url: cfg.url, description: cfg.tagline } }));
}

// Blog page
{
  const body = `<div class="wrap"><div class="page"><span class="label">The blog</span><h1>All posts</h1><p class="tagline" style="max-width:60ch">A new post every Saturday on how I run my business with AI. Pick a topic or scroll the whole log.</p></div>
${filterBar('all')}
<section class="log" style="padding-top:0">${newestFirst.map(entryLine).join('\n')}</section>
<div class="read">${newsletter()}</div></div>`;
  write('blog.html', shell({ title: `Blog | ${cfg.title}`, description: 'Every post on building a small online business with AI: tools, behind the scenes, income experiments and playbooks.', file: 'blog.html', current: 'blog', body }));
}

// Shop page
{
  const body = `<div class="wrap"><div class="page"><span class="label">The shop</span><h1>Guides, courses and tools</h1><p class="tagline" style="max-width:60ch">Everything I make is built with AI and tested by me. Each one opens on my Beacons shop, where you can see the details and buy securely.</p></div>
${featureCard(featured)}
<div class="grid">${others.map(productCard).join('')}</div>
<p class="label" style="margin-bottom:30px">Prices and full details are on each product page.</p>
<div class="read">${newsletter()}</div></div>`;
  write('shop.html', shell({ title: `Shop | ${cfg.title}`, description: 'Digital guides, courses and tools by Creative Digital Story, all built with AI.', file: 'shop.html', current: 'shop', body }));
}

// Section pages
for (const s of SECTIONS) {
  const list = newestFirst.filter(p => p.section === s);
  const body = `<div class="wrap"><div class="page"><span class="label"><span class="dot t-${s.tone}"></span> Section</span><h1>${s.name}</h1><p class="tagline" style="max-width:60ch">${s.blurb}</p></div>
${filterBar(s.slug)}
<section class="log" style="padding-top:0">${list.map(entryLine).join('\n') || '<p>The first entry in this section lands on a Saturday soon.</p>'}</section>
<div class="read">${newsletter()}</div></div>`;
  write(`${s.slug}.html`, shell({ title: `${s.name} | ${cfg.title}`, description: s.blurb, file: `${s.slug}.html`, current: 'blog', body }));
}

// Posts (and private draft previews)
for (const p of [...posts, ...drafts]) {
  const related = newestFirst.filter(q => q !== p && q.section === p.section).concat(newestFirst.filter(q => q !== p && q.section !== p.section)).slice(0, 3);
  const tools = (p.tools || []).length ? `<div class="tools"><span class="label">Built with</span>${p.tools.map(t => `<span class="chip">${esc(t)}</span>`).join('')}</div>` : '';
  const html = p.html.replace(/<table>/g, '<div class="table-wrap"><table>').replace(/<\/table>/g, '</table></div>');
  const banner = p.draft ? `<div class="read" style="margin-top:20px;padding:12px 16px;border-radius:8px;background:var(--blush-soft);border:1px solid var(--blush);font-weight:600">Draft preview: only people with this link can see it. It is not on the home page, blog or search engines yet.</div>` : '';
  const body = `<article>${banner}
<div class="wrap"><header class="post-head read">
<span class="label"><span class="dot t-${p.section.tone}"></span> Entry No. ${pad(p.no)} · <a href="${p.section.slug}.html">${p.section.name}</a></span>
<h1>${esc(p.title)}</h1>
${p.subtitle ? `<p class="sub">${esc(p.subtitle)}</p>` : ''}
<div class="byline label"><span>By ${esc(cfg.author)}</span><span>${fmtDate(p.date)}</span><span>${p.minutes} min read</span></div>
${tools}
</header>
<div class="post-cover">${cover(p, true)}</div>
<div class="read prose">${html}</div>
<div class="read">${pinBlock(p)}${productBox(p)}${newsletter()}
${related.length ? `<section class="related"><h2 style="font-size:1.4rem;margin:0 0 4px">Keep reading</h2>${related.map(entryLine).join('')}</section>` : ''}
</div></div></article>`;
  write(`${p.slug}.html`, shell({ title: `${p.title} | ${cfg.title}`, description: p.description, file: `${p.slug}.html`, current: 'blog', body, type: 'article', noindex: !!p.draft,
    ogImage: imgExists(p.cover) ? relImg(p.cover) : null,
    jsonld: { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: p.title, description: p.description, datePublished: p.date,
      author: { '@type': 'Person', name: 'Vallari Gadre' }, publisher: { '@type': 'Organization', name: cfg.brand },
      keywords: (p.tags || []).join(', '), mainEntityOfPage: `${cfg.url}/${p.slug}` } }));
}

// Plain pages from pages/*.md
const pagesDir = path.join(ROOT, 'pages');
for (const f of fs.readdirSync(pagesDir).filter(f => f.endsWith('.md'))) {
  const { data, content } = matter(fs.readFileSync(path.join(pagesDir, f), 'utf8'));
  const slug = f.replace(/\.md$/, '');
  const html = fixLinks(marked.parse(content));
  const body = `<div class="wrap"><div class="page read"><h1>${esc(data.title)}</h1><div class="prose">${html}</div>${slug === 'about' ? newsletter() : ''}</div></div>`;
  write(`${slug}.html`, shell({ title: `${data.title} | ${cfg.title}`, description: data.description || cfg.tagline, file: `${slug}.html`, current: slug, body }));
}

// Sitemap, robots, RSS
const urls = ['', 'blog', 'shop', ...SECTIONS.map(s => s.slug), 'about', ...posts.map(p => p.slug)];
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `<url><loc>${cfg.url}/${u}</loc></url>`).join('\n')}\n</urlset>\n`);
write('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${cfg.url}/sitemap.xml\n`);
write('feed.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>${esc(cfg.title)}</title><link>${cfg.url}</link><description>${esc(cfg.tagline)}</description>\n${newestFirst.map(p => `<item><title>${esc(p.title)}</title><link>${cfg.url}/${p.slug}</link><guid>${cfg.url}/${p.slug}</guid><pubDate>${new Date(p.date + 'T03:30:00Z').toUTCString()}</pubDate><description>${esc(p.description)}</description></item>`).join('\n')}\n</channel></rss>\n`);

console.log(`Built home, blog, shop, ${posts.length} posts, ${drafts.length} drafts, ${SECTIONS.length} sections into dist/`);
