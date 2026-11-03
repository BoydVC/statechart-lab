import { mkdirSync } from "node:fs";
import { chromium } from "playwright-core";

const base = process.env.GALLERY_URL ?? "http://127.0.0.1:4173/";
mkdirSync("screenshots", { recursive: true });

const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

const desktop = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await desktop.goto(base, { waitUntil: "networkidle" });
await desktop.waitForSelector("article h2");
const body = await desktop.locator("body").innerText();
if (!body.includes("VIOLATION") || !body.includes("PASS")) {
  throw new Error("gallery did not render pass and violation cards");
}
for (const banned of ["PowerSchool student", "@chrisalexboyd", "kid"]) {
  if (body.toLowerCase().includes(banned.toLowerCase())) throw new Error(`unexpected text: ${banned}`);
}
await desktop.screenshot({ path: "screenshots/gallery.png" });
for (let frame = 0; frame < 6; frame += 1) {
  await desktop.click("#theme");
  await desktop.waitForTimeout(250);
  const card = desktop.locator("article.violation").nth(frame % 4);
  if (await card.count()) await card.scrollIntoViewIfNeeded();
  await desktop.screenshot({ path: `/tmp/lab-frame-${frame}.png` });
}
await desktop.close();

const phone = await browser.newPage({ viewport: { width: 375, height: 812 } });
await phone.goto(base, { waitUntil: "networkidle" });
await phone.waitForSelector("article.violation");
await phone.locator("article.violation").first().scrollIntoViewIfNeeded();
await phone.screenshot({ path: "screenshots/phone-375.png" });
const width = await phone.evaluate(() => document.documentElement.clientWidth);
if (width !== 375) throw new Error(`expected a 375px viewport, got ${width}`);
await browser.close();
console.log("screenshots ready");
