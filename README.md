# Doctor Appointment System

A modern full-stack web application for managing doctor appointments with role-based authentication (patient, admin, doctor).

## Features

✨ **Authentication & Authorization**
- JWT-based authentication system
- Three user roles: Patient, Admin, Doctor
- Secure password hashing with bcryptjs

🏥 **Doctor Management**
- 41+ doctor profiles with detailed information
- Specialization, experience, ratings, and reviews
- Hospital affiliation and consultation fees
- Admin dashboard for managing doctors

📅 **Appointment Booking**
- Patients can browse and book doctor appointments
- Real-time appointment status tracking
- Doctor-specific appointment view
- Admin can view all appointments

💻 **User Dashboards**
- **Patient Dashboard**: Browse doctors, book appointments, view history
- **Admin Dashboard**: Manage doctors, view all appointments, system statistics
- **Doctor Dashboard**: View assigned appointments and patient details

🎨 **Modern UI/UX**
- Glassmorphism design effects
- Smooth animations and transitions
- Custom scrollable doctor carousel
- Responsive design for all devices
- Professional gradient themes

## Tech Stack

### Backend
- Node.js & Express.js
- MongoDB (Atlas)
- Mongoose ODM
- JWT Authentication
- bcryptjs for password hashing

### Frontend
- React 18.3.1
- Vite 5.4.0
- Vanilla CSS with advanced effects
- Responsive design

## Project Structure

```
doctor-appointment-system/
├── server/
│   ├── models/          # Mongoose schemas
│   ├── controllers/     # Request handlers
│   ├── routes/          # API endpoints
│   ├── middleware/      # Auth & validation
│   ├── seed.js         # Database seeding
│   ├── server.js       # Express server
│   └── package.json
├── client/
│   ├── src/
│   │   ├── App.jsx     # Main component
│   │   ├── styles.css  # Global styles
│   │   └── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── dist/           # Build output
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 14+
- npm or yarn
- MongoDB Atlas account

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/aryansinha21/doctor-appointment-system.git
cd doctor-appointment-system
```

2. **Setup Backend**
```bash
cd server
npm install
# Create .env file with:
# MONGO_URI=your_mongodb_uri
# JWT_SECRET=your_jwt_secret
# PORT=5000
# ADMIN_KEY=adminsecret123

npm run dev  # or npm start for production
```

3. **Setup Frontend**
```bash
cd client
npm install
npm run dev
```

4. **Seed Database** (optional)
```bash
cd server
node seed.js
```

### Access the Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### Doctors
- `GET /api/doctors` - List all doctors
- `POST /api/doctors/add` - Add doctor (admin only)

### Appointments
- `GET /api/appointments` - Get user appointments
- `POST /api/appointments/book` - Book appointment

## Default Credentials

### Admin Account
```
Email: admin@hospital.com
Password: admin123
Admin Key: adminsecret123
```

## Deployment

### Frontend (Vercel)
1. Push code to GitHub
2. Connect GitHub repository to Vercel
3. Set environment variables if needed
4. Deploy automatically on push

### Backend (Railway)
1. Create Railway account
2. Connect GitHub repository
3. Set environment variables (MONGO_URI, JWT_SECRET, etc.)
4. Deploy

## Environment Variables

### Server (.env)
```
MONGO_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
PORT=5000
ADMIN_KEY=adminsecret123
```

### Client (vite.config.js)
The API proxy is configured to forward requests from `/api` to the backend server.

## Features Highlight

### Appointments Dashboard
- Filtered by user role
- Real-time status updates
- Professional card layout with animations

### Doctor Carousel
- Horizontally scrollable
- Smooth scroll behavior
- Hover effects and transitions

### Glassmorphism Design
- Modern frosted glass effect
- Gradient overlays
- Custom scrollbars

## Future Enhancements

- [ ] Doctor search and filtering
- [ ] Appointment cancellation
- [ ] Doctor availability calendar
- [ ] Patient notifications
- [ ] Payment integration
- [ ] Doctor ratings and reviews
- [ ] Video consultation support
- [ ] Advanced analytics

## License

MIT License

## Author

[Aryan Sinha](https://github.com/aryansinha21)

## Support

For issues and feature requests, please create an issue on GitHub.
