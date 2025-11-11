# Healthcare Management System - API Reference

Complete API documentation for the Healthcare Management System. All endpoints use JSON for request/response data unless specified otherwise.

## 🔐 Authentication

The API uses JWT (JSON Web Token) for authentication. Include the token in the Authorization header:

```http
Authorization: Bearer <your_jwt_token>
```

### Token Information
- **Expiration**: 24 hours
- **Algorithm**: HS256
- **Claims**: `userId`, `email`, `role`, `iat`, `exp`

## 📋 Common Response Formats

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional error details (optional)"
}
```

### Validation Error
```json
{
  "success": false,
  "error": "Validation failed",
  "validationErrors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

## 🔒 Authentication Endpoints

### Register User
Create a new user account. Patients get immediate access, doctors/staff require admin approval.

```http
POST /api/auth/register
Content-Type: application/json
```

**Request Body:**
```json
{
  "username": "string (required, 3-50 chars, unique)",
  "email": "string (required, valid email, unique)",
  "password": "string (required, min 6 chars)",
  "role": "admin|doctor|patient|staff (required)",
  "full_name": "string (required)",
  "phone": "string (optional)",
  
  // Patient-specific fields (optional)
  "date_of_birth": "YYYY-MM-DD",
  "gender": "male|female|other",
  "blood_group": "A+|A-|B+|B-|AB+|AB-|O+|O-",
  "address": "string",
  "emergency_contact": "string",
  "emergency_contact_name": "string",
  "emergency_contact_relation": "string",
  "allergies": "string",
  "medical_conditions": "string",
  "current_medications": "string",
  "insurance": "string",
  "insurance_policy_number": "string",
  "occupation": "string",
  
  // Doctor-specific fields (optional)
  "specialization": "string",
  "license_number": "string",
  "experience_years": "number",
  "consultation_fee": "number",
  "available_days": "string",
  "available_time_start": "HH:MM",
  "available_time_end": "HH:MM"
}
```

**Response (Patient):**
```json
{
  "success": true,
  "data": {
    "token": "jwt_token_string",
    "user": {
      "id": 1,
      "username": "patient123",
      "email": "patient@example.com",
      "role": "patient",
      "full_name": "John Doe",
      "status": "active"
    }
  }
}
```

**Response (Doctor/Staff):**
```json
{
  "success": true,
  "message": "Registration submitted for admin approval"
}
```

### Login
Authenticate user and receive JWT token.

```http
POST /api/auth/login
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "jwt_token_string",
    "user": {
      "id": 1,
      "username": "user123",
      "email": "user@example.com",
      "role": "patient",
      "full_name": "John Doe",
      "status": "active"
    }
  }
}
```

### Get Profile
Get current user's profile information.

```http
GET /api/auth/profile
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "user123",
    "email": "user@example.com",
    "role": "patient",
    "full_name": "John Doe",
    "phone": "+1234567890",
    "status": "active",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### Change Password
Update user's password.

```http
POST /api/auth/change-password
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "currentPassword": "string (required)",
  "newPassword": "string (required, min 6 chars)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password updated successfully"
}
```

## 👥 User Management (Admin Only)

### Get All Users
Retrieve all users in the system.

```http
GET /api/admin/users
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 1,
        "username": "user123",
        "email": "user@example.com",
        "role": "patient",
        "full_name": "John Doe",
        "status": "active",
        "created_at": "2024-01-01T00:00:00.000Z"
      }
    ],
    "total": 1
  }
}
```

### Get Users by Role
Retrieve users filtered by role.

```http
GET /api/admin/users/{role}
Authorization: Bearer <admin_token>
```

**Parameters:**
- `role`: `doctor|patient|staff`

### Suspend User
Suspend a user account.

```http
POST /api/admin/users/{userId}/suspend
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "message": "User suspended successfully",
  "userId": 123
}
```

### Reactivate User
Reactivate a suspended user account.

```http
POST /api/admin/users/{userId}/reactivate
Authorization: Bearer <admin_token>
```

### Delete User
Delete a user account (except admin users).

```http
DELETE /api/admin/users/{userId}
Authorization: Bearer <admin_token>
```

## 📅 Appointment Management

### Book Appointment
Create a new appointment (patients only).

```http
POST /api/appointments
Authorization: Bearer <patient_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "doctor_user_id": "number (optional, for specific doctor)",
  "appointment_date": "YYYY-MM-DD (required)",
  "appointment_time": "HH:MM (required)",
  "reason": "string (required)",
  "symptoms": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "appointmentId": 123
  },
  "message": "Appointment booked successfully"
}
```

### Get Appointments
Retrieve appointments (role-based filtering).

```http
GET /api/appointments
Authorization: Bearer <token>
```

**Query Parameters:**
- `status`: Filter by appointment status
- `doctor_id`: Filter by doctor (admin only)
- `patient_id`: Filter by patient (admin only)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "patient_user_id": 2,
      "doctor_user_id": 3,
      "appointment_date": "2024-01-15",
      "appointment_time": "10:00",
      "reason": "Regular checkup",
      "symptoms": "Mild headache",
      "status": "pending",
      "notes": null,
      "created_at": "2024-01-01T00:00:00.000Z",
      "patient_name": "John Doe",
      "patient_email": "john@example.com",
      "doctor_name": "Dr. Smith",
      "doctor_specialization": "General Medicine"
    }
  ]
}
```

### Update Appointment
Update appointment status or assignment (doctors/admin only).

```http
PUT /api/appointments/{appointmentId}
Authorization: Bearer <doctor_or_admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "pending|confirmed|completed|cancelled (optional)",
  "doctor_user_id": "number (optional, for assignment)",
  "notes": "string (optional)"
}
```

### Get Patient's Appointments
Retrieve appointments for the current patient.

```http
GET /api/appointments/my-appointments
Authorization: Bearer <patient_token>
```

### Get Available Doctors
Get list of doctors available for appointments.

```http
GET /api/doctors/available
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "user_id": 3,
      "full_name": "Dr. Jane Smith",
      "specialization": "Cardiology",
      "experience_years": 15,
      "consultation_fee": 150.00,
      "available_days": "Monday,Tuesday,Wednesday,Thursday,Friday",
      "available_time_start": "09:00",
      "available_time_end": "17:00"
    }
  ]
}
```

## 🚑 Ambulance Services

### Request Ambulance
Create a new ambulance request (patients only).

```http
POST /api/ambulance/request
Authorization: Bearer <patient_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "pickup_address": "string (required)",
  "destination_address": "string (required)",
  "emergency_type": "string (required)",
  "patient_condition": "string (optional)",
  "contact_number": "string (required)",
  "priority": "low|normal|high|critical (optional, default: normal)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "requestId": 123
  },
  "message": "Ambulance request submitted successfully"
}
```

### Get Ambulance Requests
Retrieve all ambulance requests (staff/admin only).

```http
GET /api/ambulance/requests
Authorization: Bearer <staff_or_admin_token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "patient_user_id": 2,
      "assigned_staff_id": null,
      "pickup_address": "123 Main St",
      "destination_address": "City Hospital",
      "emergency_type": "Heart Attack",
      "patient_condition": "Chest pain, difficulty breathing",
      "contact_number": "+1234567890",
      "priority": "high",
      "status": "pending",
      "notes": null,
      "created_at": "2024-01-01T10:30:00.000Z",
      "patient_name": "John Doe",
      "patient_phone": "+1234567890",
      "assigned_staff_name": null
    }
  ]
}
```

### Update Ambulance Request
Update ambulance request status (staff/admin only).

```http
PUT /api/ambulance/requests/{requestId}
Authorization: Bearer <staff_or_admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "pending|assigned|on_way|completed|cancelled (optional)",
  "assigned_staff_id": "number (optional)",
  "notes": "string (optional)"
}
```

### Get Patient's Ambulance Requests
Retrieve ambulance requests for the current patient.

```http
GET /api/ambulance/my-requests
Authorization: Bearer <patient_token>
```

## 💬 Feedback & Complaints

### Submit Feedback
Submit feedback or complaint.

```http
POST /api/feedback
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "type": "feedback|complaint (required)",
  "subject": "string (required)",
  "description": "string (required)",
  "category": "string (optional)",
  "priority": "low|normal|high (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "feedbackId": 123
  },
  "message": "Feedback submitted successfully"
}
```

### Get User's Feedback
Retrieve user's own feedback/complaints.

```http
GET /api/feedback/my
Authorization: Bearer <token>
```

### Get All Feedback (Admin Only)
Retrieve all feedback/complaints.

```http
GET /api/admin/feedback
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": 2,
      "type": "complaint",
      "subject": "Long wait time",
      "description": "Had to wait 2 hours for appointment",
      "category": "service",
      "priority": "normal",
      "status": "pending",
      "admin_response": null,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z",
      "patient_name": "John Doe",
      "patient_email": "john@example.com"
    }
  ]
}
```

### Update Feedback Status (Admin Only)
Update feedback/complaint status with admin response.

```http
PUT /api/admin/feedback/{feedbackId}/status
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "pending|in_review|resolved|closed (required)",
  "admin_response": "string (optional)"
}
```

### Get Feedback Statistics (Admin Only)
Get feedback/complaint statistics.

```http
GET /api/admin/feedback/stats
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 50,
    "byType": {
      "feedback": 30,
      "complaint": 20
    },
    "byStatus": {
      "pending": 10,
      "in_review": 5,
      "resolved": 30,
      "closed": 5
    }
  }
}
```

### Submit Complaint Feedback
Submit feedback on a closed complaint.

```http
POST /api/complaint/{complaintId}/feedback
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "rating": "number (required, 1-5)",
  "feedback_text": "string (optional)"
}
```

### Get Complaint Feedback
Get feedback for specific complaint.

```http
GET /api/complaint/{complaintId}/feedback
Authorization: Bearer <token>
```

## 📊 Data Endpoints

### Get Patients
Retrieve all patients (doctors/admin only).

```http
GET /api/patients
Authorization: Bearer <doctor_or_admin_token>
```

### Get Doctors
Retrieve all doctors.

```http
GET /api/doctors
Authorization: Bearer <token>
```

### Get Dashboard Statistics
Get role-specific dashboard statistics.

```http
GET /api/dashboard/stats
Authorization: Bearer <token>
```

**Response (Admin):**
```json
{
  "success": true,
  "data": {
    "totalUsers": 150,
    "totalPatients": 100,
    "totalDoctors": 20,
    "totalStaff": 10,
    "pendingAppointments": 25,
    "pendingAmbulanceRequests": 5,
    "pendingRegistrations": 3
  }
}
```

**Response (Doctor):**
```json
{
  "success": true,
  "data": {
    "todayAppointments": 8,
    "pendingAppointments": 12,
    "completedAppointments": 45,
    "totalPatients": 67
  }
}
```

**Response (Patient):**
```json
{
  "success": true,
  "data": {
    "upcomingAppointments": 2,
    "completedAppointments": 5,
    "pendingAmbulanceRequests": 0,
    "pendingFeedback": 1
  }
}
```

## 🔧 Admin Registration Management

### Get Pending Registrations
Retrieve pending doctor/staff registrations.

```http
GET /api/admin/pending-registrations
Authorization: Bearer <admin_token>
```

### Approve Registration
Approve a pending registration.

```http
POST /api/admin/pending-registrations/{registrationId}/approve
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "adminNotes": "string (optional)"
}
```

### Reject Registration
Reject a pending registration.

```http
POST /api/admin/pending-registrations/{registrationId}/reject
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "adminNotes": "string (required for rejection)"
}
```

## 🔍 Debug Endpoints (Development Only)

### Database Debug Info
Get database debug information.

```http
GET /api/debug/database
```

### Clear All Users
Remove all users from database.

```http
DELETE /api/debug/clear-users
```

### Reset Database
Reset entire database to initial state.

```http
POST /api/debug/reset-database
```

## 🏥 Utility Endpoints

### Health Check
Check API health status.

```http
GET /api/ping
```

**Response:**
```json
{
  "success": true,
  "message": "Healthcare System API",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Demo Endpoint
Demo endpoint for testing.

```http
GET /api/demo
```

## 📝 Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input data |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 422 | Validation Error - Invalid data format |
| 500 | Internal Server Error - Server error |

## 🔄 Rate Limiting

- **Authentication endpoints**: 5 requests per minute per IP
- **General endpoints**: 100 requests per minute per user
- **File upload endpoints**: 10 requests per minute per user

## 📋 Data Validation Rules

### User Registration
- Username: 3-50 characters, alphanumeric + underscore
- Email: Valid email format, unique in system
- Password: Minimum 6 characters
- Phone: Optional, international format preferred

### Appointment Booking
- Date: Must be future date
- Time: Business hours (9 AM - 5 PM)
- Reason: Required, 1-500 characters

### Ambulance Request
- Addresses: Required, non-empty strings
- Contact: Valid phone number format
- Priority: Enum validation

### Feedback Submission
- Subject: 1-200 characters
- Description: 1-2000 characters
- Type: Must be 'feedback' or 'complaint'

---

This API follows RESTful conventions and uses standard HTTP status codes. All endpoints return JSON responses with consistent structure for easy integration.
