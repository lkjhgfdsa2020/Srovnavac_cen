import { describe, it, expect } from 'vitest';
import { KauflandParser } from '../../src/parsers/kaufland';

describe('KauflandParser', () => {
  it('parses direct seller correctly', () => {
    const html = `
      <html>
        <head>
          <title>Úhlová bruska</title>
          <meta property="product:price:amount" content="2499">
          <meta property="product:availability" content="instock">
        </head>
        <body>
          <div class="seller-name">Kaufland CZ</div>
        </body>
      </html>
    `;
    const offers = KauflandParser.parseDetail(html, 'https://kaufland.cz/p/test', { source: 'kaufland', country: 'CZ', currency: 'CZK' });
    
    expect(offers.length).toBe(1);
    expect(offers[0].price).toBe(2499);
    expect(offers[0].seller).toBe('Kaufland CZ');
    expect(offers[0].is_external_seller).toBe(false);
  });

  it('flags external seller correctly', () => {
    const html = `
      <html>
        <head>
          <title>Aku šroubovák</title>
          <meta property="product:price:amount" content="2999">
          <meta property="product:availability" content="instock">
        </head>
        <body>
          <div class="seller-name">SuperNářadí s.r.o.</div>
        </body>
      </html>
    `;
    const offers = KauflandParser.parseDetail(html, 'https://kaufland.cz/p/test', { source: 'kaufland', country: 'CZ', currency: 'CZK' });
    
    expect(offers.length).toBe(1);
    expect(offers[0].seller).toBe('SuperNářadí s.r.o.');
    expect(offers[0].is_external_seller).toBe(true);
  });
});
