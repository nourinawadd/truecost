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

export function isChallenge(html: string): boolean {
  if (html.length >= 20_000) return false;
  const lower = html.toLowerCase();
  return MARKERS.some((marker) => lower.includes(marker));
}
