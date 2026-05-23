import { chromium, Browser, BrowserContext } from 'playwright';

export class BrowserPool {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;

  async init() {
    console.log('[BrowserPool] Launching browser...');
    this.browser = await chromium.launch({ headless: true });
    this.context = await this.browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 720 },
    });
  }

  async fetchHtml(url: string): Promise<string> {
    if (!this.context) throw new Error('BrowserPool not initialized');
    
    console.log(`[BrowserPool] Fetching ${url}`);
    const page = await this.context.newPage();
    
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      
      // Attempt to dismiss cookie banner on lidl if present
      try {
        await page.click('button:has-text("SOUHLASÍM"), button:has-text("Accept All"), button:has-text("Zustimmen")', { timeout: 2000 });
      } catch (e) {
        // Banner not found or already dismissed
      }

      // Wait a bit for dynamic content / anti-bot challenges
      await page.waitForTimeout(2000);
      
      const content = await page.content();
      return content;
    } finally {
      await page.close();
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.context = null;
    }
  }
}
