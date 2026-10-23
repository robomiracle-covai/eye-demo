import React from 'react';
import { X, BookOpen, Activity, ShieldCheck, Zap } from 'lucide-react';

export default function AboutModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <BookOpen size={20} className="modal-title-icon" />
            <h2>Pupillary Light Reflex (PLR)</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close dialog">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-section">
            <h3><Zap size={16} /> Physiological Mechanism</h3>
            <p>
              The pupillary light reflex (PLR) is an autonomic, involuntary reflex that regulates the intensity of light entering the retina by constricting or dilating the pupil.
            </p>
            <div className="pathway-grid">
              <div className="pathway-card">
                <span className="step-tag">1. Afferent Pathway</span>
                <strong>Optic Nerve (CN II)</strong>
                <p>Retinal ganglion cells detect ambient light luminance and transmit electrical impulses via the optic nerve to the pretectal nucleus in the midbrain.</p>
              </div>
              <div className="pathway-card">
                <span className="step-tag">2. Midbrain Integration</span>
                <strong>Edinger-Westphal Nucleus</strong>
                <p>Pretectal neurons project bilaterally to both Edinger-Westphal nuclei, explaining why both pupils react simultaneously (consensual reflex).</p>
              </div>
              <div className="pathway-card">
                <span className="step-tag">3. Efferent Pathway</span>
                <strong>Oculomotor Nerve (CN III)</strong>
                <p>Parasympathetic fibers travel through CN III to the ciliary ganglion and innervate the <em>sphincter pupillae</em> muscle, inducing pupillary constriction (miosis).</p>
              </div>
            </div>
          </div>

          <div className="modal-section">
            <h3><Activity size={16} /> Consensual vs Direct Reflex</h3>
            <p>
              • <strong>Direct light reflex:</strong> Pupillary constriction in the eye receiving direct illumination.<br />
              • <strong>Consensual light reflex:</strong> Simultaneous pupillary constriction in the opposite, unilluminated eye due to bilateral nerve fiber decussation in the pretectal area.
            </p>
          </div>

          <div className="modal-section">
            <h3><ShieldCheck size={16} /> Clinical Significance: PERRLA</h3>
            <p>
              Medical practitioners evaluate the pupillary reflex using the penlight test (often documented as <strong>PERRLA</strong>: <em>Pupils Equal, Round, Reactive to Light, and Accommodation</em>).
              Asymmetry or sluggishness can indicate brainstem trauma, increased intracranial pressure (ICP), optic neuritis, or pharmacological influences.
            </p>
          </div>
        </div>

        <div className="modal-footer">
          <button className="modal-primary-btn" onClick={onClose}>
            Back to Simulation
          </button>
        </div>
      </div>
    </div>
  );
}
