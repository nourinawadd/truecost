export function parseSafeUrl(raw: unknown): URL | null {
  if (typeof raw !== "string") return null;

  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  if (url.username || url.password) return null;
  return isPublicHost(url.hostname) ? url : null;
}

function isPublicHost(hostname: string): boolean {
  const host = hostname.replace(/\.$/, "");

  if (host.startsWith("[")) return false;

  const ipv4 = host.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (ipv4) return !isPrivateIpv4(Number(ipv4[1]), Number(ipv4[2]));

  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) return false;

  return host.includes(".");
}

function isPrivateIpv4(a: number, b: number): boolean {
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}
