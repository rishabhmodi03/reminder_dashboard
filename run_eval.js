const puppeteer = require('puppeteer');
(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('http://localhost:3001');
    const content = await page.content();
    console.log(content.includes('Dashboard') ? 'Dashboard renders.' : 'Dashboard failed.');
    await browser.close();
})();
