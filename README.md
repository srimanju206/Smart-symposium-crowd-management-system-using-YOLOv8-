# Smart Symposium Crowd Management System

A professional, real-time crowd analytics and safety monitoring application using **YOLOv8-based object detection**. This system detects and counts attendees, tracks crowd density across symposium zones, triggers automatic warnings for congestion, displays historical analytics, and suggests dynamic alternative routes to event organizers.

---

## 🚀 Key Features

1. **Live YOLOv8 Detection Feed**:
   - Streams active video/webcam frame inputs with YOLOv8 nano person detection.
   - Automatically overlays green bounding boxes, tracking ID indicators, and real-time FPS/latency analytics.

2. **Multizone Density Monitoring**:
   - Grid monitoring for key symposium zones: Main Auditorium, Registration Hall, Seminar Hall-A, and Food Court Plaza.
   - Shows current occupant limits, percentage capacities, progress thresholds, and glow warning alerts.

3. **Smart Alternative Route suggestions**:
   - Contains an interactive college floor plan vector map (SVG) indicating congested zones.
   - Automatically re-routes visitor traffic when capacities breach limits, displaying glowing bypass paths and text directions.

4. **Crowd Flow Analytics**:
   - Custom graphical panels mapping hourly visitor distribution flow and capacity saturation levels using Chart.js.

5. **Configurable Alert System**:
   - Customize capacity limits and density alarm thresholds.
   - Connects to browser desktop alert notification triggers.
   - Generates exporting csv metrics logs.

---

## 🛠️ System Architecture

- **Frontend**: Single-Page Application (SPA) utilizing HTML5, vanilla CSS (custom dark-mode glassmorphic theme), JavaScript, Lucide Icons, and Chart.js.
- **Backend**: Python Flask microservice using OpenCV for camera streaming and Ultralytics YOLOv8 for deep learning object classification.

---

## ⚙️ How to Run the Project

### Option A: Standalone Simulation Mode (Quick Demo - No Setup Needed)
You can run the entire frontend layout without compiling any Python code. The browser will automatically simulate fluctuating crowd densities, draw virtual people/boxes on the YOLOv8 canvas feed, and render fully operational maps and charts.

1. Locate the `index.html` file in the project folder.
2. Open `index.html` directly in any web browser (Chrome, Edge, Firefox, Safari).
3. Log in using the default administrator credential:
   - **Email**: `admin@college.edu`
   - **Password**: `password`
   - *(Or create a new account using the Sign Up page)*

---

### Option B: Real-time YOLOv8 Connected Mode (Full Version)
To use a real camera feed and YOLOv8 object detection, run the Flask backend in Python and hook it to the dashboard.

#### 1. Backend Installation & Setup
1. Verify that Python 3.8+ is installed on your computer.
2. Open a command prompt/terminal, navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
3. Set up a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
4. Install the required libraries (ultralytics, opencv, flask, flask-cors, etc.):
   ```bash
   pip install -r requirements.txt
   ```
5. *(Optional)* By default, the system will use your computer's built-in webcam (index `0`). If you want to run it on a specific video file (e.g. `camps.mp4`), edit `backend/app.py` and replace `VIDEO_SOURCE = 0` with `VIDEO_SOURCE = "camps.mp4"`.

#### 2. Running the Backend
1. Execute the Flask app:
   ```bash
   python app.py
   ```
2. On first run, it will automatically download the official light weight `yolov8n.pt` model weights.
3. Once running, you should see logs indicating:
   - `* Running on http://127.0.0.1:5000`
   - `[YOLO Backend] YOLOv8 model loaded successfully.`

#### 3. Connecting the Frontend Dashboard
1. Open `index.html` in your browser.
2. Go to the **Settings** page via the left sidebar.
3. Verify that the **Live YOLOv8 API Server** input matches: `http://localhost:5000` (or `http://127.0.0.1:5000`).
4. Navigate back to the **Dashboard** page.
5. Click the **Live Mode** button in the top right corner of the camera feed.
6. The status badge will change to green (**YOLOv8 Live Online**), and the camera feed will update with real-time bounding boxes from your webcam/video!

---

## 📊 File Structure
```
smart-symposium-crowd-management/
│
├── index.html          # Main dashboard views & templates (SPA)
├── styles.css          # Design system & CSS layout
├── app.js              # State manager, Canvas render, Charts & route suggestions
│
└── backend/
    ├── requirements.txt # Python dependencies
    ├── detector.py      # Multi-threaded YOLOv8 OpenCV processor
    └── app.py           # Flask controller endpoints & MJPEG generator
```

---

## 🔒 Default Login Credentials
- **Username**: `admin@college.edu`
- **Password**: `password`
