# Human Eye Light Reflex 3D Simulation 👁️⚡

A hardware-driven, photorealistic 3D Human Eye Light Reflex demonstration and simulation web application. Built with **React**, **Three.js / WebGL**, **Custom GLSL Shaders**, and hardware integration via the **Web Serial API** with an **Arduino** ultrasonic proximity / light sensor.

---

## 🌟 Key Features

- **Photorealistic 4K 3D Eyeball**:
  - High-resolution anatomical eye globe with crystalline transparent cornea, realistic sclera micro-vascularization, and authentic iris stroma textures.
- **Dynamic GLSL Radial Pupil Warp Shader**:
  - Biologically accurate pupillary light reflex (PLR):
    - **Bright Light / Proximity**: Pupil constricts (miosis) with compressed iris stroma fibers.
    - **Dim Light / Distance**: Pupil dilates (mydriasis) with expanded black obsidian pupil aperture.
- **Hardware Integration (Arduino + Web Serial API)**:
  - Plug-and-play USB serial connection (`arduino.ino`) reading live distance and simulated light intensity.
  - Bringing a penlight or hand closer ($5\text{ cm} - 10\text{ cm}$) actively triggers live pupil constriction on the 3D model.
- **Interactive Medical Examination Controls**:
  - **Light Control**: Penlight ON (Bright examination light), Penlight OFF (Dim ambient room), and Auto Demo mode.
  - **Pupil Size Control**: Real-time slider and instant Min, Normal, and Max dilation presets.
  - **Camera Controls**: OrbitControls with pan, rotate, zoom slider, and Reset View.
  - **Profile Switcher**: Switch between the 4K 3D Eyeball, full-face models (Indian Boy, Vitruvian CC0), or drag-and-drop custom `.glb` models.
  - **Keyboard Shortcut**: `Spacebar` or `L` toggles the penlight on/off.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Three.js (`three`), Lucide Icons
- **Shaders**: GLSL custom fragment shaders with radial UV distortion & tone blending
- **Hardware**: Arduino Uno / Nano with HC-SR04 Ultrasonic Distance Sensor (`arduino.ino`)
- **API**: Web Serial API (Chrome & Edge native support)

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/robomiracle-covai/eye-demo.git
cd eye-demo
```

### 2. Install dependencies
```bash
npm install
```

### 3. Run the development server
```bash
npm run dev
```
Open your browser at `http://localhost:5176/`.

---

## 🔌 Arduino Setup

1. Open `arduino.ino` in the Arduino IDE.
2. Connect your HC-SR04 ultrasonic sensor:
   - **Trig Pin**: Pin 9
   - **Echo Pin**: Pin 10
   - **VCC**: 5V
   - **GND**: GND
3. Select your board and port, then click **Upload**.
4. In the web app, click **Connect Arduino (USB)** at the top left and select your Arduino COM port.
5. Move your hand or torch light towards the sensor to see the 3D eye react in real time!

---

## 📄 License

MIT License. Created for interactive medical simulation and hardware demonstrations.
