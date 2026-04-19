import { useEffect, useMemo, useState, useRef } from "react";

const API_URL = import.meta.env.VITE_API_URL || "";

const initialAuth = {
  name: "",
  email: "",
  password: "",
  adminKey: ""
};
const initialDoctor = { name: "", email: "", password: "", specialization: "" };
const initialBooking = { doctorId: "", date: "", time: "" };

function App() {
  const [page, setPage] = useState("login");
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user") || "null"));
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [authForm, setAuthForm] = useState(initialAuth);
  const [doctorForm, setDoctorForm] = useState(initialDoctor);
  const [bookingForm, setBookingForm] = useState(initialBooking);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const scrollContainerRef = useRef(null);

  const isAdmin = user?.role === "admin";
  const isDoctor = user?.role === "doctor";

  const doctorPatients = useMemo(() => {
    const names = appointments
      .map((item) => item.patientId?.name)
      .filter(Boolean);
    return [...new Set(names)];
  }, [appointments]);

  const authHeaders = useMemo(() => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [token]);

  const fetchApi = async (path, options = {}) => {
    const response = await fetch(`${API_URL}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
        ...(options.headers || {})
      },
      ...options
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.msg || data.error || response.statusText);
    }

    return response.json();
  };

  const showMessage = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(""), 4200);
  };

  const loadDoctors = async () => {
    try {
      const data = await fetchApi("/api/doctors");
      setDoctors(data);
    } catch (err) {
      showMessage(err.message);
    }
  };

  const loadAppointments = async () => {
    if (!token) return;
    try {
      const data = await fetchApi("/api/appointments");
      setAppointments(data);
    } catch (err) {
      showMessage(err.message);
    }
  };

  useEffect(() => {
    loadDoctors();
    if (token) loadAppointments();
  }, [token]);

  const saveAuth = (tokenValue, userValue) => {
    localStorage.setItem("token", tokenValue);
    localStorage.setItem("user", JSON.stringify(userValue));
    setToken(tokenValue);
    setUser(userValue);
    setPage("dashboard");
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken("");
    setUser(null);
    setPage("login");
    setAppointments([]);
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const payload = {
        name: authForm.name,
        email: authForm.email,
        password: authForm.password
      };

      if (adminMode) {
        payload.role = "admin";
        payload.adminKey = authForm.adminKey;
      }

      await fetchApi("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      showMessage("Registration successful. Please login.");
      setPage("login");
      setAuthForm(initialAuth);
      setAdminMode(false);
    } catch (err) {
      showMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const data = await fetchApi("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: authForm.email,
          password: authForm.password
        })
      });

      saveAuth(data.token, data.user);
      setAuthForm(initialAuth);
      showMessage(`Welcome back, ${data.user.name}!`);
    } catch (err) {
      showMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDoctor = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await fetchApi("/api/doctors/add", {
        method: "POST",
        body: JSON.stringify(doctorForm)
      });
      setDoctorForm(initialDoctor);
      loadDoctors();
      showMessage("Doctor added successfully.");
    } catch (err) {
      showMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await fetchApi("/api/appointments/book", {
        method: "POST",
        body: JSON.stringify(bookingForm)
      });
      setBookingForm(initialBooking);
      loadAppointments();
      showMessage("Appointment booked successfully!");
    } catch (err) {
      showMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const authSection = (
    <section className="panel">
      <div className="card auth-card">
        <div className="hero-block">
          <h1>Doctor Appointment</h1>
          <p>Find and book appointments with top healthcare professionals.</p>
        </div>

        <div className="tabs">
          <button
            className={page === "login" ? "active" : ""}
            onClick={() => setPage("login")}
          >
            Login
          </button>
          <button
            className={page === "register" ? "active" : ""}
            onClick={() => setPage("register")}
          >
            Register
          </button>
        </div>

        {page === "login" ? (
          <form onSubmit={handleLogin} className="form-grid">
            <label>
              Email
              <input
                type="email"
                value={authForm.email}
                onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                placeholder="doctor@email.com"
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={authForm.password}
                onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                placeholder="••••••••"
                required
              />
            </label>
            <button className="button primary" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="form-grid">
            <label>
              Full Name
              <input
                type="text"
                value={authForm.name}
                onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                placeholder="John Doe"
                required
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={authForm.email}
                onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                placeholder="john@email.com"
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={authForm.password}
                onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={adminMode}
                onChange={(e) => setAdminMode(e.target.checked)}
              />
              Register as admin
            </label>
            {adminMode && (
              <label>
                Admin Code
                <input
                  type="password"
                  value={authForm.adminKey}
                  onChange={(e) => setAuthForm({ ...authForm, adminKey: e.target.value })}
                  placeholder="Admin security key"
                  required
                />
              </label>
            )}
            <button className="button primary" disabled={loading}>
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>
        )}
      </div>
    </section>
  );

  const patientDashboard = (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <p className="eyebrow">Patient Portal</p>
          <h1>Welcome, {user?.name || "Patient"}</h1>
          <p className="subtitle">Browse doctors and book your next appointment</p>
        </div>
        <div className="header-actions">
          <span className="role-pill">Patient</span>
          <button className="button secondary" onClick={logout}>
            Logout
          </button>
        </div>
      </div>

      <section className="card">
        <h2>Featured Doctors</h2>
        <div className="doctors-scroll" ref={scrollContainerRef}>
          {doctors.length === 0 ? (
            <p>No doctors available.</p>
          ) : (
            doctors.map((doctor) => (
              <div className="doctor-card-scroll" key={doctor._id}>
                <strong>{doctor.name}</strong>
                <span className="spec">{doctor.specialization}</span>
                <div className="rating">
                  <span>★ {doctor.rating || 4.5}</span>
                  <span>({doctor.reviews || 0})</span>
                </div>
                <span style={{fontSize: "0.8rem", color: "#a4b0d2"}}>Experience: {doctor.experience || 10}y</span>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="grid-2">
        <article className="card">
          <h2>Book an Appointment</h2>
          <form onSubmit={handleBook} className="form-grid">
            <label>
              Select Doctor
              <select
                value={bookingForm.doctorId}
                onChange={(e) => setBookingForm({ ...bookingForm, doctorId: e.target.value })}
                required
              >
                <option value="">Choose a doctor...</option>
                {doctors.map((doctor) => (
                  <option key={doctor._id} value={doctor._id}>
                    {doctor.name} • {doctor.specialization}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Preferred Date
              <input
                type="date"
                value={bookingForm.date}
                onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                required
              />
            </label>
            <label>
              Time Slot
              <input
                type="time"
                value={bookingForm.time}
                onChange={(e) => setBookingForm({ ...bookingForm, time: e.target.value })}
                required
              />
            </label>
            <button className="button primary" disabled={loading}>
              {loading ? "Booking..." : "Reserve Slot"}
            </button>
          </form>
        </article>

        <article className="card">
          <h2>Available Specialists</h2>
          <div className="doctor-list">
            {doctors.length === 0 ? (
              <p>No doctors yet.</p>
            ) : (
              doctors.slice(0, 8).map((doctor) => (
                <div className="doctor-card" key={doctor._id}>
                  <strong>{doctor.name}</strong>
                  <span>{doctor.specialization}</span>
                  <span style={{fontSize: "0.8rem", color: "#5cf7d7"}}>₹{doctor.fees || 400}/visit</span>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      <section className="card">
        <h2>Your Booked Appointments</h2>
        {appointments.length === 0 ? (
          <p>No appointments yet. Book one to get started!</p>
        ) : (
          <div className="appointment-grid">
            {appointments.map((appointment) => (
              <div className="appointment-card" key={appointment._id}>
                <div>
                  <strong>{appointment.doctorId?.name || "Doctor"}</strong>
                  <span>{appointment.doctorId?.specialization || "Specialist"}</span>
                </div>
                <div>
                  <span>📅 {appointment.date}</span>
                  <span>🕐 {appointment.time}</span>
                </div>
                <div className="status">{appointment.status}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );

  const adminDashboard = (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <p className="eyebrow">Administrator</p>
          <h1>{user?.name || "Admin"}</h1>
          <p className="subtitle">Manage healthcare professionals and appointments</p>
        </div>
        <div className="header-actions">
          <span className="role-pill">Admin</span>
          <button className="button secondary" onClick={logout}>
            Logout
          </button>
        </div>
      </div>

      <section className="stats-grid">
        <div className="stat-card">
          <h3>Total Doctors</h3>
          <p>{doctors.length}</p>
        </div>
        <div className="stat-card">
          <h3>Total Appointments</h3>
          <p>{appointments.length}</p>
        </div>
        <div className="stat-card">
          <h3>Active Users</h3>
          <p>{new Set(appointments.map(a => a.patientId?.email)).size}</p>
        </div>
      </section>

      <section className="grid-2">
        <article className="card">
          <h2>Register New Doctor</h2>
          <form onSubmit={handleAddDoctor} className="form-grid">
            <label>
              Doctor Name
              <input
                type="text"
                value={doctorForm.name}
                onChange={(e) => setDoctorForm({ ...doctorForm, name: e.target.value })}
                placeholder="Dr. John Smith"
                required
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={doctorForm.email}
                onChange={(e) => setDoctorForm({ ...doctorForm, email: e.target.value })}
                placeholder="doctor@hospital.com"
                required
              />
            </label>
            <label>
              Specialization
              <input
                type="text"
                value={doctorForm.specialization}
                onChange={(e) => setDoctorForm({ ...doctorForm, specialization: e.target.value })}
                placeholder="e.g., Cardiology"
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={doctorForm.password}
                onChange={(e) => setDoctorForm({ ...doctorForm, password: e.target.value })}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </label>
            <button className="button primary" disabled={loading}>
              {loading ? "Adding..." : "Add Doctor"}
            </button>
          </form>
        </article>

        <article className="card">
          <h2>Doctor Directory</h2>
          <div className="doctor-list">
            {doctors.length === 0 ? (
              <p>No doctors registered.</p>
            ) : (
              doctors.slice(0, 10).map((doctor) => (
                <div className="doctor-card" key={doctor._id}>
                  <strong>{doctor.name}</strong>
                  <span>{doctor.specialization}</span>
                  <span style={{fontSize: "0.8rem", color: "#5cf7d7"}}>★ {doctor.rating || 4.5}</span>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      <section className="card">
        <h2>All Appointments</h2>
        {appointments.length === 0 ? (
          <p>No appointments recorded.</p>
        ) : (
          <div className="appointment-grid">
            {appointments.map((appointment) => (
              <div className="appointment-card" key={appointment._id}>
                <div>
                  <strong>{appointment.doctorId?.name}</strong>
                  <span>{appointment.patientId?.name}</span>
                </div>
                <div>
                  <span>📅 {appointment.date}</span>
                  <span>🕐 {appointment.time}</span>
                </div>
                <div className="status">{appointment.status}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );

  const doctorDashboard = (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <p className="eyebrow">Healthcare Professional</p>
          <h1>Dr. {user?.name || "Doctor"}</h1>
          <p className="subtitle">Manage your appointments and patient schedule</p>
        </div>
        <div className="header-actions">
          <span className="role-pill">Doctor</span>
          <button className="button secondary" onClick={logout}>
            Logout
          </button>
        </div>
      </div>

      <section className="stats-grid">
        <div className="stat-card">
          <h3>Your Appointments</h3>
          <p>{appointments.length}</p>
        </div>
        <div className="stat-card">
          <h3>Unique Patients</h3>
          <p>{doctorPatients.length}</p>
        </div>
      </section>

      <section className="card">
        <h2>Scheduled Appointments</h2>
        {appointments.length === 0 ? (
          <p>No appointments assigned yet.</p>
        ) : (
          <div className="appointment-grid">
            {appointments.map((appointment) => (
              <div className="appointment-card" key={appointment._id}>
                <div>
                  <strong>Patient: {appointment.patientId?.name}</strong>
                  <span>{appointment.patientId?.email}</span>
                </div>
                <div>
                  <span>📅 {appointment.date}</span>
                  <span>🕐 {appointment.time}</span>
                </div>
                <div className="status">{appointment.status}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card">
        <h2>Patient List</h2>
        {doctorPatients.length === 0 ? (
          <p>No patients yet.</p>
        ) : (
          <div className="doctor-list">
            {doctorPatients.map((name) => (
              <div className="doctor-card" key={name}>
                <strong>👤 {name}</strong>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );

  return (
    <div className="app-shell">
      {message && <div className="toast">{message}</div>}
      {token ? (isAdmin ? adminDashboard : isDoctor ? doctorDashboard : patientDashboard) : authSection}
    </div>
  );
}

export default App;
