import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Maximize2, Minimize2, Sun, Moon, Plus, Minus, UploadCloud, Cpu, Radio } from 'lucide-react';

export default function FaceViewer3D({
  pupilSize, // 0.0 to 1.0
  lightState, // 'off' | 'on'
  isAuto,
  autoPhase, // 'bright' | 'dim'
  zoomLevel, // 0.0 (far) to 1.0 (close)
  onZoomChange,
  onResetViewTrigger,
  modelProfile = 'macro_eye', // 'macro_eye' | 'indian' | 'vitruvian' | 'default'
  irisTone = 'brown', // 'brown' | 'blue'
  reflexSpeed = 6.0,
  dilationRange = 1.0,
  customModelUrl = null,
  onFileDrop = null,
  onPupilChange = null,
  onLightStateChange = null
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Arduino Web Serial States
  const [serialConnected, setSerialConnected] = useState(false);
  const [sensorDistance, setSensorDistance] = useState(null);
  const [sensorIntensity, setSensorIntensity] = useState(null);
  const serialPortRef = useRef(null);

  // References for scene & animation
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const rendererRef = useRef(null);
  const currentModelRef = useRef(null);
  const eyeShadersRef = useRef([]);
  const lightsRef = useRef({});
  const headMeshesRef = useRef([]);
  const hairMeshesRef = useRef([]);

  // Animation values & Prop tracking refs (prevents stale closure in animate loop)
  const targetPupilRef = useRef(pupilSize);
  const currentPupilRef = useRef(pupilSize);
  const lightStateRef = useRef(lightState);
  const reflexSpeedRef = useRef(reflexSpeed);
  const currentLightIntensityRef = useRef(lightState === 'on' ? 2.8 : 0.70);
  const targetCamDistanceRef = useRef(0.24);
  const eyeCenterRef = useRef(new THREE.Vector3(0.0, 0.0, 0.0));

  // Keep tracking refs synchronized whenever props change
  useEffect(() => {
    targetPupilRef.current = pupilSize;
  }, [pupilSize]);

  useEffect(() => {
    lightStateRef.current = lightState;
  }, [lightState]);

  useEffect(() => {
    reflexSpeedRef.current = reflexSpeed;
  }, [reflexSpeed]);

  const MIN_DIST = 0.08;
  const MAX_DIST = 0.42;
  const DEFAULT_DIST = modelProfile === 'macro_eye' ? 0.28 : 0.24;

  // Web Serial Port Connect Function
  const connectArduino = async () => {
    if (!('serial' in navigator)) {
      alert('Web Serial is supported in Google Chrome and Microsoft Edge. Please open this page in Chrome or Edge!');
      return;
    }

    try {
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 9600 });
      serialPortRef.current = port;
      setSerialConnected(true);

      const textDecoder = new TextDecoderStream();
      port.readable.pipeTo(textDecoder.writable);
      const reader = textDecoder.readable.getReader();

      let buffer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += value;
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep last incomplete chunk

        for (const line of lines) {
          // Output format from arduino.ino: "8.5 cm     | 495      | 98%        | Close"
          const distMatch = line.match(/([\d.]+)\s*cm/i);
          const intMatch = line.match(/(\d+)%/);

          const dist = distMatch ? parseFloat(distMatch[1]) : null;
          const intensity = intMatch ? parseInt(intMatch[1], 10) : null;

          if (dist !== null && !isNaN(dist) && dist > 0) {
            setSensorDistance(dist.toFixed(1));
            if (intensity !== null) setSensorIntensity(intensity);

            // Distance mapping:
            // <= 5cm: Penlight very close -> Light Intensity 100%, Pupil Constricted (0.12)
            // >= 32cm: Penlight far/withdrawn -> Light Intensity 0%, Pupil Dilated (0.90)
            const factor = Math.max(0, Math.min(1, (dist - 5) / (32 - 5)));
            // factor 0 = close (constrict), 1 = far (dilate)
            const targetPupil = 0.12 + factor * (0.90 - 0.12);
            const targetLight = dist < 18 ? 'on' : 'off';

            if (onPupilChange) onPupilChange(targetPupil);
            if (onLightStateChange) onLightStateChange(targetLight);
          }
        }
      }
    } catch (err) {
      console.error('Serial connection error:', err);
      setSerialConnected(false);
    }
  };

  // Keyboard shortcut: Spacebar toggles light on/off as client demo backup
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT') return;
      if (e.code === 'Space' || e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        if (onLightStateChange) {
          const next = lightState === 'on' ? 'off' : 'on';
          onLightStateChange(next);
          if (onPupilChange) onPupilChange(next === 'on' ? 0.15 : 0.88);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightState, onLightStateChange, onPupilChange]);

  // Handle zoomLevel changes
  useEffect(() => {
    if (typeof zoomLevel === 'number') {
      const dist = MAX_DIST - zoomLevel * (MAX_DIST - MIN_DIST);
      targetCamDistanceRef.current = dist;
    }
  }, [zoomLevel]);

  // Handle reset view
  useEffect(() => {
    if (onResetViewTrigger && cameraRef.current && controlsRef.current) {
      targetCamDistanceRef.current = DEFAULT_DIST;
      const center = eyeCenterRef.current;
      controlsRef.current.target.copy(center);
      cameraRef.current.position.set(center.x, center.y, center.z + DEFAULT_DIST);
      controlsRef.current.update();
      if (onZoomChange) {
        const normZoom = (MAX_DIST - DEFAULT_DIST) / (MAX_DIST - MIN_DIST);
        onZoomChange(normZoom);
      }
    }
  }, [onResetViewTrigger, onZoomChange, DEFAULT_DIST]);

  // Update appearance based on modelProfile & irisTone
  useEffect(() => {
    const isIndian = modelProfile === 'indian';

    headMeshesRef.current.forEach((mesh) => {
      if (mesh.material && modelProfile !== 'vitruvian' && modelProfile !== 'macro_eye') {
        if (isIndian) {
          mesh.material.color.setRGB(0.86, 0.70, 0.58);
        } else {
          mesh.material.color.setRGB(1.0, 1.0, 1.0);
        }
      }
    });

    hairMeshesRef.current.forEach((mesh) => {
      if (mesh.material) {
        if (isIndian) {
          mesh.material.color.setRGB(0.06, 0.06, 0.07);
        } else {
          mesh.material.color.setRGB(0.4, 0.28, 0.18);
        }
      }
    });

    eyeShadersRef.current.forEach((shader) => {
      if (shader.uniforms.uIrisTone) {
        shader.uniforms.uIrisTone.value = irisTone === 'brown' || isIndian ? 1.0 : 0.0;
      }
      if (shader.uniforms.uDilationRange) {
        shader.uniforms.uDilationRange.value = dilationRange;
      }
    });
  }, [modelProfile, irisTone, dilationRange]);

  // Function to configure eye material and pupil shader
  const setupEyeMaterial = useCallback((mat) => {
    mat.roughness = 0.08;
    mat.metalness = 0.0;
    mat.envMapIntensity = 1.4;
    mat.customProgramCacheKey = () => 'pupil_warp_v3';

    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uPupilDilation = { value: currentPupilRef.current };
      shader.uniforms.uIrisTone = { value: irisTone === 'brown' || modelProfile === 'indian' ? 1.0 : 0.0 };
      shader.uniforms.uDilationRange = { value: dilationRange };
      eyeShadersRef.current.push(shader);

      shader.fragmentShader = `
        uniform float uPupilDilation;
        uniform float uIrisTone;
        uniform float uDilationRange;
      ` + shader.fragmentShader;

      const pupilWarpCode = `
      #ifdef USE_MAP
        vec2 wrappedUv = fract(vMapUv);
        vec2 eyeCenter = vec2(0.502, 0.500);
        vec2 uvDelta = wrappedUv - eyeCenter;
        float r = length(uvDelta);
        float rLimbus = 0.20;

        // Dynamic pupil dilation power warp
        float effectiveDilation = clamp(uPupilDilation * uDilationRange, 0.0, 1.0);
        float warp = mix(0.42, 1.85, effectiveDilation);

        vec2 warpedUv = wrappedUv;
        if (r < rLimbus && r > 0.0001) {
          float normR = r / rLimbus;
          float warpedNormR = pow(normR, warp);
          warpedUv = eyeCenter + (uvDelta / r) * (warpedNormR * rLimbus);
        }

        vec4 sampledDiffuseColor = texture2D( map, warpedUv );

        // Authentic Indian Brown Iris Stroma if selected
        if (r < rLimbus && uIrisTone > 0.5) {
          float lum = dot(sampledDiffuseColor.rgb, vec3(0.299, 0.587, 0.114));
          vec3 darkBrown = vec3(0.12, 0.06, 0.03);
          vec3 amberBrown = vec3(0.52, 0.32, 0.15);
          vec3 indianIris = mix(darkBrown, amberBrown, pow(lum, 1.1));
          sampledDiffuseColor.rgb = indianIris;
        }

        // Deep obsidian pupil core with soft antialiased edge
        float pupilAperture = mix(0.024, 0.150, effectiveDilation);
        float pupilEdge = smoothstep(pupilAperture - 0.007, pupilAperture + 0.007, r);
        sampledDiffuseColor.rgb = mix(vec3(0.005, 0.005, 0.008), sampledDiffuseColor.rgb, pupilEdge);

        #ifdef DECODE_VIDEO_TEXTURE
        #endif
        diffuseColor *= sampledDiffuseColor;
      #endif
      `;

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <map_fragment>',
        pupilWarpCode
      );
    };
  }, [irisTone, modelProfile, dilationRange]);

  // Load Model helper
  const loadModel = useCallback((profile, customUrl = null) => {
    setIsLoading(true);
    setLoadError(null);
    eyeShadersRef.current = [];
    headMeshesRef.current = [];
    hairMeshesRef.current = [];

    const isMacroEye = profile === 'macro_eye' && !customUrl;
    const isVitruvian = profile === 'vitruvian' && !customUrl;

    let modelUrl = customUrl;
    if (!modelUrl) {
      if (isMacroEye) modelUrl = '/models/realistic_human_eye.glb';
      else if (isVitruvian) modelUrl = '/models/vitruvian_head.glb';
      else modelUrl = '/models/avaturn.glb';
    }

    const loader = new GLTFLoader();
    const texLoader = new THREE.TextureLoader();

    loader.load(
      modelUrl,
      (gltf) => {
        if (!sceneRef.current) return;

        if (currentModelRef.current) {
          sceneRef.current.remove(currentModelRef.current);
          currentModelRef.current = null;
        }

        const root = gltf.scene;
        let modelToDisplay = root;
        let detectedEyes = [];

        if (isMacroEye) {
          // --- 4K Photorealistic Eyeball Model ---
          // Preload textures with RepeatWrapping for UDIM tile support
          const eyeColor = texLoader.load('/models/textures/embedded_eye.jpg');
          eyeColor.colorSpace = THREE.SRGBColorSpace;
          eyeColor.flipY = false;
          eyeColor.wrapS = THREE.RepeatWrapping;
          eyeColor.wrapT = THREE.RepeatWrapping;

          const eyeBump = texLoader.load('/models/textures/eyeBump.jpg');
          eyeBump.flipY = false;
          eyeBump.wrapS = THREE.RepeatWrapping;
          eyeBump.wrapT = THREE.RepeatWrapping;

          const eyeSpec = texLoader.load('/models/textures/eyeSpecular.jpg');
          eyeSpec.flipY = false;
          eyeSpec.wrapS = THREE.RepeatWrapping;
          eyeSpec.wrapT = THREE.RepeatWrapping;

          // 1. Reset root transforms
          root.position.set(0, 0, 0);
          root.rotation.set(0, 0, 0);
          root.scale.set(1, 1, 1);
          root.updateMatrixWorld(true);

          // 2. Compute exact bounding box of the eye model
          const bbox = new THREE.Box3().setFromObject(root);
          const center = new THREE.Vector3();
          bbox.getCenter(center);
          const size = new THREE.Vector3();
          bbox.getSize(size);

          // 3. Create a wrapper pivot group and center root inside it
          const pivot = new THREE.Group();
          pivot.name = 'macro_eye_pivot';
          root.position.sub(center); // shifts eyeball geometry center to (0, 0, 0)
          pivot.add(root);

          // 4. Scale pivot so diameter is comfortably visible (~0.16m)
          const maxDim = Math.max(size.x, size.y, size.z);
          if (maxDim > 0.0001) {
            const s = 0.16 / maxDim;
            pivot.scale.set(s, s, s);
          }

          modelToDisplay = pivot;

          root.traverse((child) => {
            if (child.isMesh) {
              if (child.name.includes('Eye_2')) {
                // Inner Eyeball globe: apply 4K textures & dynamic pupil shader
                child.material = new THREE.MeshStandardMaterial({
                  map: eyeColor,
                  bumpMap: eyeBump,
                  bumpScale: 0.02,
                  roughnessMap: eyeSpec,
                  roughness: 0.12,
                  metalness: 0.0
                });
                setupEyeMaterial(child.material);
                detectedEyes.push(child);
              } else if (child.name.includes('Eye_1')) {
                // Outer Cornea: ultra-clear glossy transparent dome catching specular glisten
                child.material = new THREE.MeshStandardMaterial({
                  roughness: 0.02,
                  transparent: true,
                  opacity: 0.12,
                  color: 0xffffff,
                  metalness: 0.08,
                  depthWrite: false
                });
              }
            }
          });

          eyeCenterRef.current.set(0, 0, 0);

          // Position examination penlight directly in front of the eyeball
          if (lightsRef.current.keyLight) {
            lightsRef.current.keyLight.position.set(0.12, 0.18, 0.55);
            lightsRef.current.keyLight.target.position.set(0, 0, 0);
          }
          if (lightsRef.current.fillLight) {
            lightsRef.current.fillLight.position.set(-0.35, 0.12, 0.45);
            lightsRef.current.fillLight.target.position.set(0, 0, 0);
          }
          if (lightsRef.current.rimLight) {
            lightsRef.current.rimLight.position.set(0.35, 0.35, -0.25);
          }
        } else if (isVitruvian) {
          // --- VitruvianGodot Model ---
          root.position.set(0, 0, 0);
          root.scale.set(1, 1, 1);

          const vitFaceBc = texLoader.load('/models/vitruvian/vit_face_bc.png');
          vitFaceBc.colorSpace = THREE.SRGBColorSpace;
          vitFaceBc.flipY = false;

          const vitFaceN = texLoader.load('/models/vitruvian/vit_face_n.png');
          vitFaceN.flipY = false;

          const vitIrisMap = texLoader.load('/models/vitruvian/vit_iris.png');
          vitIrisMap.colorSpace = THREE.SRGBColorSpace;
          vitIrisMap.flipY = false;

          const vitScleraMap = texLoader.load('/models/vitruvian/vit_sclera.png');
          vitScleraMap.colorSpace = THREE.SRGBColorSpace;
          vitScleraMap.flipY = false;

          root.traverse((child) => {
            if (child.isMesh) {
              if (child.name === 'cm_vitruvian') {
                headMeshesRef.current.push(child);
                child.material = new THREE.MeshStandardMaterial({
                  map: vitFaceBc,
                  normalMap: vitFaceN,
                  roughness: 0.52
                });
              }
              if (child.name === 'Eye_L_mesh' || child.name === 'Eye_R_mesh') {
                detectedEyes.push(child);
                const irisMat = new THREE.MeshStandardMaterial({
                  map: vitIrisMap,
                  roughness: 0.15
                });
                setupEyeMaterial(irisMat);
                child.material = irisMat;
              }
            }
          });

          eyeCenterRef.current.set(0.0, 1.6344, 0.0468);
          if (lightsRef.current.keyLight) {
            lightsRef.current.keyLight.position.set(0.0, 1.82, 0.55);
            lightsRef.current.keyLight.target.position.set(0.0, 1.6344, 0.0468);
          }
        } else if (customUrl) {
          // --- Custom Imported GLB Model (e.g. ProceduralEye) ---
          root.position.set(0, 0, 0);
          root.rotation.set(0, 0, 0);
          root.scale.set(1, 1, 1);
          root.updateMatrixWorld(true);

          const bbox = new THREE.Box3().setFromObject(root);
          const center = new THREE.Vector3();
          bbox.getCenter(center);
          const size = new THREE.Vector3();
          bbox.getSize(size);

          const pivot = new THREE.Group();
          pivot.name = 'custom_model_pivot';
          root.position.sub(center);
          pivot.add(root);

          const maxDim = Math.max(size.x, size.y, size.z);
          if (maxDim > 0.0001) {
            const s = 0.16 / maxDim;
            pivot.scale.set(s, s, s);
          }

          modelToDisplay = pivot;

          root.traverse((child) => {
            if (child.isMesh) {
              const matName = (child.material?.name || '').toLowerCase();
              if (matName.includes('cornea')) {
                child.material = new THREE.MeshStandardMaterial({
                  roughness: 0.04,
                  transparent: true,
                  opacity: 0.28,
                  color: 0xffffff,
                  metalness: 0.05,
                  depthWrite: false
                });
              } else if (matName.includes('iris') || matName.includes('eye')) {
                if (child.material) {
                  setupEyeMaterial(child.material);
                  detectedEyes.push(child);
                }
              }
            }
          });

          eyeCenterRef.current.set(0, 0, 0);
          if (lightsRef.current.keyLight) {
            lightsRef.current.keyLight.position.set(0.12, 0.18, 0.55);
            lightsRef.current.keyLight.target.position.set(0, 0, 0);
          }
        } else {
          // --- Indian Boy / Standard Face Model ---
          root.position.set(0, 0, 0);
          root.scale.set(1, 1, 1);

          root.traverse((child) => {
            if (child.isMesh) {
              const nameLower = child.name.toLowerCase();

              if (['body_mesh', 'avaturn_shoes_0', 'avaturn_look_0', 'teeth_mesh', 'tongue_mesh', 'outfit_bottom', 'outfit_shoes', 'outfit_top', 'avatarteethlower', 'avatarteethupper'].includes(nameLower)) {
                child.visible = false;
              }

              if (nameLower.includes('head')) {
                headMeshesRef.current.push(child);
                if (child.material) {
                  child.material.roughness = 0.52;
                  child.material.metalness = 0.0;
                  if (profile === 'indian') {
                    child.material.color.setRGB(0.86, 0.70, 0.58);
                  }
                }
              }

              if (nameLower.includes('hair')) {
                hairMeshesRef.current.push(child);
                if (child.material) {
                  child.material.color.setRGB(0.06, 0.06, 0.07);
                }
              }

              if (nameLower.includes('eye') && !nameLower.includes('lash') && !nameLower.includes('ao') && !nameLower.includes('brow')) {
                detectedEyes.push(child);
                if (child.material) {
                  setupEyeMaterial(child.material);
                }
              }
            }
          });

          eyeCenterRef.current.set(0.001, 1.7405, 0.0493);
          if (lightsRef.current.keyLight) {
            lightsRef.current.keyLight.position.set(0.0, 1.95, 0.55);
            lightsRef.current.keyLight.target.position.set(0.001, 1.7405, 0.0493);
          }
        }

        // Focus camera on model eyes
        const center = eyeCenterRef.current;
        const targetDist = isMacroEye || customUrl ? 0.28 : DEFAULT_DIST;
        if (controlsRef.current && cameraRef.current) {
          controlsRef.current.target.copy(center);
          cameraRef.current.position.set(center.x, center.y, center.z + targetDist);
          controlsRef.current.update();
        }

        sceneRef.current.add(modelToDisplay);
        currentModelRef.current = modelToDisplay;
        setIsLoading(false);
      },
      undefined,
      (err) => {
        console.error('Failed to load 3D model:', err);
        setLoadError('Failed to load 3D model.');
        setIsLoading(false);
      }
    );
  }, [setupEyeMaterial, DEFAULT_DIST]);

  // Main Scene Setup
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x060b14);

    const camera = new THREE.PerspectiveCamera(30, width / height, 0.01, 10);
    const center = eyeCenterRef.current;
    camera.position.set(center.x, center.y, center.z + DEFAULT_DIST);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, canvas);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.target.copy(center);
    controls.minDistance = MIN_DIST;
    controls.maxDistance = MAX_DIST;
    controls.minPolarAngle = Math.PI / 2 - 0.35;
    controls.maxPolarAngle = Math.PI / 2 + 0.35;
    controls.minAzimuthAngle = -0.45;
    controls.maxAzimuthAngle = 0.45;

    // Direct Examination Penlight
    const ambientLight = new THREE.AmbientLight(0xd5e2f0, 0.35);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfffaed, 2.6);
    keyLight.position.set(0.0, 1.82, 0.55);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x7dd3fc, 0.4);
    fillLight.position.set(-0.2, 1.65, 0.35);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.6);
    rimLight.position.set(0.3, 1.95, -0.2);
    scene.add(rimLight);

    lightsRef.current = { ambientLight, keyLight, fillLight, rimLight };

    // Initial load
    loadModel(modelProfile, customModelUrl);

    // Animation Loop
    let animId;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.1);

      // Smooth pupil transition using live target ref
      const targetPupil = typeof targetPupilRef.current === 'number' ? targetPupilRef.current : 0.50;
      const speed = reflexSpeedRef.current || 6.0;
      currentPupilRef.current += (targetPupil - currentPupilRef.current) * (delta * speed);

      eyeShadersRef.current.forEach((sh) => {
        if (sh.uniforms && sh.uniforms.uPupilDilation) {
          sh.uniforms.uPupilDilation.value = currentPupilRef.current;
        }
      });

      // Smooth light intensity transition using live light state ref
      const targetIntensity = lightStateRef.current === 'on' ? 2.8 : 0.70;
      currentLightIntensityRef.current += (targetIntensity - currentLightIntensityRef.current) * (delta * 5.0);

      const { keyLight, ambientLight, fillLight } = lightsRef.current;
      if (keyLight) keyLight.intensity = currentLightIntensityRef.current;
      if (ambientLight) ambientLight.intensity = 0.55 + (currentLightIntensityRef.current / 2.8) * 0.40;
      if (fillLight) fillLight.intensity = 0.30 + (currentLightIntensityRef.current / 2.8) * 0.35;

      // Smooth camera zoom distance lerp
      if (cameraRef.current && controlsRef.current) {
        const curDist = cameraRef.current.position.distanceTo(controlsRef.current.target);
        const targetDist = targetCamDistanceRef.current;
        if (Math.abs(curDist - targetDist) > 0.001) {
          const dir = cameraRef.current.position.clone().sub(controlsRef.current.target).normalize();
          const newDist = THREE.MathUtils.lerp(curDist, targetDist, delta * 5.0);
          cameraRef.current.position.copy(controlsRef.current.target).add(dir.multiplyScalar(newDist));
        }
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      renderer.dispose();
      controls.dispose();
    };
  }, []); // Run once on mount

  // Watch for profile or customModelUrl updates
  useEffect(() => {
    loadModel(modelProfile, customModelUrl);
  }, [modelProfile, customModelUrl, loadModel]);

  // Drag and drop GLB files
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith('.glb') || file.name.endsWith('.gltf')) && onFileDrop) {
      onFileDrop(file);
    }
  };

  const handleVerticalSlider = (e) => {
    const val = parseFloat(e.target.value);
    if (onZoomChange) onZoomChange(val);
  };

  const handleStepZoom = (delta) => {
    const current = typeof zoomLevel === 'number' ? zoomLevel : 0.5;
    const next = Math.max(0, Math.min(1, current + delta));
    if (onZoomChange) onZoomChange(next);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  let lightBadgeText = 'Normal Lighting';
  let LightBadgeIcon = Sun;
  if (isAuto) {
    if (autoPhase === 'bright') {
      lightBadgeText = 'Bright Light (Constricting)';
      LightBadgeIcon = Sun;
    } else {
      lightBadgeText = 'Dim Light (Dilating)';
      LightBadgeIcon = Moon;
    }
  } else if (lightState === 'on') {
    lightBadgeText = 'Penlight ON (Constricted)';
    LightBadgeIcon = Sun;
  } else if (lightState === 'off') {
    lightBadgeText = 'Penlight OFF (Dilated)';
    LightBadgeIcon = Moon;
  }

  let profileBadge = '👁️ 3D Eyeball (4K Realistic)';
  if (modelProfile === 'indian') profileBadge = '🇮🇳 Indian Boy (Face)';
  else if (modelProfile === 'vitruvian') profileBadge = '🏛️ Vitruvian (CC0)';
  else if (customModelUrl) profileBadge = '📁 Custom Model';

  return (
    <div
      className={`viewer-container ${isFullscreen ? 'fullscreen' : ''} ${isDragOver ? 'drag-over' : ''}`}
      ref={containerRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <canvas ref={canvasRef} className="three-canvas" />

      {/* Drag & Drop Overlay */}
      {isDragOver && (
        <div className="viewer-drop-overlay">
          <UploadCloud size={44} className="drop-icon" />
          <p>Drop your 3D model (.glb) here to import</p>
        </div>
      )}

      {/* Loading state overlay */}
      {isLoading && (
        <div className="viewer-loading-overlay">
          <div className="loading-spinner" />
          <p>Loading 3D Eye Simulation...</p>
        </div>
      )}

      {/* Error state */}
      {loadError && (
        <div className="viewer-error-overlay">
          <p>{loadError}</p>
        </div>
      )}

      {/* Top-Right: Fullscreen Toggle */}
      <button
        className="overlay-btn fullscreen-btn"
        onClick={toggleFullscreen}
        title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
      >
        {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
      </button>

      {/* Top-Left: Arduino Web Serial Connect Button */}
      <button
        className={`overlay-pill arduino-pill ${serialConnected ? 'connected' : ''}`}
        onClick={connectArduino}
        title="Connect Arduino via USB to read ultrasonic distance sensor"
      >
        {serialConnected ? (
          <>
            <Radio size={14} className="pill-icon pulse" />
            <span>
              🟢 Arduino: <strong>{sensorDistance} cm</strong>
              {sensorIntensity ? ` (${sensorIntensity}% Light)` : ''}
            </span>
          </>
        ) : (
          <>
            <Cpu size={14} className="pill-icon" />
            <span>🔌 Connect Arduino (USB)</span>
          </>
        )}
      </button>

      {/* Bottom-Left: Lighting & Model Status Pill */}
      <div className="overlay-pill light-status-pill">
        <LightBadgeIcon size={14} className="pill-icon" />
        <span>{lightBadgeText}</span>
        <span className="profile-tag">{profileBadge}</span>
      </div>

      {/* Right Edge: Vertical Zoom Slider */}
      <div className="vertical-zoom-bar">
        <button
          className="v-zoom-btn plus"
          onClick={() => handleStepZoom(0.15)}
          title="Zoom In"
        >
          <Plus size={14} />
        </button>

        <div className="v-slider-track-wrap">
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={typeof zoomLevel === 'number' ? zoomLevel : 0.5}
            onChange={handleVerticalSlider}
            className="v-zoom-slider"
            orient="vertical"
          />
        </div>

        <button
          className="v-zoom-btn minus"
          onClick={() => handleStepZoom(-0.15)}
          title="Zoom Out"
        >
          <Minus size={14} />
        </button>
      </div>
    </div>
  );
}
