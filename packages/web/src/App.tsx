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
  image_url?: string | null;
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
  
  const [newProductUrl, setNewProductUrl] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  
  const [flyerUrl, setFlyerUrl] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductUrl) return;
    setIsAdding(true);
    setActionError(null);
    try {
      const res = await fetch('/api/add-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newProductUrl })
      });
      if (!res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const d = await res.json();
          setActionError(d.error || 'Failed to add product.');
        } else {
          setActionError(`Server returned ${res.status} ${res.statusText}. Note: Adding products only works when running the dashboard locally (npm run dev), not on GitHub Pages.`);
        }
      } else {
        setNewProductUrl('');
        alert('Product added and crawler triggered! Reloading data...');
        window.location.reload();
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to add product.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleExtractFlyer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flyerUrl) return;
    setIsExtracting(true);
    setActionError(null);
    try {
      const res = await fetch('/api/extract-flyer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: flyerUrl })
      });
      if (!res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const d = await res.json();
          setActionError(d.error || 'Failed to extract flyer.');
        } else {
          setActionError(`Server returned ${res.status} ${res.statusText}. Note: Extracting flyers only works when running the dashboard locally (npm run dev), not on GitHub Pages.`);
        }
      } else {
        setFlyerUrl('');
        alert('Flyer extracted successfully! Products added and crawled. Reloading data...');
        window.location.reload();
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to extract flyer.');
    } finally {
      setIsExtracting(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    const rounded = Math.round(amount);
    switch(currency) {
      case 'EUR': return `€${rounded}`;
      case 'CZK': return `${rounded} Kč`;
      case 'PLN': return `${rounded} zł`;
      case 'HUF': return `${rounded} Ft`;
      default: return `${rounded} ${currency}`;
    }
  };

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/latest-comparison.json`)
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
          <a href={`${import.meta.env.BASE_URL}data/latest-comparison.csv`} className="stats-badge" style={{color: 'inherit', textDecoration: 'none'}}>
            ⭳ Download CSV
          </a>
        </div>
        
        <div className="filters">
          <label>Category Filter: </label>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="filter-select">
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <a 
            href="https://github.com/lkjhgfdsa2020/Srovnavac_cen/actions/workflows/crawl-and-build.yml" 
            target="_blank" 
            rel="noreferrer"
            className="cta-button"
            style={{ marginLeft: 'auto' }}
            title="Takes you to GitHub Actions to trigger the crawl-and-build workflow"
          >
            ▶ Re-run Crawl (GitHub Actions)
          </a>
        </div>

        <form onSubmit={handleAddProduct} className="add-product-form">
          <input 
            type="url" 
            placeholder="Paste Lidl/Kaufland CZ product URL to add..." 
            value={newProductUrl} 
            onChange={e => setNewProductUrl(e.target.value)} 
            className="url-input"
            required
          />
          <button type="submit" className="cta-button" disabled={isAdding}>
            {isAdding ? 'Adding & Crawling...' : '+ Add Product'}
          </button>
        </form>

        <form onSubmit={handleExtractFlyer} className="add-product-form" style={{ marginTop: '0.5rem' }}>
          <input 
            type="url" 
            placeholder="Paste Lidl Flyer URL (e.g. lidl.cz/l/cs/letak/... or .pdf)" 
            value={flyerUrl} 
            onChange={e => setFlyerUrl(e.target.value)} 
            className="url-input"
            required
          />
          <button type="submit" className="cta-button" disabled={isExtracting} style={{ backgroundColor: 'var(--success)', borderColor: 'var(--success)' }}>
            {isExtracting ? 'Extracting & Crawling...' : 'Extract Flyer'}
          </button>
        </form>

        {actionError && (
          <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255,0,0,0.1)', border: '1px solid rgba(255,0,0,0.5)', borderRadius: '4px' }}>
            <h3 style={{ color: 'var(--danger)', margin: '0 0 0.5rem 0', fontSize: '1rem' }}>Action Failed</h3>
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: 'var(--text)', fontSize: '0.85rem', margin: 0, maxHeight: '200px', overflowY: 'auto' }}>
              {actionError}
            </pre>
            <button onClick={() => setActionError(null)} style={{ marginTop: '0.5rem', background: 'transparent', border: '1px solid var(--text-secondary)', color: 'var(--text-secondary)', padding: '0.25rem 0.5rem', cursor: 'pointer', borderRadius: '4px' }}>Dismiss</button>
          </div>
        )}
      </header>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              {countries.map(c => <th key={c} style={{textAlign: 'center'}}>{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {filteredRows.map(row => (
              <tr key={row.canonical_product_id}>
                <td>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    {row.image_url ? (
                      <img src={row.image_url} alt="" style={{ width: '48px', height: '48px', objectFit: 'contain', background: '#fff', borderRadius: '4px', border: '1px solid var(--border)' }} />
                    ) : (
                      <div style={{ width: '48px', height: '48px', background: 'var(--bg-card)', borderRadius: '4px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>No IMG</div>
                    )}
                    <div>
                      <div className="product-name">{row.display_name}</div>
                      <div className="product-meta">{row.model_code} • {row.bundle_summary}</div>
                    </div>
                  </div>
                </td>
                {countries.map(country => {
                  const cellsForCountry = row.cells.filter(c => c.country === country);
                  const cell = cellsForCountry.sort((a, b) => {
                    if (a.is_best) return -1;
                    if (b.is_best) return 1;
                    return (a.price_czk ?? Infinity) - (b.price_czk ?? Infinity);
                  })[0];
                  
                  if (!cell) {
                    return <td key={country} className="empty-cell" style={{textAlign: 'center'}}>- No data -</td>;
                  }

                  let statusClass = 'status-available';
                  let statusText = '✓';
                  let statusTitle = 'In Stock';
                  if (cell.status === 'out_of_stock') { statusClass = 'status-out'; statusText = '✗'; statusTitle = 'Out of Stock'; }
                  if (cell.status === 'not_online_purchasable') { statusClass = 'status-not_online'; statusText = '⊘'; statusTitle = 'Not Available Online'; }
                  if (cell.status === 'online_preorder') { statusClass = 'status-available'; statusText = '⏳'; statusTitle = 'Preorder'; }

                  const isExactMatch = cell.quality_flags?.includes('match_model_code_exact');

                  return (
                    <td key={country} style={{textAlign: 'center'}}>
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
                              {formatCurrency(cell.price, cell.currency!)}
                            </a>
                            <div className="price-sub">
                              {cell.is_best && cell.currency !== 'CZK' && cell.price_czk !== null && (
                                <span>{Math.round(cell.price_czk)} Kč</span>
                              )}
                              {!cell.is_best && cell.delta_to_best_percent !== null && cell.delta_to_best_percent > 0 && (
                                <span className="delta" style={{marginLeft: cell.is_best ? '0.5rem' : '0'}}>
                                  +{Math.round(cell.delta_to_best_percent)}%
                                </span>
                              )}
                            </div>
                            <div style={{display: 'flex', gap: '4px', alignItems: 'center', marginTop: '4px'}}>
                              <span className={`status-badge ${statusClass}`} title={statusTitle}>{statusText}</span>
                              {cell.quality_flags && cell.quality_flags.length > 0 && (
                                <span className="quality-flag" title={cell.quality_flags.join(', ')}>
                                  {isExactMatch ? '✓ Exact' : '⚠️ Fuzzy'}
                                </span>
                              )}
                            </div>
                          </>
                        ) : (
                          <span className={`status-badge ${statusClass}`} title={statusTitle}>{statusText}</span>
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
