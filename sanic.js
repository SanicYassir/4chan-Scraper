const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
puppeteer.use(StealthPlugin());

// Configuration
const BASE_URL = 'https://boards.4channel.org';
const DOWNLOAD_DIR = path.join(__dirname, '4chan_downloads');
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36';

// Ensure download directory exists
const ensureDir = async (dir) => {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }
};

// Delay helper
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Download single image with proper headers
const downloadImage = async (url, destPath, referer) => {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      headers: {
        'Referer': referer,
        'User-Agent': USER_AGENT,
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8'
      },
      maxRedirects: 5,
      timeout: 30000
    });

    await fs.writeFile(destPath, response.data);
    return true;
  } catch (err) {
    console.error(`Download failed for ${url}:`, err.message);
    return false;
  }
};

// Main scraping function
const scrapePage = async (thread, pageNumber, retries = 3) => {
  const pageUrl = `${BASE_URL}/${thread}/${pageNumber === 1 ? '' : pageNumber}`;
  const saveDir = path.join(DOWNLOAD_DIR, thread, `page_${pageNumber}_${Date.now()}`);
  
  await ensureDir(saveDir);
  console.log(`🌐 Scraping: ${pageUrl}`);

  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security'
    ]
  });

  const page = await browser.newPage();
  await page.setUserAgent(USER_AGENT);
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'en-US,en;q=0.9'
  });

  try {
    // Block unnecessary resources
    await page.setRequestInterception(true);
    page.on('request', req => {
      if (['image', 'stylesheet', 'font', 'media'].includes(req.resourceType())) {
        req.abort();
      } else {
        req.continue();
      }
    });

    await page.goto(pageUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    // Wait for thumbnails to load
    await page.waitForSelector('a.fileThumb', { timeout: 10000 });
    await delay(2000 + Math.random() * 3000);

    // Extract image URLs
    const imageUrls = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a.fileThumb'))
        .map(el => {
          const href = el.href.startsWith('//') ? `https:${el.href}` : el.href;
          return href.replace('//s.', '//i.'); // Get full-size images
        });
    });

    if (imageUrls.length === 0) {
      throw new Error('No images found - possible board restrictions');
    }

    console.log(`📸 Found ${imageUrls.length} images`);

    // Download each image
    for (const [index, url] of imageUrls.entries()) {
      const filename = url.split('/').pop();
      const filePath = path.join(saveDir, filename);
      
      console.log(`⬇️ Downloading (${index + 1}/${imageUrls.length}): ${filename}`);
      const success = await downloadImage(url, filePath, pageUrl);
      
      if (success) {
        console.log(`✅ Saved: ${filename}`);
      } else if (retries > 0) {
        console.log(`🔄 Retrying download...`);
        await delay(3000);
        await downloadImage(url, filePath, pageUrl);
      }
      
      await delay(1000 + Math.random() * 2000); // Random delay
    }

  } catch (error) {
    console.error(`❌ Error on page ${pageNumber}:`, error.message);
    if (retries > 0) {
      console.log(`🔄 Retrying page... (${retries} attempts left)`);
      await delay(5000);
      return scrapePage(thread, pageNumber, retries - 1);
    }
  } finally {
    await browser.close();
  }
};

// CLI Handling
const main = async () => {
  const args = process.argv.slice(2);
  if (args.length < 2 || !['f1', 'f10'].includes(args[0])) {
    console.log(`
Usage: node 4chan_downloader.js [mode] [thread] [page]
Modes:
  f1    - Download single page
  f10   - Download first 10 pages

Examples:
  node 4chan_downloader.js f10 wg
  node 4chan_downloader.js f1 b 3
    `);
    process.exit(1);
  }

  const [mode, thread, page] = args;
  await ensureDir(DOWNLOAD_DIR);

  try {
    if (mode === 'f10') {
      console.log(`🚀 Downloading first 10 pages of /${thread}/`);
      for (let i = 1; i <= 10; i++) {
        await scrapePage(thread, i);
        await delay(3000); // Delay between pages
      }
    } else {
      const pageNum = parseInt(page) || 1;
      console.log(`🚀 Downloading page ${pageNum} of /${thread}/`);
      await scrapePage(thread, pageNum);
    }
  } catch (error) {
    console.error('💥 error:', error);
  } finally {
    console.log('🏁 All downloads completed!');
    process.exit();
  }
};

main();