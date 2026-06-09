GitHub Repository Contents for Project
1. Approved Project Title
Smart Symposium Crowd Management System Using YOLOv8 and Crowd Analytics
2. Problem Statement
During symposiums, technical events, and college festivals, large crowds gather in auditoriums, seminar halls, food courts, and registration areas. Manual crowd monitoring is inefficient and may lead to overcrowding, congestion, safety risks, and delays in event management.
The proposed Smart Symposium Crowd Management System uses YOLOv8-based real-time object detection and crowd analytics to monitor crowd density, identify congested areas, estimate occupancy levels, and provide alerts and alternative route suggestions to event organizers. This system helps improve safety, crowd flow, and event management efficiency.
3. Project Objectives
To detect and count people in real-time using YOLOv8.
To monitor crowd density in different symposium zones.
To identify overcrowded areas automatically.
To generate alerts when crowd density exceeds a predefined threshold.
To visualize crowd statistics through a dashboard.
To suggest alternative routes for visitors during congestion.
To improve safety and crowd management during college events.
4. Module List
Module 1: User Authentication
Admin login
Secure access to system
Module 2: Video Input Management
CCTV camera integration
Live video stream processing
Module 3: YOLOv8 Person Detection
Detect people in video frames
Count individuals accurately
Module 4: Crowd Density Analysis
Calculate crowd density
Zone-wise crowd monitoring
Module 5: Alert Generation
Detect overcrowding
Send notifications to organizers
Module 6: Route Recommendation
Identify congested pathways
Suggest alternative routes
Module 7: Dashboard & Reporting
Display crowd statistics
Generate event reports
5. Use Case Diagram Submission
Actors
Admin
Event Organizer
Visitor
Use Cases
Login
View Live Crowd Monitoring
View Crowd Density
Receive Congestion Alerts
Manage Event Areas
Generate Reports
View Alternative Routes
6. Table List
Table 1: Admin
Field Name
Data Type
Description
admin_id
INT
Primary Key
username
VARCHAR(50)
Admin Name
password
VARCHAR(255)
Encrypted Password
email
VARCHAR(100)
Email Address
Table 2: Camera
Field Name
Data Type
camera_id
INT
location
VARCHAR(100)
status
VARCHAR(20)
Table 3: Crowd_Data
Field Name
Data Type
crowd_id
INT
camera_id
INT
people_count
INT
density_level
VARCHAR(20)
timestamp
DATETIME
Table 4: Alerts
Field Name
Data Type
alert_id
INT
crowd_id
INT
alert_type
VARCHAR(50)
alert_time
DATETIME
status
VARCHAR(20)
Table 5: Route_Suggestions
Field Name
Data Type
route_id
INT
source_location
VARCHAR(100)
destination_location
VARCHAR(100)
congestion_status
VARCHAR(20)
suggested_route
TEXT
Table 6: Reports
Field Name
Data Type
report_id
INT
generated_by
VARCHAR(50)
report_date
DATE
crowd_summary
TEXT
Technologies Used
Frontend: HTML, CSS, JavaScript, Bootstrap
Backend: Python Flask
Database: MySQL
AI Tool: YOLOv8
Libraries: OpenCV, NumPy, Pandas
Visualization: Matplotlib, Chart.js
These sections can be uploaded day-wise in your GitHub repository as project documentation.
