import React from 'react';
import { Brain } from 'lucide-react';

export default function InfoCard() {
  return (
    <div className="how-it-works-card">
      <div className="how-icon-badge">
        <Brain size={22} className="how-icon" />
      </div>
      <div className="how-content">
        <h4>How it works?</h4>
        <p>
          When bright light enters the eye, the pupil constricts (becomes smaller) to reduce the amount of light.
          In dim light, the pupil dilates (becomes larger) to allow more light in.
        </p>
      </div>
    </div>
  );
}
