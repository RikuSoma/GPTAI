import React from 'react';
import { Mode } from '../types';

interface Props {
  active: Mode;
  labels: Record<Mode, string>;
  onChange: (mode: Mode) => void;
}

export const TabNav: React.FC<Props> = ({ active, onChange, labels }) => (
  <nav className="tabs" aria-label="View mode">
    {(Object.keys(labels) as Mode[]).map((mode) => (
      <button
        key={mode}
        className={`tab ${active === mode ? 'tab--active' : ''}`}
        type="button"
        onClick={() => onChange(mode)}
      >
        {labels[mode]}
      </button>
    ))}
  </nav>
);
