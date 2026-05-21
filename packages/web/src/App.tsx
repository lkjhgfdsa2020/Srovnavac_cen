import { useEffect, useState, useMemo } from 'react';
import './index.css';

interface ComparisonCell {
  country: string;
  source: string;
  status: string;
  price: number | null;
  currency: string | null;
  price_czk: number | null;
  delta_to_best_czk: number | null;
  delta_to_best_percent: number | null;
  is_best: boolean;
  url: string;
  quality_flags: string[];
}

interface ComparisonRow {
  canonical_product_id: string;
  display_name: string;
  model_code: string;
  bundle_summary: string;
  category: string;
  best_price_czk: number | null;
  cells: ComparisonCell[];
}

interface ComparisonData {
  generated_at: string;
  health_report?: {
    excluded_external_sellers_count: number;
  };
  fx: { date: string };
  rows: ComparisonRow[];
}

function App() {
  const [data, setData] = useState<ComparisonData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  useEffect(() => {
    fetch('/data/latest-comparison.json')
      .then(r => r.json())
      .then(setData)
      .catch(e => setError(e.message));
  }, []);

  const categories = useMemo(() => {
    if (!data) return ['ALL'];
    const cats = new Set(data.rows.map(r => r.category));
    return ['ALL', ...Array.from(cats)];
  }, [data]);

  if (error) return <div style={{color: 'red'}}>Error: {error}</div>;
  if (!data) return <div style={{color: '#fff'}}>Loading...</div>;

  const countries = ['CZ', 'SK', 'PL', 'HU', 'AT', 'DE'];
  
  const filteredRows = data.rows.filter(r => filterCategory === 'ALL' || r.category === filterCategory);

  return (
    <>
      <header className="header">
        <h1>Parkside Price Watch</h1>
        <p className="subtitle">Real-time cross-border price comparisons for PARKSIDE tools.</p>
        
        <div className="stats">
          <span className="stats-badge">
            <span style={{color: 'var(--success)'}}>●</span> 
            Updated: {new Date(data.generated_at).toLocaleString()}
          </span>
          <span className="stats-badge">
            <span style={{color: 'var(--accent)'}}>ℹ</span> 
            FX Rates: {data.fx.date}
          </span>
          {data.health_report && (
            <span className="stats-badge health-badge" title="Third-party sellers excluded based on direct_only policy">
              🛡️ Kaufland External Sellers Excluded: {data.health_report.excluded_external_sellers_count}
            </span>
          )}
          <a href="/data/latest-comparison.csv" className="stats-badge" style={{color: 'inherit', textDecoration: 'none'}}>
            ⭳ Download CSV
          </a>
        </div>
        
        <div className="filters">
          <label>Category Filter: </label>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="filter-select">
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </header>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              {countries.map(c => <th key={c}>{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {filteredRows.map(row => (
              <tr key={row.canonical_product_id}>
                <td>
                  <div className="product-name">{row.display_name}</div>
                  <div className="product-meta">{row.model_code} • {row.bundle_summary}</div>
                </td>
                {countries.map(country => {
                  const cell = row.cells.find(c => c.country === country);
                  if (!cell) {
                    return <td key={country} className="empty-cell">- No data -</td>;
                  }

                  let statusClass = 'status-available';
                  let statusText = 'In Stock';
                  if (cell.status === 'out_of_stock') { statusClass = 'status-out'; statusText = 'Out of Stock'; }
                  if (cell.status === 'not_online_purchasable') { statusClass = 'status-not_online'; statusText = 'Not Online'; }
                  if (cell.status === 'online_preorder') { statusClass = 'status-available'; statusText = 'Preorder'; }

                  const isExactMatch = cell.quality_flags?.includes('match_model_code_exact');

                  return (
                    <td key={country}>
                      <div className="price-cell">
                        {cell.price !== null ? (
                          <>
                            <a 
                              href={cell.url} 
                              target="_blank" 
                              rel="noreferrer" 
                              className={`price-main ${cell.is_best ? 'best-price' : ''}`}
                              style={{ textDecoration: 'none', color: cell.is_best ? 'var(--success)' : 'inherit' }}
                            >
                              {cell.price} {cell.currency}
                            </a>
                            <div className="price-sub">
                              {cell.price_czk} CZK
                              {!cell.is_best && cell.delta_to_best_percent !== null && cell.delta_to_best_percent > 0 && (
                                <span className="delta" style={{marginLeft: '0.5rem'}}>
                                  +{cell.delta_to_best_percent}%
                                </span>
                              )}
                            </div>
                            <div style={{display: 'flex', gap: '4px', alignItems: 'center', marginTop: '4px'}}>
                              <span className={`status-badge ${statusClass}`}>{statusText}</span>
                              {cell.quality_flags && cell.quality_flags.length > 0 && (
                                <span className="quality-flag" title={cell.quality_flags.join(', ')}>
                                  {isExactMatch ? '✓ Exact' : '⚠️ Fuzzy'}
                                </span>
                              )}
                            </div>
                          </>
                        ) : (
                          <span className={`status-badge ${statusClass}`}>{statusText}</span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
            {filteredRows.length === 0 && (
              <tr><td colSpan={7} style={{textAlign: 'center', padding: '2rem'}}>No products found for this filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      
      <footer className="footer" style={{ marginTop: '3rem', padding: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border)' }}>
        <p><strong>Disclaimer:</strong> This is a public dataset provided for informational purposes only. Prices, availability, and currency exchange rates may not be accurate or up to date. We are not affiliated with Lidl, Kaufland, or PARKSIDE. Please verify all information on the respective seller's official website.</p>
      </footer>
    </>
  );
}

export default App;
