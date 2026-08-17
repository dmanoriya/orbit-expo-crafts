'use client';

import React, { useState, useEffect } from 'react';

const THEMES = [
  { id: 'gilda', label: 'Gilda Warm Cream — luxury default', brand: '#a7895c', accent: '#342d25', deep: '#181512', bg: '#FAF7F2' },
  { id: 'darkgilda', label: 'Gilda Dark Espresso — dark UI', brand: '#a7895c', accent: '#342d25', deep: '#0C0A09', bg: '#141210' },
  { id: 'peacock', label: 'Gallery Neutral', brand: '#0E5C63', accent: '#8A6A2E', deep: '#1A1918', bg: '#FAF8F4' },
  { id: 'gulmohar', label: 'Gulmohar Flame', brand: '#B8412A', accent: '#12595E', deep: '#2A1D18', bg: '#FDF8F2' },
  { id: 'jewel', label: 'Plum Jewel', brand: '#7A2E4E', accent: '#0E6E6E', deep: '#241A2B', bg: '#FAF4E9' },
  { id: 'sage', label: 'Sage Terracotta', brand: '#3F5A2E', accent: '#B5502C', deep: '#1B2618', bg: '#FAF7EE' }
];

export const ThemeLab: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTheme, setActiveTheme] = useState('gilda');
  const [brandColor, setBrandColor] = useState('#a7895c');
  const [accentColor, setAccentColor] = useState('#342d25');
  const [deepColor, setDeepColor] = useState('#181512');

  useEffect(() => {
    document.documentElement.dataset.theme = activeTheme;
  }, [activeTheme]);

  const handleSelectTheme = (themeId: string) => {
    const t = THEMES.find((x) => x.id === themeId);
    if (!t) return;
    setActiveTheme(themeId);
    setBrandColor(t.brand);
    setAccentColor(t.accent);
    setDeepColor(t.deep);

    document.documentElement.dataset.theme = themeId;
    document.documentElement.style.removeProperty('--brand');
    document.documentElement.style.removeProperty('--accent');
    document.documentElement.style.removeProperty('--deep');
  };

  const handleColorChange = (key: 'brand' | 'accent' | 'deep', hex: string) => {
    if (key === 'brand') setBrandColor(hex);
    if (key === 'accent') setAccentColor(hex);
    if (key === 'deep') setDeepColor(hex);
    document.documentElement.style.setProperty(`--${key}`, hex);
  };

  return (
    <div className="lab">
      <div className={`lab-panel ${isOpen ? 'on' : ''}`}>
        <h5>Theme Lab</h5>
        <p>Every colour on this site is a token. Pick a preset or set your own — the whole UI retints instantly.</p>

        <div className="theme-row">
          {THEMES.map((t) => (
            <button
              key={t.id}
              className={`tsw ${activeTheme === t.id ? 'on' : ''}`}
              title={t.label}
              onClick={() => handleSelectTheme(t.id)}
            >
              <span style={{ background: t.deep }} />
              <span style={{ background: t.brand }} />
              <span style={{ background: t.accent }} />
              <span style={{ background: t.bg }} />
            </button>
          ))}
        </div>

        <div className="field">
          <label>Primary Button / Brand</label>
          <div className="colorrow">
            <input
              type="color"
              value={brandColor}
              onChange={(e) => handleColorChange('brand', e.target.value)}
            />
            <code>{brandColor.toUpperCase()}</code>
          </div>
        </div>

        <div className="field">
          <label>Hover Accent Color</label>
          <div className="colorrow">
            <input
              type="color"
              value={accentColor}
              onChange={(e) => handleColorChange('accent', e.target.value)}
            />
            <code>{accentColor.toUpperCase()}</code>
          </div>
        </div>

        <div className="field" style={{ marginBottom: 0 }}>
          <label>Deep / Hero & Footer</label>
          <div className="colorrow">
            <input
              type="color"
              value={deepColor}
              onChange={(e) => handleColorChange('deep', e.target.value)}
            />
            <code>{deepColor.toUpperCase()}</code>
          </div>
        </div>
      </div>

      <button
        className="lab-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Toggle Theme Lab"
      >
        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 3a9 9 0 000 18c1.4 0 2-1 1.4-2-.7-1.2.2-2.5 1.6-2.5H18a3 3 0 003-3A9 9 0 0012 3z" />
        </svg>
      </button>
    </div>
  );
};
