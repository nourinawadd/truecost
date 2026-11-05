// Port of HOLD's PageRecovery.IsChallenge. Some shops answer 200 OK with a
// "checking your browser" page instead of the product. Those pages are small
// and carry one of these markers from Cloudflare, Akamai, PerimeterX & co.
const MARKERS = [
  "bm-verify",
  "/_sec/verify",
  "__cf_chl",
  "cf-browser-verification",
  "checking your browser",
  "px-captcha",
  "/_incapsula_resource",
  "distil_r_captcha",
];

// a real product page is far bigger than 20,000 chars, so a long page that
// merely mentions a marker is not a challenge
export function isChallenge(html: string): boolean {
  if (html.length >= 20_000) return false;
  const lower = html.toLowerCase();
  return MARKERS.some((marker) => lower.includes(marker));
}
