import { describe, it, expect } from 'vitest';
import { LidlParser } from '../../src/parsers/lidl';

describe('LidlParser', () => {
  it('parses single variant detail correctly', () => {
    const html = `
      <html>
        <head>
          <title>Úhlová bruska PWS 230 E5</title>
          <meta property="product:price:amount" content="2499">
          <meta property="product:availability" content="instock">
        </head>
        <body>
          <div class="keyfeatures__modelcode">PWS 230 E5</div>
        </body>
      </html>
    `;
    const offers = LidlParser.parseDetail(html, 'https://lidl.cz/p/test', { source: 'lidl', country: 'CZ', currency: 'CZK' });
    
    expect(offers.length).toBe(1);
    expect(offers[0].price).toBe(2499);
    expect(offers[0].currency).toBe('CZK');
    expect(offers[0].raw_model_code).toBe('PWS 230 E5');
    expect(offers[0].availability).toBe('online_available');
  });

  it('parses multi variant detail correctly', () => {
    const html = `
      <html>
        <head>
          <title>Aku šroubovák</title>
          <meta property="product:availability" content="instock">
        </head>
        <body>
          <div class="keyfeatures__modelcode">PABS 20-Li</div>
          <div class="variant-picker__option" data-price="999">bez baterie</div>
          <div class="variant-picker__option" data-price="1499">s 2Ah baterií</div>
        </body>
      </html>
    `;
    const offers = LidlParser.parseDetail(html, 'https://lidl.cz/p/test', { source: 'lidl', country: 'CZ', currency: 'CZK' });
    
    expect(offers.length).toBe(2);
    expect(offers[0].price).toBe(999);
    expect(offers[0].raw_variant_text).toBe('bez baterie');
    expect(offers[1].price).toBe(1499);
    expect(offers[1].raw_variant_text).toBe('s 2Ah baterií');
  });
});
