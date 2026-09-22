# Institute Manager

A web management portal for I-SHARK Institute of Computer Technologies.

## Features

- **Attendance Management**: Daily attendance tracking, clock-in/out records, status tracking (Present, Late, Absent, Leave), and quick-punch controls.
- **Student Directory**: Student roster management, credential provisioning, batch allocation, and contact details.
- **Task Assignments**: Coursework, project assignments, lab deliverables, and deadline distribution.
- **Tests & Quizzes**: Examination schedules, curriculum syllabi, and student admit slips.
- **Reports & Analytics**: Monthly attendance audit matrix, turnout statistics, and CSV/PDF export.

## Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Open `.env.local` and fill in your Firebase configuration values:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_FIREBASE_FIRESTORE_DATABASE_ID`

3. Start the local development server:
   ```bash
   npm run dev
   ```
