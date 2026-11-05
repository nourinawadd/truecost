import { describe, expect, it } from "vitest";
import { parseSafeUrl } from "@/lib/scrape/safeUrl";

const ok = (raw: string) => expect(parseSafeUrl(raw)).not.toBeNull();
const refused = (raw: unknown) => expect(parseSafeUrl(raw)).toBeNull();

describe("parseSafeUrl", () => {
  it("lets public http(s) links through, trimmed", () => {
    ok("https://shop.example.com/products/shirt");
    ok("http://example.com");
    expect(parseSafeUrl("  https://example.com/a  ")?.href).toBe("https://example.com/a");
  });

  it("refuses anything that isn't an http(s) url", () => {
    refused("not a url");
    refused("ftp://example.com/file");
    refused("javascript:alert(1)");
    refused("file:///etc/passwd");
    refused(42);
    refused(undefined);
  });

  it("refuses links with a username or password in them", () => {
    refused("https://user:pass@example.com/");
  });

  it("refuses local names", () => {
    refused("http://localhost:3000/");
    refused("http://localhost./");
    refused("http://api.localhost/");
    refused("http://printer.local/");
    refused("http://intranet/");
  });

  it("refuses private ipv4 ranges", () => {
    refused("http://0.0.0.0/");
    refused("http://10.1.2.3/");
    refused("http://127.0.0.1/");
    refused("http://169.254.169.254/latest/meta-data/");
    refused("http://192.168.1.1/");
  });

  it("172.16/12 is private, its neighbours aren't", () => {
    ok("http://172.15.0.1/");
    refused("http://172.16.0.1/");
    refused("http://172.31.255.255/");
    ok("http://172.32.0.1/");
    ok("http://8.8.8.8/");
  });

  it("refuses 127.0.0.1 written in disguise", () => {
    refused("http://2130706433/");
    refused("http://0x7f.1/");
    refused("http://127.1/");
    refused("http://127.0.0.1./");
  });

  it("refuses ipv6 addresses", () => {
    refused("http://[::1]/");
    refused("http://[::ffff:127.0.0.1]/");
  });
});
