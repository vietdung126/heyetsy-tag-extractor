const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/extract-tags', async (req, res) => {
  const listingURL = req.query.url;

  if (!listingURL) {
    return res.status(400).send({ error: 'Missing ?url= parameter' });
  }

  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.goto(listingURL, { waitUntil: 'networkidle2', timeout: 0 });

    // Wait for the copy-to-clipboard button to appear
    await page.waitForSelector('button[onclick*="clipboard.writeText"]');

    const tags = await page.evaluate(() => {
      const button = document.querySelector('button[onclick*="clipboard.writeText"]');
      if (!button) return null;

      const onclickText = button.getAttribute('onclick') || button.getAttribute('@click');
      const match = onclickText.match(/writeText\('([^']+)'\)/);
      return match ? match[1].split(',') : [];
    });

    await browser.close();

    res.send({ tags });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).send({ error: 'Failed to extract tags' });
  }
});

app.get('/', (req, res) => {
  res.send('Use /extract-tags?url=https://...')
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
