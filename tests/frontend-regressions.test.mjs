import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

async function source(pathname) {
  return readFile(new URL(`../${pathname}`, import.meta.url), "utf8");
}

test("mobile dashboard exposes only one bottom navigation", async () => {
  const [globalNav, dashboard] = await Promise.all([
    source("components/layout/mobile-bottom-nav.tsx"),
    source("components/dashboard/user-dashboard.tsx"),
  ]);

  assert.match(globalNav, /pathname\.startsWith\("\/dashboard"\)/);
  assert.equal((dashboard.match(/Mobile home journey/g) ?? []).length, 1);
});

test("Myanmar font mapping reflects the supplied bold face and keeps compact copy readable", async () => {
  const css = await source("app/globals.css");

  assert.match(css, /font-family:\s*"Z06 Walone"[\s\S]*?font-weight:\s*700;/);
  assert.doesNotMatch(css, /font-weight:\s*400 900;/);
  assert.match(css, /html\[lang="my"\][\s\S]*?text-\[10px\][\s\S]*?font-size:\s*0\.75rem !important;/);
});

test("client-safe property helpers do not bundle the complete catalog", async () => {
  const [helpers, catalog] = await Promise.all([
    source("lib/properties.ts"),
    source("lib/property-catalog.ts"),
  ]);

  assert.doesNotMatch(helpers, /data\/properties\.json/);
  assert.match(catalog, /data\/properties\.json/);
});

test("client route views receive catalog data through server boundaries", async () => {
  const clientViews = await Promise.all([
    source("components/assistant/property-consultant.tsx"),
    source("components/mobile/messages-experience.tsx"),
    source("components/mobile/saved-journey.tsx"),
    source("components/dashboard/user-dashboard.tsx"),
    source("components/dashboard/property-crm.tsx"),
  ]);

  clientViews.forEach((view) => assert.doesNotMatch(view, /@\/lib\/property-catalog/));
  clientViews.forEach((view) => assert.match(view, /properties/));
});

test("auth, language, and trust labels use resilient truthful state", async () => {
  const [storage, auth, language, layout, crm] = await Promise.all([
    source("lib/local-storage.ts"),
    source("components/auth/auth-provider.tsx"),
    source("components/i18n/language-provider.tsx"),
    source("app/layout.tsx"),
    source("components/dashboard/property-crm.tsx"),
  ]);

  assert.match(storage, /readStoredString/);
  assert.match(storage, /removeStoredValue/);
  assert.doesNotMatch(auth, /window\.localStorage/);
  assert.doesNotMatch(language, /window\.localStorage/);
  assert.match(layout, /a7-property-language/);
  assert.match(crm, /Agent demo profile/);
  assert.match(crm, /user\?\.idVerified && user\.phoneVerified/);
});

test("property detail exposes split conversion and defers the interactive map", async () => {
  const [detail, sections] = await Promise.all([
    source("components/property/property-detail-view.tsx"),
    source("components/property/property-detail-sections.tsx"),
  ]);

  assert.match(detail, /tx\("Message", "စာပို့ရန်"\)/);
  assert.match(detail, /tx\("Request viewing", "အိမ်ကြည့်ရန်"\)/);
  assert.match(detail, /frontend demo did not send a moderation report/);
  assert.match(sections, /expanded \? \([\s\S]*?<PropertyMap/);
  assert.match(sections, /Approximate area preview/);
});

test("sign-in follows the shared language preference and never creates a blank social account", async () => {
  const signIn = await source("components/auth/sign-in-view.tsx");

  assert.match(signIn, /useLanguage\(\)/);
  assert.match(signIn, /resolvedEmail = email\.trim\(\) \|\|/);
  assert.match(signIn, /provider\.toLowerCase\(\).*demo@a7\.local/);
  assert.doesNotMatch(signIn, /useState<Language>\("en"\)/);
});

test("seeker and lister profile destinations match their labels", async () => {
  const profile = await source("components/mobile/profile-experience.tsx");

  assert.match(profile, /Saved Homes/);
  assert.match(profile, /\/owner\?section=properties/);
  assert.match(profile, /user\?\.accountType === "lister"/);
});

test("final device QA keeps compact layouts inside the viewport", async () => {
  const [css, cards, userDashboard, dashboardShell, mobileAppHeader, crm, searchBar, assistant, profile] = await Promise.all([
    source("app/globals.css"),
    source("components/ui/card.tsx"),
    source("components/dashboard/user-dashboard.tsx"),
    source("components/dashboard/dashboard-shell.tsx"),
    source("components/layout/mobile-app-header.tsx"),
    source("components/dashboard/property-crm.tsx"),
    source("components/search/property-search-bar.tsx"),
    source("components/assistant/a7-assistant-popover.tsx"),
    source("components/mobile/profile-experience.tsx"),
  ]);

  assert.doesNotMatch(css, /min-width:\s*320px/);
  assert.match(css, /overflow-x:\s*clip/);
  assert.match(cards, /flex min-w-0 flex-col/);
  assert.match(userDashboard, /useAuth\(\)/);
  assert.match(userDashboard, /grid-cols-\[minmax\(0,1fr\)\]/);
  assert.match(userDashboard, /A7Brand compact/);
  assert.match(dashboardShell, /A7Brand compact className="min-\[520px\]:hidden"/);
  assert.match(dashboardShell, /A7Brand inverted compact=\{role !== "user"\}/);
  assert.match(dashboardShell, /mobileLabelMy: "အိမ်များ"/);
  assert.match(dashboardShell, /mobileLabelMy: "စိစစ်"/);
  assert.match(dashboardShell, /mobileLabelMy: "ဆက်တင်"/);
  assert.match(mobileAppHeader, /hidden truncate[^\n]+min-\[360px\]:inline/);
  assert.match(crm, /min-\[380px\]:grid-cols-2/);
  assert.match(crm, /requestedSection === "overview"[\s\S]*?window\.scrollTo\(\{ top: 0, behavior: "instant" \}\)/);
  assert.match(searchBar, /min-h-11 min-w-0 flex-1/);
  assert.match(assistant, /inline-flex h-11 min-w-11 items-center/);
  assert.match(profile, /name: user\?\.fullName \?\? storedProfile\.name/);
});

test("design system v1 keeps shared chrome and semantic primitives frozen", async () => {
  const [css, publicNav, seekerNav, workspaceNav, appHeader, button, badge, designSystem] = await Promise.all([
    source("app/globals.css"),
    source("components/layout/mobile-bottom-nav.tsx"),
    source("components/dashboard/user-dashboard.tsx"),
    source("components/dashboard/dashboard-shell.tsx"),
    source("components/layout/app-header.tsx"),
    source("components/ui/button.tsx"),
    source("components/ui/badge.tsx"),
    source("docs/design-system.md"),
  ]);

  assert.match(css, /--surface-app:\s*#EAF4FF/);
  assert.match(css, /--surface-selected:\s*#DCEBFF/);
  assert.match(css, /\.a7-header-surface\s*\{/);
  assert.match(css, /\.a7-mobile-nav-shell\s*\{/);
  [publicNav, seekerNav, workspaceNav].forEach((nav) => assert.match(nav, /a7-mobile-nav-shell/));
  assert.doesNotMatch(appHeader, /AnimatedIcon/);
  assert.match(appHeader, /from "lucide-react"/);
  assert.match(button, /"secondary"[\s\S]*?"destructive"/);
  assert.match(badge, /"neutral"[\s\S]*?"verified"/);
  assert.match(designSystem, /Status:\*\* Frozen/);
  assert.match(designSystem, /Iconify is allowed only for brand, social, or external-service marks/);
});

test("generated 3D icons stay selective and respect reduced-motion preferences", async () => {
  const css = await source("app/globals.css");
  const [animatedIcon, animatedAssetIcon, assistant, comparison, inquiry, saved, messages, dashboard, search, homeDiscovery, propertyDetail, propertyDetailSections, profile, crm, informationPage, community, signIn, help, errorPage, privacy, terms, listingEditor, comparisonPage, consultant] = await Promise.all([
    source("components/ui/animated-icon.tsx"),
    source("components/ui/animated-asset-icon.tsx"),
    source("components/assistant/a7-assistant-popover.tsx"),
    source("components/compare/comparison-tray.tsx"),
    source("components/property/inquiry-sheet.tsx"),
    source("components/mobile/saved-journey.tsx"),
    source("components/mobile/messages-experience.tsx"),
    source("components/dashboard/user-dashboard.tsx"),
    source("components/mobile/mobile-property-search.tsx"),
    source("components/mobile/home-discovery.tsx"),
    source("components/property/property-detail-view.tsx"),
    source("components/property/property-detail-sections.tsx"),
    source("components/mobile/profile-experience.tsx"),
    source("components/dashboard/property-crm.tsx"),
    source("components/content/information-page.tsx"),
    source("app/community/page.tsx"),
    source("components/auth/sign-in-view.tsx"),
    source("app/help/page.tsx"),
    source("app/error.tsx"),
    source("app/privacy/page.tsx"),
    source("app/terms/page.tsx"),
    source("components/dashboard/listing-editor-sheet.tsx"),
    source("components/compare/property-comparison.tsx"),
    source("components/assistant/property-consultant.tsx"),
  ]);

  assert.match(animatedIcon, /IconVariant = [^;]+"depth"/);
  assert.match(animatedIcon, /initial=\{reduceMotion \? false/);
  assert.match(animatedIcon, /whileTap=\{reduceMotion \|\| hover !== "tilt"/);
  assert.doesNotMatch(animatedAssetIcon, /framer-motion/);
  assert.match(animatedAssetIcon, /a7-asset-icon--/);
  assert.match(animatedAssetIcon, /unoptimized = true/);
  assert.match(css, /prefers-reduced-motion:\s*reduce[\s\S]*?\.a7-asset-icon/);
  assert.match(assistant, /src="\/icons\/a7-property-match-3d\.png"/);
  assert.match(comparison, /src="\/icons\/a7-compare-homes-3d\.png"/);
  assert.match(inquiry, /src="\/icons\/a7-success-3d\.png"/);
  assert.match(saved, /src="\/icons\/a7-saved-home-3d\.png"/);
  assert.match(messages, /src="\/icons\/a7-messages-3d\.png"/);
  assert.match(dashboard, /src="\/icons\/a7-viewing-3d\.png"/);
  assert.match(search, /src="\/icons\/a7-explore-3d\.png"/);
  assert.match(homeDiscovery, /src="\/icons\/a7-personal-search-3d\.png"/);
  assert.match(homeDiscovery, /src="\/icons\/a7-location-choice-3d\.png"/);
  assert.match(homeDiscovery, /src="\/icons\/a7-recommended-home-3d\.png"/);
  assert.match(propertyDetail, /verification_status === "verified"[\s\S]*?src="\/icons\/a7-verified-home-3d\.png"/);
  assert.match(propertyDetail, /src="\/icons\/a7-home-overview-3d\.png"/);
  assert.match(propertyDetail, /src="\/icons\/a7-lister-contact-3d\.png"/);
  assert.match(propertyDetailSections, /src="\/icons\/a7-amenities-3d\.png"/);
  assert.match(propertyDetailSections, /src="\/icons\/a7-explore-3d\.png"/);
  assert.match(dashboard, /src="\/icons\/a7-price-alert-3d\.png"/);
  assert.match(dashboard, /src="\/icons\/a7-home-journey-3d\.png"/);
  assert.match(profile, /src="\/icons\/a7-profile-3d\.png"/);
  assert.doesNotMatch(profile, /visualSrc="\/icons\/a7-account-details-3d\.png"/);
  assert.doesNotMatch(profile, /visualSrc="\/icons\/a7-home-preferences-3d\.png"/);
  assert.doesNotMatch(profile, /visualSrc="\/icons\/a7-support-legal-3d\.png"/);
  assert.match(crm, /src="\/icons\/a7-listing-workspace-3d\.png"/);
  assert.match(informationPage, /visualSrc\?: string/);
  assert.match(community, /visualSrc="\/icons\/a7-community-3d\.png"/);
  assert.match(signIn, /src="\/icons\/a7-account-access-3d\.png"/);
  assert.match(help, /visualSrc="\/icons\/a7-help-center-3d\.png"/);
  assert.match(errorPage, /src="\/icons\/a7-retry-home-3d\.png"/);
  assert.match(privacy, /visualSrc="\/icons\/a7-privacy-3d\.png"/);
  assert.match(terms, /visualSrc="\/icons\/a7-terms-3d\.png"/);
  assert.match(listingEditor, /src="\/icons\/a7-property-photos-3d\.png"/);
  assert.match(listingEditor, /src="\/icons\/a7-draft-saved-3d\.png"/);
  assert.match(comparisonPage, /src="\/icons\/a7-compare-homes-3d\.png"/);
  assert.match(comparisonPage, /src="\/icons\/a7-add-home-3d\.png"/);
  assert.match(consultant, /src="\/icons\/a7-property-match-3d\.png"/);
  assert.match(search, /src="\/icons\/a7-search-empty-3d\.png"/);
  assert.match(messages, /src="\/icons\/a7-conversation-empty-3d\.png"/);
  assert.match(saved, /src="\/icons\/a7-shortlist-empty-3d\.png"/);
  assert.match(dashboard, /src="\/icons\/a7-shortlist-empty-3d\.png"/);
  assert.match(crm, /src="\/icons\/a7-verification-documents-3d\.png"/);
  assert.match(crm, /src="\/icons\/a7-verification-saved-3d\.png"/);
  assert.match(inquiry, /"\/icons\/a7-contact-home-3d\.png"/);
  assert.match(inquiry, /"\/icons\/a7-schedule-viewing-3d\.png"/);
});

test("3D icon cutouts keep a real PNG alpha channel", async () => {
  const icons = (await readdir(new URL("../public/icons/", import.meta.url)))
    .filter((icon) => /^a7-.*-3d\.png$/.test(icon));

  assert.ok(icons.length >= 37, "the complete A7 3D icon family must remain available");

  for (const icon of icons) {
    const png = await readFile(new URL(`../public/icons/${icon}`, import.meta.url));

    assert.equal(png.subarray(1, 4).toString("ascii"), "PNG", `${icon} must remain a PNG`);
    assert.equal(png[24], 8, `${icon} must remain an 8-bit PNG`);
    assert.equal(png[25], 6, `${icon} must use RGBA instead of an opaque RGB background`);
  }
});
