import { describe, it, expect } from 'vitest';
import { HeurekaParser } from '../../src/parsers/heureka';
import { IdealoParser } from '../../src/parsers/idealo';
import { GeizhalsParser } from '../../src/parsers/geizhals';
import { AllegroParser } from '../../src/parsers/allegro';
import { ConnectorContext } from '../../src/parsers/lidl';

describe('Comparators Parsers', () => {
  it('HeurekaParser parses basic detail', () => {
    const html = `
      <html>
        <head>
          <title>Test Heureka Product</title>
          <meta itemprop="price" content="1500.50">
        </head>
        <body>
          <div class="availability">Skladem</div>
        </body>
      </html>
    `;
    const context: ConnectorContext = { source: 'heureka', country: 'CZ', currency: 'CZK' };
    const offers = HeurekaParser.parseDetail(html, 'https://test.heureka.cz', context);
    expect(offers).toHaveLength(1);
    expect(offers[0].raw_title).toBe('Test Heureka Product');
    expect(offers[0].price).toBe(1500.50);
    expect(offers[0].availability).toBe('online_available');
  });

  it('IdealoParser parses basic detail', () => {
    const html = `
      <html>
        <head>
          <title>Test Idealo Product</title>
          <meta itemprop="price" content="55.99">
        </head>
      </html>
    `;
    const context: ConnectorContext = { source: 'idealo', country: 'DE', currency: 'EUR' };
    const offers = IdealoParser.parseDetail(html, 'https://test.idealo.de', context);
    expect(offers).toHaveLength(1);
    expect(offers[0].raw_title).toBe('Test Idealo Product');
    expect(offers[0].price).toBe(55.99);
  });

  it('GeizhalsParser parses basic detail', () => {
    const html = `
      <html>
        <head>
          <title>Test Geizhals Product</title>
        </head>
        <body>
          <div class="gh_price">45,50</div>
        </body>
      </html>
    `;
    const context: ConnectorContext = { source: 'geizhals', country: 'AT', currency: 'EUR' };
    const offers = GeizhalsParser.parseDetail(html, 'https://test.geizhals.at', context);
    expect(offers).toHaveLength(1);
    expect(offers[0].raw_title).toBe('Test Geizhals Product');
    expect(offers[0].price).toBe(45.50);
  });

  it('AllegroParser parses basic detail', () => {
    const html = `
      <html>
        <head>
          <title>Test Allegro Product</title>
          <meta property="product:price:amount" content="120.00">
        </head>
      </html>
    `;
    const context: ConnectorContext = { source: 'allegro', country: 'PL', currency: 'PLN' };
    const offers = AllegroParser.parseDetail(html, 'https://test.allegro.pl', context);
    expect(offers).toHaveLength(1);
    expect(offers[0].raw_title).toBe('Test Allegro Product');
    expect(offers[0].price).toBe(120.00);
  });
});
