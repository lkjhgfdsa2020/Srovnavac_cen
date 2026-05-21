import { describe, it, expect } from 'vitest';
import { GenericShopParser } from '../../src/parsers/generic_shop';
import { ConnectorContext } from '../../src/parsers/lidl';

describe('GenericShopParser', () => {
  it('parses detail using JSON-LD', () => {
    const html = `
      <html>
        <head>
          <script type="application/ld+json">
          {
            "@context": "http://schema.org/",
            "@type": "Product",
            "name": "Super Tool",
            "offers": {
              "@type": "Offer",
              "priceCurrency": "CZK",
              "price": "999.00",
              "availability": "http://schema.org/InStock"
            }
          }
          </script>
        </head>
      </html>
    `;
    const context: ConnectorContext = { source: 'alza', country: 'CZ', currency: 'CZK' };
    const offers = GenericShopParser.parseDetail(html, 'https://alza.cz/test', context);
    expect(offers).toHaveLength(1);
    expect(offers[0].raw_title).toBe('Super Tool');
    expect(offers[0].price).toBe(999.00);
    expect(offers[0].availability).toBe('online_available');
  });

  it('parses detail using fallback selectors', () => {
    const html = `
      <html>
        <head>
          <title>Super Tool Fallback</title>
          <meta property="product:price:amount" content="850.50">
        </head>
        <body>
          <div>skladem</div>
        </body>
      </html>
    `;
    const context: ConnectorContext = { source: 'mall', country: 'CZ', currency: 'CZK' };
    const offers = GenericShopParser.parseDetail(html, 'https://mall.cz/test', context);
    expect(offers).toHaveLength(1);
    expect(offers[0].raw_title).toBe('Super Tool Fallback');
    expect(offers[0].price).toBe(850.50);
    expect(offers[0].availability).toBe('online_available');
  });
});
