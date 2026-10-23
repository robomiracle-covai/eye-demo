import React from 'react';
import { Lightbulb, Sun, PlayCircle } from 'lucide-react';

export default function LightControls({ lightState, isAuto, onSetLight, onToggleAuto }) {
  return (
    <div className="control-card light-control-card">
      <div className="card-title">
        <span className="title-icon">💡</span>
        <h3>Light Control</h3>
      </div>

      <div className="light-buttons-grid">
        <button
          className={`mode-btn ${!isAuto && lightState === 'off' ? 'active' : ''}`}
          onClick={() => onSetLight('off')}
        >
          <Lightbulb size={24} className="mode-btn-icon" />
          <span className="mode-btn-label">Off</span>
          <span className="mode-btn-sub">(Dark)</span>
        </button>

        <button
          className={`mode-btn ${!isAuto && lightState === 'on' ? 'active' : ''}`}
          onClick={() => onSetLight('on')}
        >
          <Sun size={24} className="mode-btn-icon" />
          <span className="mode-btn-label">On</span>
          <span className="mode-btn-sub">(Bright)</span>
        </button>

        <button
          className={`mode-btn ${isAuto ? 'active' : ''}`}
          onClick={onToggleAuto}
        >
          <PlayCircle size={24} className="mode-btn-icon" />
          <span className="mode-btn-label">Auto</span>
          <span className="mode-btn-sub">(Demo)</span>
        </button>
      </div>
    </div>
  );
}
