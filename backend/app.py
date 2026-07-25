import os
from flask import Flask, Response, jsonify, request
from flask_cors import CORS
from detector import YOLOCrowdDetector

app = Flask(__name__)
CORS(app)  # Enable CORS to allow requests from frontend (index.html)

# Configure detector.
# You can set source to a path of an MP4 video file, e.g. "sample.mp4", or 0 for system default webcam
# For student projects, default webcam is usually the best demonstration.
VIDEO_SOURCE = 0 
MODEL_WEIGHTS = "yolov8n.pt"

# Initialize detector
detector = YOLOCrowdDetector(model_name=MODEL_WEIGHTS, source=VIDEO_SOURCE)
detector.start()

# Flask homepage / Health status
@app.route('/')
def index():
    return jsonify({
        "status": "online",
        "system": "EventIQ - Smart Symposium Crowd Management System",
        "yolov8_model": MODEL_WEIGHTS,
        "video_source": VIDEO_SOURCE,
        "endpoints": {
            "/api/counts": "Get current occupants count in all zones (JSON)",
            "/video_feed": "Get real-time YOLOv8 MJPEG inference stream (multipart)",
            "/api/settings": "Get or update threshold parameters (GET/POST)"
        }
    })

# API endpoint: retrieve counts
@app.route('/api/counts', methods=['GET'])
def get_counts():
    counts = detector.get_latest_counts()
    return jsonify(counts)

# API stream generator
def generate_mjpeg_feed():
    while True:
        frame_bytes = detector.get_encoded_frame()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

# Streaming endpoint
@app.route('/video_feed')
def video_feed():
    camera_param = request.args.get('cam', 'auditorium')
    # Update active camera context in detector if needed (e.g. adjust tracking regions)
    # Return streaming response
    return Response(
        generate_mjpeg_feed(),
        mimetype='multipart/x-mixed-replace; boundary=frame'
    )

# API endpoint: get / save settings configs
# Mock settings database stored in local memory
SYSTEM_SETTINGS = {
    "auditorium_capacity": 150,
    "auditorium_threshold": 80,
    "registration_capacity": 80,
    "registration_threshold": 75,
    "seminar_capacity": 60,
    "seminar_threshold": 85,
    "foodcourt_capacity": 100,
    "foodcourt_threshold": 70
}

@app.route('/api/settings', methods=['GET', 'POST'])
def manage_settings():
    global SYSTEM_SETTINGS
    if request.method == 'POST':
        data = request.json
        if data:
            for k in SYSTEM_SETTINGS.keys():
                if k in data:
                    SYSTEM_SETTINGS[k] = int(data[k])
            return jsonify({"status": "success", "settings": SYSTEM_SETTINGS})
        return jsonify({"status": "error", "message": "Invalid request body"}), 400
    
    return jsonify(SYSTEM_SETTINGS)

if __name__ == '__main__':
    # Run the server on port 5000. Set debug to False to avoid double loading threads.
    try:
        app.run(host='0.0.0.0', port=5000, debug=False, threaded=True)
    finally:
        print("[Flask Server] Shutting down detector thread...")
        detector.stop()
