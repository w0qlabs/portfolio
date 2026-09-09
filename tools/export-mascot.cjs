/* Export the production mascot timeline. Development tools only: playwright, gifenc, pngjs.
 * Start the site locally, then run: node tools/export-mascot.cjs [http://127.0.0.1:8765]
 */
const { chromium } = require('playwright');
const { GIFEncoder, quantize, applyPalette } = require('gifenc');
const { PNG } = require('pngjs');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const url = process.argv[2] || 'http://127.0.0.1:8765';
const width = 560;
const height = 600;
const fps = 25;
const launchAt = 2.4;

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(url);
    const markup = await page.evaluate(() => {
      const lab = document.querySelector('[data-rocket-system]');
      lab.rocketController?.destroy();
      // GSAP's SVG origin metadata must not seed a second controller with sampled live transforms.
      lab.querySelectorAll('.rocket-wrap, .rocket-wrap *').forEach(element => {
        element.removeAttribute('style');
        if (element.hasAttribute('data-svg-origin')) {
          element.removeAttribute('data-svg-origin');
          element.removeAttribute('transform');
        }
      });
      return ['.rocket-wrap', '.rocket-smoke', '.launch-control', '.rocket-status']
        .map(selector => lab.querySelector(selector).outerHTML).join('\n');
    });
    const css = fs.readFileSync(path.join(root, 'css/style.css'), 'utf8');
    const script = fs.readFileSync(path.join(root, 'js/rocket-motion.js'), 'utf8');
    // A fresh document uses the same markup and controller, without the page's other animations.
    const document = `<!doctype html><html><head><base href="${url}/">
      <style>${css}
        html, body { background: transparent; margin: 0; min-width: 0; }
        .launch-lab { width: ${width}px; height: ${height}px; max-width: none; margin: 0;
          aspect-ratio: auto; justify-self: start; border: 0; background: none; box-shadow: none; }
        .launch-lab::after, .launch-control, .rocket-status { display: none; }
        .rocket-wrap { width: 78%; left: 10%; top: 2%; }
      </style></head><body><div class="launch-lab" data-rocket-system>${markup}</div>
      <script src="https://cdn.jsdelivr.net/npm/gsap@3.12.7/dist/gsap.min.js"></script>
      <script>${script}</script></body></html>`;
    await page.route(url + '/__mascot-export', route => route.fulfill({ body: document, contentType: 'text/html' }));
    await page.goto(url + '/__mascot-export', { waitUntil: 'networkidle' });
    await page.evaluate(async () => {
      const sources = new Set([...document.querySelectorAll('svg image')].map(image => image.href.baseVal));
      await Promise.all([...sources].map(async src => {
        const image = new Image(); image.src = src; await image.decode();
      }));
      gsap.globalTimeline.getChildren(false, true, true).forEach(tween => tween.startTime(tween.delay()));
      gsap.globalTimeline.time(0, true);
      gsap.ticker.sleep();
    });
    const duration = await page.evaluate(() => gsap.getById('rocket-launch').duration());
    const frames = Math.round((launchAt + duration) * fps) + 1;
    const gif = GIFEncoder();
    let palette;
    let transparentIndex;
    for (let frame = 0; frame < frames; frame++) {
      await page.evaluate(({ time, launchNow }) => {
        gsap.globalTimeline.time(time, false);
        if (launchNow) document.querySelector('[data-rocket-system]').rocketController.launch();
        gsap.ticker.sleep();
        const root = document.querySelector('.rocket-flame-root');
        const tail = document.querySelector('.rocket-flame');
        const body = document.querySelector('.mascot-body');
        const join = new DOMPoint(0, 120);
        const a = join.matrixTransform(root.getScreenCTM());
        const b = join.matrixTransform(tail.getScreenCTM());
        const nozzle = new DOMPoint(0, 0).matrixTransform(root.getScreenCTM());
        const ship = new DOMPoint(772, 669).matrixTransform(body.getScreenCTM());
        if (Math.hypot(a.x - b.x, a.y - b.y) > 0.1 || Math.hypot(nozzle.x - ship.x, nozzle.y - ship.y) > 0.1) {
          throw new Error('Flame attachment failed at ' + time + 's: collar or tail moved off its joint.');
        }
      }, { time: frame / fps, launchNow: frame === Math.round(launchAt * fps) });
      const png = PNG.sync.read(await page.screenshot({
        clip: { x: 0, y: 0, width, height }, omitBackground: true,
      }));
      if (frame === 0) {
        const pixels = png.data.filter((value, index) => index % 4 === 3 && value > 0).length;
        if (!pixels) throw new Error('Empty render: ' + JSON.stringify(await page.evaluate(() =>
          [...document.querySelectorAll('.launch-lab, .rocket-wrap, .rocket-scroll, .rocket-flight, .rocket-depth, .rocket-float, .rocket')]
            .map(e => ({name:e.className.baseVal ?? e.className, rect:e.getBoundingClientRect().toJSON(), opacity:getComputedStyle(e).opacity, visibility:getComputedStyle(e).visibility, transform:getComputedStyle(e).transform}))
        )));
      }
      // GIF supports binary alpha. Keep one palette across the cycle to avoid color shimmer.
      for (let i = 3; i < png.data.length; i += 4) {
        png.data[i] = png.data[i] < 128 ? 0 : 255;
        if (!png.data[i]) png.data[i - 3] = png.data[i - 2] = png.data[i - 1] = 0;
      }
      if (!palette) {
        palette = quantize(png.data, 256, { format: 'rgba4444', oneBitAlpha: true });
        transparentIndex = palette.findIndex(color => color[3] === 0);
        if (transparentIndex < 0) throw new Error('Export is missing transparent background.');
      }
      const index = applyPalette(png.data, palette, 'rgba4444');
      gif.writeFrame(index, width, height, {
        palette: frame === 0 ? palette : undefined,
        transparent: true, transparentIndex, dispose: 2, delay: 1000 / fps, repeat: 0,
      });
      if (frame % fps === 0) console.log(`Rendered ${frame}/${frames} frames`);
    }
    if (errors.length) throw new Error(errors.join('\n'));
    gif.finish();
    const destination = path.join(root, 'assets/img/mascot/monkey-rocket.gif');
    fs.writeFileSync(destination, gif.bytes());
    console.log(`Saved ${destination} (${frames} frames, ${width} x ${height}, ${fps} fps)`);
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
