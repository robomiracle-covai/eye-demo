import React from 'react';
import { ZoomIn, ZoomOut, Home } from 'lucide-react';

export default function CameraControls({ onZoomIn, onZoomOut, onResetView }) {
  return (
    <div className="control-card zoom-control-card">
      <div className="card-title">
        <span className="title-icon">🔍</span>
        <h3>Zoom Control</h3>
      </div>

      <div className="zoom-buttons-list">
        <button className="zoom-btn" onClick={onZoomIn} title="Zoom In to eyes">
          <ZoomIn size={18} className="zoom-btn-icon" />
          <span>Zoom In</span>
        </button>

        <button className="zoom-btn" onClick={onZoomOut} title="Zoom Out to view face">
          <ZoomOut size={18} className="zoom-btn-icon" />
          <span>Zoom Out</span>
        </button>

        <button className="zoom-btn" onClick={onResetView} title="Reset camera view to default">
          <Home size={18} className="zoom-btn-icon" />
          <span>Reset View</span>
        </button>
      </div>
    </div>
  );
}
