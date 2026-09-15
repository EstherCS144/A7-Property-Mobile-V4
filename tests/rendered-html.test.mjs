import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { getUpcomingViewingDates, isViewingDatePast, viewingDateBadge } from "../lib/viewing-dates.ts";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the A7 Property discovery homepage", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>A7 Property — Find a place you can call home<\/title>/i);
  assert.match(html, /Find a home that feels/);
  assert.match(html, /visible verification status/i);
  assert.match(html, /Ask A7/i);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("public pages keep the baseline accessibility structure", async () => {
  for (const pathname of ["/", "/search?purpose=rent", "/properties/MM-PROP-001"]) {
    const response = await render(pathname);
    const html = await response.text();
    const imageTags = html.match(/<img\b[^>]*>/gi) ?? [];

    assert.equal(response.status, 200, pathname);
    assert.match(html, /<html\b[^>]*\blang="en"/i, pathname);
    assert.match(html, /<a\b[^>]*href="#main-content"[^>]*>Skip to main content<\/a>/i, pathname);
    assert.match(html, /\bid="main-content"/i, pathname);
    assert.match(html, /<h1\b/i, pathname);
    assert.ok(imageTags.every((tag) => /\balt="[^"]*"/i.test(tag)), `${pathname} has an image without alt text`);
  }
});

test("server-renders representative public product routes", async () => {
  const routes = [
    ["/search?purpose=rent&location=Yangon", /Best matches/i],
    ["/properties/MM-PROP-001", /Light-filled 1-bed condo in Bahan/i],
    ["/compare", /<title>Compare homes \| A7 Property<\/title>/i],
    ["/assistant", /A7 matching demo/i],
    ["/sign-in", /How would you like to use A7/i],
  ];

  for (const [pathname, expected] of routes) {
    const response = await render(pathname);
    assert.equal(response.status, 200, pathname);
    assert.match(await response.text(), expected, pathname);
  }
});

test("private frontend-demo routes render an auth boundary", async () => {
  for (const pathname of ["/saved", "/messages", "/profile", "/dashboard", "/owner", "/agent"]) {
    const response = await render(pathname);
    assert.equal(response.status, 200, pathname);
    assert.match(await response.text(), /animate-spin|sign in/i, pathname);
  }
});

test("property metadata reports verification status honestly", async () => {
  const pendingResponse = await render("/properties/MM-PROP-001");
  const pendingHtml = await pendingResponse.text();
  assert.match(pendingHtml, /Verification pending/i);
  assert.doesNotMatch(pendingHtml, /Verified on A7 Property/i);

  const verifiedResponse = await render("/properties/MM-PROP-002");
  assert.match(await verifiedResponse.text(), /Verified listing/i);
});

test("ships the complete mock-data foundation", async () => {
  const [propertyText, sourcePropertyText, promptText] = await Promise.all([
    readFile(new URL("../public/data/properties.json", import.meta.url), "utf8"),
    readFile(new URL("../data/properties.json", import.meta.url), "utf8"),
    readFile(new URL("../docs/property-image-prompts.json", import.meta.url), "utf8"),
  ]);
  const properties = JSON.parse(propertyText);
  const sourceProperties = JSON.parse(sourcePropertyText);
  const prompts = JSON.parse(promptText);

  assert.equal(properties.length, 100);
  assert.deepEqual(properties, sourceProperties);
  assert.equal(prompts.length, 50);
  assert.ok(properties.every((property) => property.currency === "MMK"));
  assert.deepEqual([...new Set(properties.map((property) => property.city))].sort(), ["Mandalay", "Yangon"]);
});

test("builds future viewing choices from the Yangon calendar date", () => {
  const options = getUpcomingViewingDates(new Date("2026-08-23T00:00:00.000Z"));

  assert.deepEqual(options.map((option) => option.value), ["2026-08-24", "2026-08-25", "2026-08-26"]);
  assert.deepEqual(viewingDateBadge(options[0].englishLabel), { day: "24", weekday: "Mon" });
  assert.ok(options.every((option) => option.englishLabel && option.myanmarLabel));
});

test("detects expired human-readable viewing dates in the Yangon calendar", () => {
  const now = new Date("2026-08-23T00:00:00.000Z");

  assert.equal(isViewingDatePast("Sunday, 26 July", now), true);
  assert.equal(isViewingDatePast("Monday, 24 August", now), false);
  assert.equal(isViewingDatePast("2026-08-22", now), true);
  assert.equal(isViewingDatePast("Friday, 2 January", new Date("2026-12-31T00:00:00.000Z")), false);
});
