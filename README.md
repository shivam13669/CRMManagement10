# Healthcare Management System

A comprehensive healthcare management system built with React, TypeScript, and Express.js. This system provides a complete solution for managing patients, doctors, staff, appointments, ambulance services, and feedback in a healthcare facility.

## 🌟 Features

### Multi-Role User Management

- **Admin**: Complete system oversight and user management
- **Doctors**: Appointment management and patient care
- **Staff**: Ambulance service coordination
- **Patients**: Appointment booking and service requests

### Core Functionality

- 🔐 **Secure Authentication**: JWT-based with role-based access control
- 📅 **Appointment System**: Complete booking and management workflow
- 🚑 **Ambulance Services**: Emergency request and dispatch system
- 💬 **Feedback & Complaints**: Patient feedback with admin response system
- 📊 **Dashboard Analytics**: Role-specific insights and statistics
- 👥 **User Management**: Registration approval workflow for healthcare professionals

## 🏗 Technology Stack

- **Frontend**: React 18 + TypeScript + TailwindCSS + Radix UI
- **Backend**: Express.js + TypeScript
- **Database**: SQLite with sql.js (file-based storage)
- **Authentication**: JWT with bcrypt password hashing
- **Deployment**: Netlify/Vercel ready with serverless functions
- **Package Manager**: PNPM

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PNPM (recommended)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd healthcare-management-system

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The application will be available at `http://localhost:8080`

## 📋 User Roles & Capabilities

### 👑 Administrator

**Access Level**: Full system control

**Capabilities**:

- Manage all users (view, suspend, reactivate, delete)
- Approve/reject doctor and staff registrations
- View all appointments and ambulance requests
- Manage feedback and complaints system
- Access comprehensive system analytics
- Cannot be deleted or suspended

### 🩺 Doctor

**Registration**: Requires admin approval

**Capabilities**:

- View and manage assigned appointments
- Accept unassigned appointments
- Update appointment status and notes
- Access patient medical information
- Manage availability and profile

### 👨‍⚕️ Staff

**Registration**: Requires admin approval

**Capabilities**:

- Manage ambulance requests
- Assign ambulance services to requests
- Update ambulance request status
- View patient information for service coordination

### 🏥 Patient

**Registration**: Immediate approval

**Capabilities**:

- Book appointments with doctors
- Request ambulance services
- Submit feedback and complaints
- View medical reports and appointment history
- Manage personal medical information

## 🗄 Database Schema

### Core Tables

#### users

Primary user accounts for all roles

```sql
- id: INTEGER PRIMARY KEY
- username: TEXT UNIQUE
- email: TEXT UNIQUE
- password: TEXT (bcrypt hashed)
- role: TEXT (admin|doctor|patient|staff)
- full_name: TEXT
- phone: TEXT
- status: TEXT (active|suspended)
- created_at: DATETIME
- updated_at: DATETIME
```

#### patients

Extended patient information

```sql
- user_id: INTEGER (FK to users.id)
- date_of_birth: DATE
- gender: TEXT
- blood_group: TEXT
- address: TEXT
- emergency_contact: TEXT
- emergency_contact_name: TEXT
- emergency_contact_relation: TEXT
- allergies: TEXT
- medical_conditions: TEXT
- current_medications: TEXT
- insurance: TEXT
- insurance_policy_number: TEXT
- occupation: TEXT
```

#### doctors

Doctor profiles and availability

```sql
- user_id: INTEGER (FK to users.id)
- specialization: TEXT
- license_number: TEXT
- experience_years: INTEGER
- consultation_fee: DECIMAL
- available_days: TEXT
- available_time_start: TIME
- available_time_end: TIME
```

#### appointments

Appointment scheduling and management

```sql
- id: INTEGER PRIMARY KEY
- patient_user_id: INTEGER (FK to users.id)
- doctor_user_id: INTEGER (FK to users.id)
- appointment_date: DATE
- appointment_time: TIME
- reason: TEXT
- symptoms: TEXT
- status: TEXT (pending|confirmed|completed|cancelled)
- notes: TEXT
- created_at: DATETIME
- updated_at: DATETIME
```

#### ambulance_requests

Emergency ambulance services

```sql
- id: INTEGER PRIMARY KEY
- patient_user_id: INTEGER (FK to users.id)
- assigned_staff_id: INTEGER (FK to users.id)
- pickup_address: TEXT
- destination_address: TEXT
- emergency_type: TEXT
- patient_condition: TEXT
- contact_number: TEXT
- priority: TEXT (low|normal|high|critical)
- status: TEXT (pending|assigned|on_way|completed|cancelled)
- notes: TEXT
- created_at: DATETIME
- updated_at: DATETIME
```

#### feedback_complaints

Patient feedback and complaint system

```sql
- id: INTEGER PRIMARY KEY
- user_id: INTEGER (FK to users.id)
- type: TEXT (feedback|complaint)
- subject: TEXT
- description: TEXT
- category: TEXT
- priority: TEXT
- status: TEXT (pending|in_review|resolved|closed)
- admin_response: TEXT
- created_at: DATETIME
- updated_at: DATETIME
```

#### pending_registrations

Doctor/staff approval workflow

```sql
- id: INTEGER PRIMARY KEY
- username: TEXT
- email: TEXT
- password: TEXT (bcrypt hashed)
- role: TEXT (doctor|staff)
- full_name: TEXT
- phone: TEXT
- specialization: TEXT (for doctors)
- license_number: TEXT (for doctors)
- experience_years: INTEGER (for doctors)
- status: TEXT (pending|approved|rejected)
- admin_notes: TEXT
- created_at: DATETIME
```

## 🔌 API Documentation

### Authentication Endpoints

#### POST /api/auth/register

Register new user account

```typescript
// Request
{
  username: string;
  email: string;
  password: string;
  role: "admin" | "doctor" | "patient" | "staff";
  full_name: string;
  phone?: string;
  // Additional fields based on role...
}

// Response (for patients)
{
  token: string;
  user: UserProfile;
}

// Response (for doctors/staff)
{
  message: "Registration submitted for admin approval";
}
```

#### POST /api/auth/login

User authentication

```typescript
// Request
{
  email: string;
  password: string;
}

// Response
{
  token: string;
  user: UserProfile;
}
```

#### GET /api/auth/profile

Get current user profile (requires JWT token)

#### POST /api/auth/change-password

Change user password (requires JWT token)

### Appointment Management

#### POST /api/appointments

Book new appointment (patients only)

```typescript
{
  doctor_user_id?: number;
  appointment_date: string;
  appointment_time: string;
  reason: string;
  symptoms?: string;
}
```

#### GET /api/appointments

Get appointments (role-based filtering)

#### PUT /api/appointments/:appointmentId

Update appointment status/assignment

#### GET /api/appointments/my-appointments

Get patient's appointments

### Ambulance Services

#### POST /api/ambulance/request

Request ambulance service

```typescript
{
  pickup_address: string;
  destination_address: string;
  emergency_type: string;
  patient_condition?: string;
  contact_number: string;
  priority?: "low" | "normal" | "high" | "critical";
}
```

#### GET /api/ambulance/requests

Get all ambulance requests (staff/admin only)

#### PUT /api/ambulance/requests/:requestId

Update ambulance request status

### Admin Endpoints

#### GET /api/admin/users

Get all users

#### POST /api/admin/users/:userId/suspend

Suspend user account

#### POST /api/admin/users/:userId/reactivate

Reactivate user account

#### GET /api/admin/pending-registrations

Get pending doctor/staff registrations

#### POST /api/admin/pending-registrations/:registrationId/approve

Approve pending registration

#### POST /api/admin/pending-registrations/:registrationId/reject

Reject pending registration

### Feedback System

#### POST /api/feedback

Submit feedback or complaint

#### GET /api/admin/feedback

Get all feedback/complaints (admin only)

#### PUT /api/admin/feedback/:feedbackId/status

Update feedback status with admin response

## 🔒 Security Features

- **Password Security**: Bcrypt hashing with salt rounds
- **JWT Authentication**: 24-hour token expiration
- **Role-based Access Control**: Endpoint protection by user role
- **Account Management**: Suspension/reactivation system
- **SQL Injection Prevention**: Parameterized queries
- **Admin Protection**: Admin accounts cannot be deleted

## 🎨 UI Components

Built with Radix UI and TailwindCSS, featuring:

- **Responsive Design**: Mobile-first approach
- **Accessibility**: WCAG compliant components
- **Dark Mode**: Theme switching support
- **Component Library**: Pre-built UI components in `client/components/ui/`

Key components:

- Form controls (Input, Select, Checkbox, etc.)
- Data display (Table, Card, Badge, etc.)
- Navigation (Tabs, Breadcrumb, etc.)
- Feedback (Alert, Toast, Dialog, etc.)

## 📱 Pages & Navigation

### Public Pages

- **Login**: User authentication
- **Register**: New user registration
- **Home**: Landing page with system overview

### Dashboard Pages (Role-based)

- **Admin Dashboard**: System overview, user management, approval queue
- **Doctor Dashboard**: Appointments, patient management
- **Staff Dashboard**: Ambulance requests, service coordination
- **Patient Dashboard**: Appointments, medical history, service requests

### Feature Pages

- **Appointments**: Booking, management, history
- **Ambulance**: Request form, tracking, history
- **User Management**: Admin tools for user oversight
- **Feedback**: Submission forms, admin response system
- **Profile**: Account settings, password management

## 🚀 Deployment

### Environment Variables

```bash
# Optional - defaults provided for development
JWT_SECRET=your_jwt_secret_here
PING_MESSAGE=custom_ping_message
```

### Build Commands

```bash
# Development
pnpm dev

# Production build
pnpm build

# Start production server
pnpm start

# Run tests
pnpm test

# Type checking
pnpm typecheck
```

### Netlify Deployment

The project includes Netlify configuration:

- Serverless functions in `netlify/functions/`
- Automatic redirects configured in `netlify.toml`
- Build command: `pnpm build`
- Publish directory: `dist/spa`

### Vercel Deployment

Compatible with Vercel serverless deployment:

- API routes automatically detected
- Zero-configuration deployment
- Environment variables support

## 🗂 Project Structure

```
healthcare-management-system/
├── client/                          # React frontend
│   ├── components/                  # React components
│   │   ├── ui/                     # Radix UI component library
│   │   ├── Layout.tsx              # Common layout wrapper
│   │   ├── DoctorLayout.tsx        # Doctor-specific layout
│   │   ├── PatientLayout.tsx       # Patient-specific layout
│   │   └── StaffLayout.tsx         # Staff-specific layout
│   ├── hooks/                      # Custom React hooks
│   ├── lib/                        # Utility libraries
│   ├── pages/                      # Route components
│   │   ├── AdminDashboard.tsx      # Admin overview
│   │   ├── DoctorDashboard.tsx     # Doctor dashboard
│   │   ├── PatientDashboard.tsx    # Patient dashboard
│   │   ├── Appointments.tsx        # Appointment management
│   │   ├── BookAppointment.tsx     # Appointment booking
│   │   ├── Ambulance.tsx           # Ambulance services
│   │   ├── UserManagement.tsx      # Admin user tools
│   │   └── ...                     # Additional pages
│   ├── App.tsx                     # App entry point & routing
│   ├── main.tsx                    # React DOM entry
│   └── global.css                  # TailwindCSS styles
├── server/                         # Express backend
│   ├── routes/                     # API route handlers
│   │   ├── auth.ts                 # Authentication endpoints
│   │   ├── appointments.ts         # Appointment management
│   │   ├── ambulance.ts            # Ambulance services
│   │   ├── users.ts                # User management
│   │   ├── data.ts                 # Data endpoints
│   │   └── ...                     # Additional routes
│   ├── database.ts                 # SQLite database setup
│   ├── admin-init.ts               # Admin account initialization
│   └── index.ts                    # Express server setup
├── shared/                         # Shared TypeScript types
│   └── api.ts                      # API interface definitions
├── netlify/                        # Netlify deployment
│   └── functions/                  # Serverless functions
└── package.json                    # Dependencies & scripts
```

## 🧪 Testing

The project uses Vitest for testing:

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch
```

Test files are located alongside source files with `.spec.ts` or `.test.ts` extensions.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

### Development Guidelines

- Follow TypeScript best practices
- Use existing UI components from `client/components/ui/`
- Maintain consistent code formatting with Prettier
- Write tests for new functionality
- Follow the established project structure

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

1. Check the documentation
2. Review existing issues
3. Create a new issue with detailed description
4. Contact the development team

## 🔄 Version History

- **v1.0.0**: Initial release with core healthcare management features
  - User management with role-based access
  - Appointment booking and management
  - Ambulance service coordination
  - Feedback and complaint system
  - Admin dashboard and analytics

---

Built with ❤️ using React, TypeScript, and modern web technologies.
