import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  });

  console.log("Navigating to Copart public search...");
  const resp = await page.goto("https://www.copart.com/public/data/lotdetails/solr/lotSearch", {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  }).catch((e) => {
    console.log("Nav 1 failed:", e.message);
    return null;
  });
  console.log("Status:", resp?.status());

  console.log("\nTrying main search page instead...");
  const resp2 = await page.goto("https://www.copart.com/lotSearchResults/?free=true", {
    waitUntil: "networkidle",
    timeout: 45000,
  }).catch((e) => {
    console.log("Nav 2 failed:", e.message);
    return null;
  });
  console.log("Status:", resp2?.status());

  await page.waitForTimeout(3000);
  const title = await page.title();
  console.log("Page title:", title);

  const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 500));
  console.log("Body text sample:", bodyText);

  const lotCount = await page.locator("[class*='lot'], [data-uname*='lot']").count().catch(() => -1);
  console.log("Elements matching lot-ish selectors:", lotCount);

  await page.screenshot({ path: "copart-test.png", fullPage: false });
  console.log("Screenshot saved.");

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
