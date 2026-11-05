// The SSRF guard. Our server fetches whatever link a visitor pastes, so a link
// to "localhost" or a private IP would let anyone use our server to poke at
// its own network. Only public http(s) sites get through.
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
  const host = hostname.replace(/\.$/, ""); // "localhost." is still localhost

  // IPv6 comes as "[::1]". No shop links to a raw IPv6 address, so refuse them all.
  if (host.startsWith("[")) return false;

  const ipv4 = host.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (ipv4) return !isPrivateIpv4(Number(ipv4[1]), Number(ipv4[2]));

  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) return false;

  // "http://intranet/": one-word names only resolve inside a private network
  return host.includes(".");
}

// URL already rewrites "2130706433", "0x7f.1" and "127.1" as "127.0.0.1",
// so checking the dotted form is enough.
function isPrivateIpv4(a: number, b: number): boolean {
  return (
    a === 0 || // "this network"
    a === 10 ||
    a === 127 || // loopback
    (a === 169 && b === 254) || // link-local, where cloud metadata lives
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}
