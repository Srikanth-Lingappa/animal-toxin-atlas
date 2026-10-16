// Browser smoke test: the page loads, every tab renders without errors, nothing overflows on a phone-width
// screen, and a few headline numbers equal an independent recomputation (scripts/recompute_stats.py).
//
//   npm install            (puppeteer)
//   python scripts/recompute_stats.py --out stats.json
//   node tests/smoke.js [index.html] [stats.json]
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const page = path.resolve(process.argv[2] || 'index.html');
const stats = JSON.parse(fs.readFileSync(process.argv[3] || 'stats.json', 'utf8'));
const fmt = n => n.toLocaleString('en-US');
// data-tab values in the header (src/html/header.html)
const TABS = ['organism', 'taxon', 'disulfides', 'who', 'convergence', 'search', 'insights', 'stats', 'about'];
const wait = ms => new Promise(r => setTimeout(r, ms));
let failures = 0;
const check = (ok, msg) => { console.log((ok ? 'ok   ' : 'FAIL ') + msg); if (!ok) failures++; };

(async () => {
  const browser = await puppeteer.launch({
    headless: 'shell', args: ['--no-sandbox'],
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
  });
  for (const [name, width] of [['desktop', 1300], ['phone', 390]]) {
    const pg = await browser.newPage();
    await pg.setViewport({ width, height: 900 });
    const errors = [];
    pg.on('pageerror', e => errors.push(String(e)));
    await pg.goto('file://' + page);
    await wait(2500);

    const total = await pg.$eval('#aboutTotal', e => e.textContent);
    check(total === '8,274', `${name}: record count is ${total}`);

    const probe = () => pg.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      badText: /\bNaN\b|undefined|\bnull\b|Infinity/.test(document.body.innerText),
    }));
    let p = await probe();
    check(p.overflow <= 0 && !p.badText, `${name}: browse view`);
    for (const t of TABS) {
      const found = await pg.evaluate(t => { const b = document.querySelector('[data-tab=' + t + ']'); if (b) b.click(); return !!b; }, t);
      check(found, `${name}: tab button "${t}" exists`);
      await wait(600);
      if (t === 'stats') {
        for (const sub of ['overview', 'seq']) {
          await pg.evaluate(s => document.querySelector('[data-ssub=' + s + ']').click(), sub);
          await wait(500);
          p = await probe();
          check(p.overflow <= 0 && !p.badText, `${name}: statistics / ${sub}`);
        }
      } else {
        p = await probe();
        check(p.overflow <= 0 && !p.badText, `${name}: ${t}`);
      }
    }
    if (name === 'desktop') {
      await pg.evaluate(() => document.querySelector('[data-tab=disulfides]').click());
      await wait(500);
      const ds = await pg.$eval('#dsPatternCount', e => e.textContent);
      check(ds.includes(fmt(stats.ds.fullyPairedEntries)) && ds.includes(String(stats.ds.patterns)),
        `disulfide header "${ds}" matches ${stats.ds.patterns} patterns / ${stats.ds.fullyPairedEntries} toxins`);
      await pg.evaluate(() => document.querySelector('[data-tab=stats]').click());
      await wait(400);
      await pg.evaluate(() => document.querySelector('[data-ssub=seq]').click());
      await wait(600);
      const pl = await pg.$eval('#subPl', e => e.textContent);
      check(pl.includes(fmt(stats.plmodels)), `pLDDT card "${pl}" matches ${stats.plmodels} models`);
      await pg.evaluate(() => document.querySelector('[data-tab=insights]').click());
      await wait(500);
      const k = await pg.$$eval('#gapKpis .kpi', els => els.map(e => e.innerText.replace(/\n/g, ' ')));
      check(k[0].startsWith(String(stats.gaps_n)), `structural gaps: "${k[0]}" matches ${stats.gaps_n} families`);
    }
    const real = errors.filter(e => !/ERR_|Failed to load resource/.test(e));
    check(real.length === 0, `${name}: no page errors ${real.join('; ')}`);
    await pg.close();
  }
  await browser.close();
  console.log(failures ? `${failures} check(s) failed` : 'all checks passed');
  process.exit(failures ? 1 : 0);
})();
