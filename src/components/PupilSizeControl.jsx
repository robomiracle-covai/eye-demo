import React, { useState } from 'react';
import { Sliders, Sparkles } from 'lucide-react';

function EyeThumbnail({ pupilRadius, label, active, onClick, irisTone = 'brown' }) {
  const isBrown = irisTone === 'brown';

  return (
    <button
      type="button"
      className={`preset-btn ${active ? 'active' : ''}`}
      onClick={onClick}
      title={`Set to ${label} pupil`}
    >
      <div className={`eye-thumbnail-circle ${active ? 'glow' : ''}`}>
        <svg viewBox="0 0 40 40" width="36" height="36" className="eye-svg">
          <defs>
            <radialGradient id={`sclera-${label}-${irisTone}`} cx="50%" cy="50%" r="50%">
              <stop offset="60%" stopColor="#f4f7fb" />
              <stop offset="90%" stopColor="#dce5f0" />
              <stop offset="100%" stopColor="#b8cadc" />
            </radialGradient>

            {isBrown ? (
              <radialGradient id={`iris-${label}-${irisTone}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#1e0f06" />
                <stop offset="50%" stopColor="#5c381c" />
                <stop offset="85%" stopColor="#8a5328" />
                <stop offset="100%" stopColor="#1a0c04" />
              </radialGradient>
            ) : (
              <radialGradient id={`iris-${label}-${irisTone}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#1e3a5f" />
                <stop offset="45%" stopColor="#2563eb" />
                <stop offset="80%" stopColor="#0ea5e9" />
                <stop offset="100%" stopColor="#0f172a" />
              </radialGradient>
            )}
          </defs>

          {/* Sclera */}
          <circle cx="20" cy="20" r="18" fill={`url(#sclera-${label}-${irisTone})`} />

          {/* Iris */}
          <circle
            cx="20"
            cy="20"
            r="13"
            fill={`url(#iris-${label}-${irisTone})`}
            stroke={isBrown ? '#1c0c04' : '#0f2942'}
            strokeWidth="0.8"
          />

          {/* Radial iris stroma lines */}
          <circle
            cx="20"
            cy="20"
            r="10"
            fill="none"
            stroke={isBrown ? '#b4743e' : '#60a5fa'}
            strokeWidth="0.5"
            strokeDasharray="1.5,1.5"
            opacity="0.65"
          />

          {/* Pupil */}
          <circle cx="20" cy="20" r={pupilRadius} fill="#050810" />

          {/* Specular gloss */}
          <ellipse cx="16.5" cy="15.5" rx="2.5" ry="1.8" fill="#ffffff" opacity="0.85" transform="rotate(-15 16.5 15.5)" />
          <circle cx="23" cy="23.5" r="1" fill="#ffffff" opacity="0.5" />
        </svg>
      </div>
      <span className="preset-label">{label}</span>
    </button>
  );
}

export default function PupilSizeControl({
  pupilSize,
  onPupilChange,
  onPresetClick,
  irisTone = 'brown',
  onIrisToneChange,
  reflexSpeed = 6.0,
  onReflexSpeedChange,
  dilationRange = 1.0,
  onDilationRangeChange
}) {
  const [showTuning, setShowTuning] = useState(false);

  const isMin = pupilSize <= 0.25;
  const isNormal = pupilSize > 0.25 && pupilSize < 0.75;
  const isMax = pupilSize >= 0.75;

  return (
    <div className="control-card pupil-control-card">
      <div className="card-title justify-between">
        <div className="title-left">
          <span className="title-icon">👁️</span>
          <h3>Pupil Size Control</h3>
        </div>
        <button
          className={`tuning-toggle-btn ${showTuning ? 'active' : ''}`}
          onClick={() => setShowTuning(!showTuning)}
          title="Adjust pupil action parameters"
        >
          <Sliders size={13} />
          <span>Tune Action</span>
        </button>
      </div>

      <div className="slider-container">
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={pupilSize}
          onChange={(e) => onPupilChange(parseFloat(e.target.value))}
          className="pupil-slider"
          style={{
            background: `linear-gradient(to right, #0077ff 0%, #00d2ff ${pupilSize * 100}%, #1e293b ${pupilSize * 100}%, #1e293b 100%)`
          }}
        />
        <div className="slider-labels">
          <span className="slider-label">Small<br /><span className="sub">(Contract)</span></span>
          <span className="slider-label right">Large<br /><span className="sub">(Dilate)</span></span>
        </div>
      </div>

      <div className="presets-row">
        <EyeThumbnail
          pupilRadius={3.5}
          label="Min"
          active={isMin}
          onClick={() => onPresetClick(0.12)}
          irisTone={irisTone}
        />
        <EyeThumbnail
          pupilRadius={6.5}
          label="Normal"
          active={isNormal}
          onClick={() => onPresetClick(0.50)}
          irisTone={irisTone}
        />
        <EyeThumbnail
          pupilRadius={10.5}
          label="Max"
          active={isMax}
          onClick={() => onPresetClick(0.90)}
          irisTone={irisTone}
        />
      </div>

      {/* Expandable Pupil Action Tuning Panel */}
      {showTuning && (
        <div className="tuning-panel">
          <div className="tuning-row">
            <span className="tuning-label">Reflex Speed:</span>
            <div className="tuning-pill-group">
              <button
                className={`tuning-pill ${reflexSpeed === 3.5 ? 'active' : ''}`}
                onClick={() => onReflexSpeedChange(3.5)}
              >
                Smooth
              </button>
              <button
                className={`tuning-pill ${reflexSpeed === 6.0 ? 'active' : ''}`}
                onClick={() => onReflexSpeedChange(6.0)}
              >
                Natural
              </button>
              <button
                className={`tuning-pill ${reflexSpeed === 10.0 ? 'active' : ''}`}
                onClick={() => onReflexSpeedChange(10.0)}
              >
                Instant
              </button>
            </div>
          </div>

          <div className="tuning-row">
            <span className="tuning-label">Iris Tone:</span>
            <div className="tuning-pill-group">
              <button
                className={`tuning-pill ${irisTone === 'brown' ? 'active' : ''}`}
                onClick={() => onIrisToneChange('brown')}
              >
                Deep Brown
              </button>
              <button
                className={`tuning-pill ${irisTone === 'blue' ? 'active' : ''}`}
                onClick={() => onIrisToneChange('blue')}
              >
                Blue
              </button>
            </div>
          </div>

          <div className="tuning-row">
            <span className="tuning-label">Dilation Range:</span>
            <input
              type="range"
              min="0.7"
              max="1.3"
              step="0.05"
              value={dilationRange}
              onChange={(e) => onDilationRangeChange(parseFloat(e.target.value))}
              className="mini-slider"
            />
            <span className="tuning-value">{(dilationRange * 100).toFixed(0)}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
