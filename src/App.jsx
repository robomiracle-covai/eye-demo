import React, { useState, useEffect, useRef, useCallback } from 'react';
import Header from './components/Header';
import FaceViewer3D from './components/FaceViewer3D';
import LightControls from './components/LightControls';
import PupilSizeControl from './components/PupilSizeControl';
import CameraControls from './components/CameraControls';
import InfoCard from './components/InfoCard';
import AboutModal from './components/AboutModal';
import './App.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('interactive'); // 'interactive' | 'auto' | 'about'
  const [lightState, setLightState] = useState('on'); // 'off' | 'on'
  const [pupilSize, setPupilSize] = useState(0.50); // 0.0 to 1.0 (0.50 is Normal)
  const [zoomLevel, setZoomLevel] = useState(0.5); // 0.0 (far) to 1.0 (close)
  const [autoPhase, setAutoPhase] = useState('bright'); // 'bright' | 'dim'
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [resetViewTrigger, setResetViewTrigger] = useState(0);

  // Model Profile & Custom Model Import
  const [modelProfile, setModelProfile] = useState('macro_eye'); // Default to 3D Eyeball Model!
  const [irisTone, setIrisTone] = useState('brown'); // 'brown' | 'blue'
  const [reflexSpeed, setReflexSpeed] = useState(6.0); // 3.5 (smooth), 6.0 (natural), 10.0 (fast)
  const [dilationRange, setDilationRange] = useState(1.0); // 0.7 to 1.3
  const [customModelUrl, setCustomModelUrl] = useState(null);
  const [customModelName, setCustomModelName] = useState(null);

  const isAuto = activeTab === 'auto';
  const autoTimeoutRef = useRef(null);
  const reflexDelayRef = useRef(null);

  // Switch to manual mode whenever user intervenes
  const switchToManual = useCallback(() => {
    if (activeTab === 'auto') {
      setActiveTab('interactive');
    }
  }, [activeTab]);

  // Handle Light Mode Clicks
  const handleSetLight = useCallback((state) => {
    switchToManual();
    setLightState(state);
    if (state === 'off') {
      setPupilSize(0.88);
    } else {
      setPupilSize(0.16);
    }
  }, [switchToManual]);

  // Toggle Auto Demo
  const handleToggleAuto = useCallback(() => {
    if (activeTab === 'auto') {
      setActiveTab('interactive');
    } else {
      setActiveTab('auto');
    }
  }, [activeTab]);

  // Handle Tab navigation
  const handleSelectTab = useCallback((tab) => {
    if (tab === 'about') {
      setIsAboutOpen(true);
    } else {
      setActiveTab(tab);
    }
  }, []);

  // Handle Model Profile selection
  const handleSelectProfile = useCallback((profile) => {
    setModelProfile(profile);
    if (profile === 'indian') {
      setIrisTone('brown');
    } else {
      setIrisTone('blue');
    }
    if (customModelUrl) {
      setCustomModelUrl(null);
      setCustomModelName(null);
    }
  }, [customModelUrl]);

  // Handle Custom 3D Model File Import
  const handleImportModel = useCallback((file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCustomModelUrl(url);
    setCustomModelName(file.name);
  }, []);

  // Handle Pupil Slider change
  const handlePupilChange = useCallback((value) => {
    switchToManual();
    setPupilSize(value);
  }, [switchToManual]);

  // Handle Pupil Preset click
  const handlePresetClick = useCallback((presetVal) => {
    switchToManual();
    setPupilSize(presetVal);
  }, [switchToManual]);

  // Handle Zoom In / Out / Reset
  const handleZoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.min(1.0, prev + 0.15));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel((prev) => Math.max(0.0, prev - 0.15));
  }, []);

  const handleResetView = useCallback(() => {
    setZoomLevel(0.5);
    setResetViewTrigger((c) => c + 1);
  }, []);

  // Auto Demo Loop
  useEffect(() => {
    if (!isAuto) {
      clearTimeout(autoTimeoutRef.current);
      clearTimeout(reflexDelayRef.current);
      return;
    }

    let phase = 'bright';
    setAutoPhase('bright');
    setLightState('on');
    setPupilSize(0.16);

    const stepAuto = () => {
      if (phase === 'bright') {
        phase = 'dim';
        setAutoPhase('dim');
        setLightState('off');
        reflexDelayRef.current = setTimeout(() => {
          setPupilSize(0.88);
        }, 240);
      } else {
        phase = 'bright';
        setAutoPhase('bright');
        setLightState('on');
        reflexDelayRef.current = setTimeout(() => {
          setPupilSize(0.16);
        }, 200);
      }

      autoTimeoutRef.current = setTimeout(stepAuto, 3800);
    };

    autoTimeoutRef.current = setTimeout(stepAuto, 3800);

    return () => {
      clearTimeout(autoTimeoutRef.current);
      clearTimeout(reflexDelayRef.current);
    };
  }, [isAuto]);

  return (
    <div className="app-wrapper">
      {/* 1. Header with Model Selector & Import */}
      <Header
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        modelProfile={modelProfile}
        onSelectProfile={handleSelectProfile}
        onImportModel={handleImportModel}
        customModelName={customModelName}
      />

      {/* 2. Main 3D Face Viewport with Indian Boy / Custom model */}
      <FaceViewer3D
        pupilSize={pupilSize}
        lightState={lightState}
        isAuto={isAuto}
        autoPhase={autoPhase}
        zoomLevel={zoomLevel}
        onZoomChange={setZoomLevel}
        onResetViewTrigger={resetViewTrigger}
        modelProfile={modelProfile}
        irisTone={irisTone}
        reflexSpeed={reflexSpeed}
        dilationRange={dilationRange}
        customModelUrl={customModelUrl}
        onFileDrop={handleImportModel}
        onPupilChange={setPupilSize}
        onLightStateChange={setLightState}
      />

      {/* 3. Three-column interactive controls */}
      <div className="controls-grid">
        <LightControls
          lightState={lightState}
          isAuto={isAuto}
          onSetLight={handleSetLight}
          onToggleAuto={handleToggleAuto}
        />

        <PupilSizeControl
          pupilSize={pupilSize}
          onPupilChange={handlePupilChange}
          onPresetClick={handlePresetClick}
          irisTone={irisTone}
          onIrisToneChange={setIrisTone}
          reflexSpeed={reflexSpeed}
          onReflexSpeedChange={setReflexSpeed}
          dilationRange={dilationRange}
          onDilationRangeChange={setDilationRange}
        />

        <CameraControls
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetView={handleResetView}
        />
      </div>

      {/* 4. Bottom Educational "How it works?" Card */}
      <InfoCard />

      {/* 5. Medical Information Dialog */}
      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />
    </div>
  );
}
