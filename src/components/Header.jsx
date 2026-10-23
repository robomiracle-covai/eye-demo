import React, { useRef } from 'react';
import { Eye, Hand, Play, Info, Upload, User, Sparkles } from 'lucide-react';

export default function Header({
  activeTab,
  onSelectTab,
  modelProfile,
  onSelectProfile,
  onImportModel,
  customModelName
}) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportModel(file);
    }
  };

  return (
    <header className="app-header">
      <div className="header-brand">
        <div className="logo-badge">
          <div className="logo-iris">
            <div className="logo-pupil" />
          </div>
        </div>
        <div className="brand-text">
          <h1>Human Eye Light Reflex Demo</h1>
          <p>Hardware-Driven 3D Simulation • Arduino Proximity & Light Reflex</p>
        </div>
      </div>

      <div className="header-actions">
        {/* Model Profile Switcher & Import */}
        <div className="model-switcher-group">
          <button
            className={`model-pill-btn ${modelProfile === 'macro_eye' ? 'active' : ''}`}
            onClick={() => onSelectProfile('macro_eye')}
            title="Switch to 3D Photorealistic Human Eyeball (4K PBR Model)"
          >
            <Eye size={13} className="sparkle-icon" />
            <span>3D Eyeball</span>
          </button>

          <button
            className={`model-pill-btn ${modelProfile === 'indian' ? 'active' : ''}`}
            onClick={() => onSelectProfile('indian')}
            title="Switch to Indian Boy model (South Asian complexion & deep brown eyes)"
          >
            <span className="flag-icon">🇮🇳</span>
            <span>Indian Boy</span>
          </button>

          <button
            className={`model-pill-btn ${modelProfile === 'vitruvian' ? 'active' : ''}`}
            onClick={() => onSelectProfile('vitruvian')}
            title="Switch to Vitruvian CC0 model"
          >
            <Sparkles size={12} />
            <span>Vitruvian</span>
          </button>

          <button
            className={`model-pill-btn import-btn ${customModelName ? 'active' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            title="Import custom 3D model (.glb / .gltf)"
          >
            <Upload size={13} />
            <span>{customModelName ? customModelName.slice(0, 8) + '...' : 'Import'}</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".glb,.gltf"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>

        {/* Navigation Tabs */}
        <nav className="header-nav">
          <button
            className={`nav-tab ${activeTab === 'interactive' ? 'active' : ''}`}
            onClick={() => onSelectTab('interactive')}
          >
            <Hand size={14} className="tab-icon" />
            <span>Interactive</span>
          </button>

          <button
            className={`nav-tab ${activeTab === 'auto' ? 'active' : ''}`}
            onClick={() => onSelectTab('auto')}
          >
            <Play size={13} className="tab-icon" />
            <span>Auto Demo</span>
          </button>

          <button
            className={`nav-tab ${activeTab === 'about' ? 'active' : ''}`}
            onClick={() => onSelectTab('about')}
          >
            <Info size={14} className="tab-icon" />
            <span>About</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
