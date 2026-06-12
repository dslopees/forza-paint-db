import { useState, useMemo, useCallback, useEffect } from "react";

const FH6_MAP = {
  'Normal':               { fh6: 'Normal',               warn: false },
  'Metal Flake':          { fh6: 'Metal Flake Medium',   warn: true,
    warnMsg: 'FH6 split this into Fine / Medium / Glitter. Blend formula changed — values need in-game recalibration.' },
  'Matte':                { fh6: 'Matte',                warn: false },
  'Semigloss':            { fh6: 'Semigloss',            warn: false },
  'Two-Tone Matte':       { fh6: 'Two-Tone Matte',       warn: false },
  'Two-Tone Polished':    { fh6: 'Two-Tone Polished',    warn: false },
  'Two-Tone Semigloss':   { fh6: 'Two-Tone Semigloss',  warn: false },
  'Chrome':               { fh6: 'Chrome',               warn: false },
  'Aluminum Polished':    { fh6: 'Aluminum Polished',    warn: false },
  'Aluminum Semigloss':   { fh6: 'Aluminum Semigloss',  warn: false },
  'Aluminum Brushed':     { fh6: 'Aluminum Brushed',     warn: false },
  'Aluminium Semigloss':  { fh6: 'Aluminum Semigloss',  warn: false },
  'Carbon Fiber Polished':{ fh6: 'Carbon Fiber',         warn: false },
  'Carbon Fibre Polished':{ fh6: 'Carbon Fiber',         warn: false },
  'Prismacolor White':    { fh6: 'Matte',                warn: false },
  'N/A':                  { fh6: 'Normal',               warn: false },
};

const FLAKE_SUB = ['Metal Flake Fine','Metal Flake Medium','Metal Flake Glitter'];
const FLAKE_GUIDE = {
  'Metal Flake Fine':    'Subtle pearl-like sparkle. Good for silvers, whites, soft metallics.',
  'Metal Flake Medium':  'Standard flake — closest to old FH4/5. Start here when porting values.',
  'Metal Flake Glitter': 'Large visible flakes, bold glitter effect.',
  'Candy':               'Single H/S/B set. Pearlescent, deep glow. New in FH6.',
};

import { VDATA, WDATA } from './data';

function hsbToRgb(h, s, b) {
  if (h == null || s == null || b == null) return null;
  const hd = h * 360;
  const c = b * s, x = c * (1 - Math.abs((hd / 60) % 2 - 1)), m = b - c;
  let r = 0, g = 0, bb = 0;
  if (hd < 60) { r = c; g = x; } else if (hd < 120) { r = x; g = c; }
  else if (hd < 180) { g = c; bb = x; } else if (hd < 240) { g = x; bb = c; }
  else if (hd < 300) { r = x; bb = c; } else { r = c; bb = x; }
  return `rgb(${Math.round((r+m)*255)},${Math.round((g+m)*255)},${Math.round((bb+m)*255)})`;
}

function luminance(rgb) {
  if (!rgb) return 0.5;
  const m = rgb.match(/\d+/g);
  if (!m) return 0.5;
  return (parseInt(m[0]) * 0.299 + parseInt(m[1]) * 0.587 + parseInt(m[2]) * 0.114) / 255;
}

function parseRow(row, makesArr, typesArr) {
  const make = makesArr[row[0]], name = row[1], rawType = typesArr[row[2]];
  const info = FH6_MAP[rawType] || { fh6: rawType, warn: false };
  const c1 = row[3] != null ? { h: row[3], hd: row[4]===0?'L':'R', s: row[5], sd: row[6]===0?'L':'R', b: row[7], bd: row[8]===0?'L':'R' } : null;
  const c2 = row[9] != null ? { h: row[9], hd: row[10]===0?'L':'R', s: row[11], sd: row[12]===0?'L':'R', b: row[13], bd: row[14]===0?'L':'R' } : null;
  const rgb1 = c1 ? hsbToRgb(c1.h, c1.s, c1.b) : null;
  const rgb2 = c2 ? hsbToRgb(c2.h, c2.s, c2.b) : null;
  return { make, name, rawType, fh6type: info.fh6, warn: info.warn, warnMsg: info.warnMsg||null, c1, c2, rgb1, rgb2, note: row[15]||'' };
}

const PER_PAGE = 48;

const FZ = {
  accent: '#E8FF00',
  accentDim: '#c8dd00',
  dark: '#0a0a0a',
  darkCard: '#141414',
  darkBorder: '#2a2a2a',
  mid: '#1e1e1e',
  textPrimary: '#f0f0f0',
  textSec: '#888',
  textTert: '#555',
  warnBg: '#1a1500',
  warnAccent: '#E8FF00',
};

const S = {
  app: {
    background: FZ.dark,
    minHeight: '100vh',
    fontFamily: "'Rajdhani', 'Barlow Condensed', var(--font-sans)",
    color: FZ.textPrimary,
    padding: '0',
  },
  header: {
    borderBottom: `1px solid ${FZ.darkBorder}`,
    padding: '18px 20px 14px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
  },
  logoArea: { display: 'flex', alignItems: 'center', gap: 12 },
  logoIcon: {
    width: 36, height: 36, background: FZ.accent, borderRadius: 4,
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  logoTitle: { fontSize: 22, fontWeight: 700, letterSpacing: '0.04em', color: FZ.textPrimary, lineHeight: 1, textTransform: 'uppercase' },
  logoSub: { fontSize: 11, color: FZ.textSec, letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 2 },
  statRow: { display: 'flex', gap: 20, alignItems: 'center' },
  stat: { textAlign: 'right' },
  statNum: { fontSize: 18, fontWeight: 700, color: FZ.accent, letterSpacing: '0.02em', lineHeight: 1 },
  statLabel: { fontSize: 10, color: FZ.textTert, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 1 },
  tabBar: {
    display: 'flex', borderBottom: `1px solid ${FZ.darkBorder}`,
    padding: '0 20px', gap: 0,
  },
  tab: (active) => ({
    padding: '10px 20px', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em',
    textTransform: 'uppercase', border: 'none', background: 'none', cursor: 'pointer',
    color: active ? FZ.accent : FZ.textSec,
    borderBottom: active ? `2px solid ${FZ.accent}` : '2px solid transparent',
    marginBottom: -1, transition: 'color 0.15s',
  }),
  controls: {
    display: 'flex', gap: 8, padding: '12px 20px', flexWrap: 'wrap',
    alignItems: 'center', borderBottom: `1px solid ${FZ.darkBorder}`,
    background: FZ.mid,
  },
  input: {
    flex: 1, minWidth: 180,
    background: FZ.darkCard, border: `1px solid ${FZ.darkBorder}`,
    borderRadius: 4, color: FZ.textPrimary, padding: '7px 12px', fontSize: 13,
    outline: 'none', fontFamily: 'inherit',
  },
  select: {
    minWidth: 150, background: FZ.darkCard, border: `1px solid ${FZ.darkBorder}`,
    borderRadius: 4, color: FZ.textPrimary, padding: '7px 10px', fontSize: 12,
    outline: 'none', cursor: 'pointer', fontFamily: 'inherit',
  },
  countBadge: {
    marginLeft: 'auto', fontSize: 12, color: FZ.textSec,
    fontWeight: 700, letterSpacing: '0.04em',
  },
  body: { display: 'flex', gap: 0 },
  grid: {
    flex: 1, padding: 16,
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))', gap: 8,
    alignContent: 'start',
  },
  card: (selected) => ({
    background: FZ.darkCard,
    border: `1px solid ${selected ? FZ.accent : FZ.darkBorder}`,
    borderRadius: 6, overflow: 'hidden', cursor: 'pointer',
    transition: 'border-color 0.12s, transform 0.08s',
    outline: selected ? `1px solid ${FZ.accent}` : 'none',
    outlineOffset: -2,
  }),
  swatchWrap: { height: 52, display: 'flex' },
  swatch: (rgb, flex=1) => ({
    flex, background: rgb || '#222', height: '100%',
  }),
  cardBody: { padding: '8px 10px 10px' },
  cardMake: { fontSize: 9, color: FZ.textTert, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 },
  cardName: { fontSize: 13, fontWeight: 700, color: FZ.textPrimary, lineHeight: 1.2, marginBottom: 5 },
  typePill: (warn) => ({
    display: 'inline-block', fontSize: 9, padding: '2px 6px', borderRadius: 2,
    fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
    background: warn ? '#2a1f00' : '#1a1a1a',
    color: warn ? FZ.accent : FZ.textTert,
    border: `1px solid ${warn ? '#3a2d00' : FZ.darkBorder}`,
  }),
  detail: {
    width: 240, flexShrink: 0, borderLeft: `1px solid ${FZ.darkBorder}`,
    background: FZ.mid, padding: 16, alignSelf: 'flex-start',
    position: 'sticky', top: 0,
  },
  detailClose: {
    background: 'none', border: 'none', color: FZ.textSec, cursor: 'pointer',
    fontSize: 18, lineHeight: 1, padding: 0, float: 'right',
  },
  detailMake: { fontSize: 9, color: FZ.textTert, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 },
  detailName: { fontSize: 17, fontWeight: 700, color: FZ.textPrimary, lineHeight: 1.2, marginBottom: 10, clear: 'both' },
  divider: { borderTop: `1px solid ${FZ.darkBorder}`, margin: '12px 0' },
  colorBlock: {
    background: FZ.darkCard, border: `1px solid ${FZ.darkBorder}`,
    borderRadius: 4, marginBottom: 8, overflow: 'hidden',
  },
  colorBlockLabel: {
    padding: '5px 10px', fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '0.08em', color: FZ.textTert, background: '#191919',
    borderBottom: `1px solid ${FZ.darkBorder}`,
  },
  colorBlockSwatch: (rgb) => ({ height: 44, background: rgb || '#222' }),
  colorBlockVals: { padding: '8px 10px' },
  hsbRow: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 },
  hsbLabel: { fontSize: 10, color: FZ.textTert, width: 12, fontWeight: 700, textTransform: 'uppercase' },
  hsbVal: { fontFamily: 'monospace', fontSize: 12, color: FZ.textPrimary, fontWeight: 400, minWidth: 46 },
  hsbDir: { fontSize: 11, color: FZ.accent, fontWeight: 700 },
  warnBox: {
    background: FZ.warnBg, border: `1px solid #2a2000`,
    borderLeft: `3px solid ${FZ.accent}`, borderRadius: 4,
    padding: '8px 10px', fontSize: 11, color: '#c8b830', lineHeight: 1.5, marginBottom: 10,
  },
  guideItem: { marginBottom: 8, lineHeight: 1.4 },
  guideLabel: (active) => ({
    display: 'inline-block', fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '0.06em', padding: '2px 6px', borderRadius: 2, marginBottom: 3,
    background: active ? FZ.accent : '#1a1a1a',
    color: active ? FZ.dark : FZ.textSec,
    border: `1px solid ${active ? FZ.accent : FZ.darkBorder}`,
  }),
  guideDesc: { fontSize: 11, color: FZ.textSec },
  noResults: { gridColumn: '1/-1', textAlign: 'center', padding: '4rem 1rem', color: FZ.textTert, fontSize: 14 },
  pager: {
    gridColumn: '1/-1', display: 'flex', gap: 6, justifyContent: 'center',
    alignItems: 'center', padding: '12px 0',
  },
  pageBtn: {
    background: FZ.darkCard, border: `1px solid ${FZ.darkBorder}`, borderRadius: 3,
    color: FZ.textSec, cursor: 'pointer', padding: '4px 10px', fontSize: 12,
    fontFamily: 'inherit',
  },
  pageInfo: { fontSize: 12, color: FZ.textSec, padding: '0 6px', fontWeight: 700 },
  warningBanner: {
    background: FZ.warnBg, borderBottom: `1px solid #2a2000`,
    padding: '8px 20px', fontSize: 11, color: '#c8b830',
    display: 'flex', alignItems: 'flex-start', gap: 8,
  },
  guidePanel: {
    background: '#0d0d00', borderBottom: `1px solid #2a2000`,
    padding: '12px 20px',
  },
};

function HSBBlock({ label, c, rgb }) {
  if (!c) return null;
  const lum = luminance(rgb);
  const textOnSwatch = lum > 0.45 ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.5)';
  return (
    <div style={S.colorBlock}>
      <div style={S.colorBlockLabel}>{label}</div>
      <div style={{ position: 'relative' }}>
        <div style={S.colorBlockSwatch(rgb)} />
        {rgb && <div style={{ position: 'absolute', bottom: 4, right: 6, fontSize: 9, color: textOnSwatch, fontWeight: 700, letterSpacing: '0.04em' }}>
          H{c.h.toFixed(2)} S{c.s.toFixed(2)} B{c.b.toFixed(2)}
        </div>}
      </div>
      <div style={S.colorBlockVals}>
        {[['H', c.h, c.hd], ['S', c.s, c.sd], ['B', c.b, c.bd]].map(([l, v, d]) => (
          <div key={l} style={S.hsbRow}>
            <span style={S.hsbLabel}>{l}</span>
            <span style={S.hsbVal}>{v.toFixed(3)}</span>
            <span style={S.hsbDir}>{d}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DetailPanel({ color, onClose }) {
  const isMF = color.rawType === 'Metal Flake';
  return (
    <div style={S.detail}>
      <button style={S.detailClose} onClick={onClose} aria-label="Close">×</button>
      <div style={S.detailMake}>{color.make}</div>
      <div style={S.detailName}>{color.name}</div>

      <div style={{ display: 'flex', gap: 5, marginBottom: 12 }}>
        <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '2px 6px', borderRadius: 2, background: '#1a1a1a', color: FZ.textSec, border: `1px solid ${FZ.darkBorder}` }}>
          {color.rawType}
        </span>
        <span style={{ color: FZ.textTert, fontSize: 11, alignSelf: 'center' }}>→</span>
        <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '2px 6px', borderRadius: 2, background: isMF ? '#2a2000' : '#0d1a00', color: isMF ? FZ.accent : '#7db32a', border: `1px solid ${isMF ? '#3a3000' : '#1a2800'}` }}>
          {color.fh6type}
        </span>
      </div>

      {color.warn && <div style={S.warnBox}>⚠ {color.warnMsg}</div>}

      {isMF && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 9, color: FZ.textTert, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, marginBottom: 6 }}>Also try in FH6</div>
          {FLAKE_SUB.map(t => (
            <div key={t} style={{ fontSize: 10, color: t === 'Metal Flake Medium' ? FZ.accent : FZ.textSec, padding: '3px 0', borderBottom: `1px solid ${FZ.darkBorder}` }}>
              {t === 'Metal Flake Medium' ? '▶ ' : '   '}{t}
            </div>
          ))}
        </div>
      )}

      <div style={S.divider} />
      <HSBBlock label="Color 1 (X)" c={color.c1} rgb={color.rgb1} />
      {color.c2 && <HSBBlock label="Color 2 (Y)" c={color.c2} rgb={color.rgb2} />}

      {color.note && (
        <div style={{ marginTop: 10, fontSize: 10, color: FZ.textSec, lineHeight: 1.5, borderLeft: `2px solid ${FZ.darkBorder}`, paddingLeft: 8 }}>
          {color.note}
        </div>
      )}
    </div>
  );
}

function ColorCard({ row, makesArr, typesArr, onSelect, isSelected }) {
  const color = useMemo(() => parseRow(row, makesArr, typesArr), [row]);
  return (
    <div style={S.card(isSelected)} onClick={() => onSelect(color)}>
      <div style={S.swatchWrap}>
        <div style={S.swatch(color.rgb1, color.rgb2 ? 1 : 2)} />
        {color.rgb2 && <div style={S.swatch(color.rgb2, 1)} />}
      </div>
      <div style={S.cardBody}>
        <div style={S.cardMake}>{color.make}</div>
        <div style={S.cardName}>{color.name}</div>
        <span style={S.typePill(color.warn)}>{color.fh6type}</span>
      </div>
    </div>
  );
}

function FlakeGuide() {
  return (
    <div style={S.guidePanel}>
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: FZ.accent, marginBottom: 10 }}>FH6 flake type guide</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
        {Object.entries(FLAKE_GUIDE).map(([type, desc]) => (
          <div key={type} style={S.guideItem}>
            <div style={S.guideLabel(type === 'Metal Flake Medium')}>{type}</div>
            <div style={S.guideDesc}>{desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState('vehicle');
  const [search, setSearch] = useState('');
  const [makeFilter, setMakeFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(null);
  const [guideOpen, setGuideOpen] = useState(false);

  const { makes, types, rows, wmakes, wtypes, wrows } = useMemo(() => ({
    makes: VDATA.makes, types: VDATA.types, rows: VDATA.rows,
    wmakes: WDATA.makes, wtypes: WDATA.types, wrows: WDATA.rows,
  }), []);

  const curMakes = tab === 'vehicle' ? makes : wmakes;
  const curTypes = tab === 'vehicle' ? types : wtypes;
  const curRows  = tab === 'vehicle' ? rows  : wrows;

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return curRows.filter(row => {
      const m = curMakes[row[0]], n = row[1].toLowerCase(), t = curTypes[row[2]];
      if (makeFilter && m !== makeFilter) return false;
      if (typeFilter && t !== typeFilter) return false;
      if (q && !n.includes(q) && !m.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [search, makeFilter, typeFilter, tab, curRows]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const pageRows   = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  const handleTab    = t => { setTab(t); setPage(0); setMakeFilter(''); setTypeFilter(''); setSearch(''); setSelected(null); };
  const handleSelect = useCallback(c => setSelected(s => s && s.make===c.make && s.name===c.name && s.rawType===c.rawType ? null : c), []);

  const inputStyle = { ...S.input, boxSizing: 'border-box' };
  const selectStyle = { ...S.select, boxSizing: 'border-box' };

  return (
    <div style={S.app}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Barlow+Condensed:wght@400;600;700&display=swap" rel="stylesheet" />

      <div style={S.header}>
        <div style={S.logoArea}>
          <div style={S.logoIcon}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="8" stroke="#0a0a0a" strokeWidth="1.5" fill="none"/>
              <circle cx="10" cy="10" r="4" fill="#0a0a0a"/>
              <path d="M10 2v4M10 14v4M2 10h4M14 10h4" stroke="#0a0a0a" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <div style={S.logoTitle}>Paint Database</div>
            <div style={S.logoSub}>Forza Horizon · FH6 Edition</div>
          </div>
        </div>
        <div style={S.statRow}>
          <div style={S.stat}>
            <div style={S.statNum}>10,936</div>
            <div style={S.statLabel}>Colours</div>
          </div>
          <div style={S.stat}>
            <div style={S.statNum}>187</div>
            <div style={S.statLabel}>Makes</div>
          </div>
          <div style={S.stat}>
            <div style={S.statNum}>FH6</div>
            <div style={S.statLabel}>Updated</div>
          </div>
        </div>
      </div>

      <div style={S.warningBanner}>
        <span style={{ color: FZ.accent, flexShrink: 0 }}>⚠</span>
        <span>
          <strong style={{ color: FZ.accent }}>FH6:</strong>{' '}
          Metal Flake is now split into Fine / Medium / Glitter. HSB blend changed — old values need recalibration.
          New <strong style={{ color: FZ.accent }}>Candy</strong> type also available with no legacy data.{' '}
          <button onClick={() => setGuideOpen(o => !o)} style={{ background: 'none', border: 'none', color: FZ.accent, cursor: 'pointer', textDecoration: 'underline', fontSize: 11, padding: 0, fontFamily: 'inherit' }}>
            {guideOpen ? 'Hide guide ↑' : 'Type guide ↓'}
          </button>
        </span>
      </div>

      {guideOpen && <FlakeGuide />}

      <div style={S.tabBar}>
        <button style={S.tab(tab === 'vehicle')} onClick={() => handleTab('vehicle')}>Vehicle colours</button>
        <button style={S.tab(tab === 'wheel')} onClick={() => handleTab('wheel')}>Wheel colours</button>
        <div style={{ marginLeft: 'auto', alignSelf: 'center', fontSize: 11, color: FZ.textTert, fontWeight: 700, letterSpacing: '0.04em' }}>
          {filtered.length.toLocaleString()} results
        </div>
      </div>

      <div style={S.controls}>
        <input
          style={inputStyle} value={search} placeholder="Search colour or make..."
          onChange={e => { setSearch(e.target.value); setPage(0); }}
        />
        <select style={selectStyle} value={makeFilter} onChange={e => { setMakeFilter(e.target.value); setPage(0); }}>
          <option value="">All makes</option>
          {curMakes.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select style={selectStyle} value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(0); }}>
          <option value="">All paint types</option>
          {curTypes.map(t => <option key={t} value={t}>{(FH6_MAP[t]||{}).fh6||t}</option>)}
        </select>
      </div>

      <div style={S.body}>
        {selected && <DetailPanel color={selected} onClose={() => setSelected(null)} />}
        <div style={S.grid}>
          {pageRows.length === 0
            ? <div style={S.noResults}>No colours found</div>
            : pageRows.map((row, i) => (
              <ColorCard
                key={i} row={row} makesArr={curMakes} typesArr={curTypes}
                onSelect={handleSelect}
                isSelected={selected && curMakes[row[0]]===selected.make && row[1]===selected.name && curTypes[row[2]]===selected.rawType}
              />
            ))
          }
          {totalPages > 1 && (
            <div style={S.pager}>
              <button style={S.pageBtn} disabled={page===0} onClick={() => setPage(0)}>«</button>
              <button style={S.pageBtn} disabled={page===0} onClick={() => setPage(p => p-1)}>‹</button>
              <span style={S.pageInfo}>Page {page+1} / {totalPages}</span>
              <button style={S.pageBtn} disabled={page>=totalPages-1} onClick={() => setPage(p => p+1)}>›</button>
              <button style={S.pageBtn} disabled={page>=totalPages-1} onClick={() => setPage(totalPages-1)}>»</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
