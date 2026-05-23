import { chromium } from 'playwright';
import fs from 'fs';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();
  
  // Capture API responses
  page.on('response', async (res) => {
    const url = res.url();
    if (url.includes('.json') || url.includes('api') || url.includes('graphql')) {
      console.log(`[API] ${url}`);
      try {
        const text = await res.text();
        if (text.includes('Parkside') || text.includes('PARKSIDE')) {
          console.log(`>>> Found Parkside in ${url} (length: ${text.length})`);
          fs.writeFileSync('flyer_api_response.json', text);
        }
      } catch (e) {}
    }
  });

  const url = 'https://www.lidl.cz/l/cs/letak/online-lidl-cz-magazin-kveten-11-5-24-5-2026/view/flyer/page/4';
  await page.goto(url, { waitUntil: 'networkidle' });
  
  try {
    await page.click('button:has-text("SOUHLASÍM")', { timeout: 5000 });
  } catch (e) {}

  await page.waitForTimeout(5000);
  
  const html = await page.content();
  fs.writeFileSync('leaflet.html', html);
  console.log(`HTML saved to leaflet.html. Size: ${html.length}`);

  await browser.close();
}

main().catch(console.error);
