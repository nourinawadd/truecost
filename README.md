<!-- banner: [<img src="assets/banner.png" alt="TRUECOST — know the real price before it lands" width="100%">](https://truecost-credosis.vercel.app) -->

paste a link from a shop abroad. the app reads the price and adds what egypt adds on top: customs duty, 14% vat, shipping. you see the landed cost in egp, as a range, before you order. then you check it against the local price.

live at [truecost-credosis.vercel.app](https://truecost-credosis.vercel.app)

<!-- screenshots: home · reading log · result (desktop) · result (375px) -->

**✦ what it does**

- paste a product link and it reads the page: title, brand, image, price, currency
- every value says where it came from: `[✓]` read from the shop, `[?]` guessed, check it
- duty, vat, shipping and fees, line by line, in egp
- a range, not one number, because customs decides the final category
- phones are taxed the egyptian way: a flat 38.5% instead of duty and vat
- edit any value on the result page and the math follows
- type what a local seller asks and it tells you: buy local, import it, or too close to call
- the whole result lives in the link, so a refresh or a shared link shows the same numbers
- a shop that blocks the reader still gets you an answer: fill it in yourself, same math

**✦ how it reads a page**

a parser ladder, ported from [hold](https://github.com/nourinawadd/hold). each step only runs if the one before it came up short:

- shopify stores: the `/products/<handle>.js` endpoint
- product data: json-ld in the page
- page previews: open graph tags
- none of it worked: the manual form

shopify and json-ld count as strong sources. open graph is weak, so anything it gives is marked `[?]`. `1.299,00` and `1,299.00` both read as 1299, and a bare `¥` stays unknown, since it could be cny or jpy.

the server only fetches public http(s) pages: no localhost, no private ips, no `.local` names. otherwise anyone could use it to reach its own network.

**✦ the math**

```
CIF   = price × fx + shippingUsd × usdFx
duty  = CIF × rate          (low and high → a range)
VAT   = (CIF + duty) × 0.14
total = CIF + duty + VAT + fees
```

shipping is always usd, because forwarders quote in usd whatever the shop's currency is. phones swap duty and vat for a flat 38.5% of cif.

**✦ limits**

- the rates are simplified demo data, not an official customs calculator
- only clothing (30–40%), cosmetics (30–60%) and phones (38.5% flat) have rates. electronics, books and other say "rate to be added"
- exchange rates are fixed at the date shown in the header
- big shops often answer with a bot check instead of the page. then you fill it in yourself

**✦ next**

- more of hold's parsers: microdata, and an llm page reader for shops with no product data
- live exchange rates
- the missing category rates
- group shipments: several items in one parcel, sharing the shipping

**✦ run it locally**

needs node 24. no env vars.

```bash
npm i
npm run dev     # http://localhost:3000
npm test
```

**✦ stack**

next.js 16 · typescript · tailwind css 4 · cheerio · vitest · vercel
