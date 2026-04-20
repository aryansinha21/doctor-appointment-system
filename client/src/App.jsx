import { useEffect, useMemo, useState, useRef } from "react";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

const initialAuth = {
  name: "",
  email: "",
  password: "",
  adminKey: "",
};
const initialDoctor = { name: "", email: "", password: "", specialization: "" };
const initialBooking = { doctorId: "", date: "", time: "" };

const getStorage = () => {
  try {
    return globalThis?.localStorage ?? null;
  } catch {
    return null;
  }
};

const readStorage = (key) => {
  try {
    const storage = getStorage();
    return storage ? storage.getItem(key) : null;
  } catch {
    return null;
  }
};

const writeStorage = (key, value) => {
  try {
    const storage = getStorage();
    if (storage) {
      storage.setItem(key, value);
    }
  } catch {
    // Ignore storage write failures and continue with in-memory state.
  }
};

const removeStorage = (key) => {
  try {
    const storage = getStorage();
    if (storage) {
      storage.removeItem(key);
    }
  } catch {
    // Ignore storage remove failures and continue with in-memory state.
  }
};

const getInitialSession = () => {
  const token = readStorage("token") || "";
  const rawUser = readStorage("user");

  if (!rawUser) {
    return { token, user: null };
  }

  try {
    const parsedUser = JSON.parse(rawUser);

    if (!parsedUser || typeof parsedUser !== "object") {
      throw new Error("Invalid user payload");
    }

    return { token, user: parsedUser };
  } catch {
    removeStorage("token");
    removeStorage("user");
    return { token: "", user: null };
  }
};

const formatDisplayDate = (dateValue) => {
  if (!dateValue) return "-";
  const parsed = new Date(`${dateValue}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return dateValue;
  }

  return parsed.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
};

const formatDisplayTime = (timeValue) => {
  if (!timeValue) return "-";

  const [hours, minutes] = timeValue.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return timeValue;
  }

  const parsed = new Date();
  parsed.setHours(hours, minutes, 0, 0);
  return parsed.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
};

const RoleIcon = ({ role }) => {
  if (role === "admin") {
    return (
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path
          d="M10 2.8 4.8 4.9v4.6c0 3.2 2.2 6.1 5.2 6.9 3-.8 5.2-3.7 5.2-6.9V4.9L10 2.8Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="m7.8 9.9 1.5 1.6 3-3.2"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (role === "doctor") {
    return (
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <rect
          x="3"
          y="3"
          width="14"
          height="14"
          rx="3"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <path
          d="M10 6.5v7M6.5 10h7"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M10 10.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.6 16.3a5.4 5.4 0 0 1 10.8 0"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
};

const RolePill = ({ role, label }) => (
  <span className={`role-pill role-pill--${role}`}>
    <span className="role-pill-icon">
      <RoleIcon role={role} />
    </span>
    {label}
  </span>
);

const AppointmentCard = ({ appointment, heading, subheading, stagger = 0 }) => {
  const statusValue =
    appointment?.status === "completed" || appointment?.status === "cancelled"
      ? appointment.status
      : "booked";

  return (
    <div className="appointment-card" style={{ "--stagger": stagger }}>
      <div className="appointment-main">
        <strong>{heading}</strong>
        <span>{subheading}</span>
      </div>
      <div className="appointment-meta">
        <span className="meta-chip">
          <span className="meta-label">Date</span>
          {formatDisplayDate(appointment?.date)}
        </span>
        <span className="meta-chip">
          <span className="meta-label">Time</span>
          {formatDisplayTime(appointment?.time)}
        </span>
      </div>
      <div className={`status status--${statusValue}`}>{statusValue}</div>
    </div>
  );
};

function App() {
  const initialSessionRef = useRef(null);

  if (initialSessionRef.current === null) {
    initialSessionRef.current = getInitialSession();
  }

  const [page, setPage] = useState("login");
  const [token, setToken] = useState(initialSessionRef.current.token);
  const [user, setUser] = useState(initialSessionRef.current.user);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [authForm, setAuthForm] = useState(initialAuth);
  const [doctorForm, setDoctorForm] = useState(initialDoctor);
  const [bookingForm, setBookingForm] = useState(initialBooking);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const messageTimeoutRef = useRef(null);

  const isAdmin = user?.role === "admin";
  const isDoctor = user?.role === "doctor";
  const todayDate = useMemo(() => new Date().toISOString().split("T")[0], []);

  const doctorPatients = useMemo(() => {
    const names = appointments
      .map((item) => item.patientId?.name)
      .filter(Boolean);
    return [...new Set(names)];
  }, [appointments]);

  const specializationCount = useMemo(() => {
    const names = doctors
      .map((doctor) => doctor.specialization)
      .filter(Boolean);
    return new Set(names).size;
  }, [doctors]);

  const upcomingAppointmentsCount = useMemo(() => {
    const now = new Date();

    return appointments.filter((appointment) => {
      if (!appointment?.date || !appointment?.time) return false;
      const parsed = new Date(`${appointment.date}T${appointment.time}:00`);

      if (Number.isNaN(parsed.getTime())) {
        return false;
      }

      return parsed >= now;
    }).length;
  }, [appointments]);

  const nextAppointment = useMemo(() => {
    const now = new Date();

    const upcoming = appointments
      .map((appointment) => {
        if (!appointment?.date || !appointment?.time) return null;
        const parsed = new Date(`${appointment.date}T${appointment.time}:00`);

        if (Number.isNaN(parsed.getTime()) || parsed < now) {
          return null;
        }

        return {
          ...appointment,
          parsedDate: parsed,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.parsedDate - b.parsedDate);

    return upcoming[0] || null;
  }, [appointments]);

  const authHeaders = useMemo(() => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [token]);

  const fetchApi = async (path, options = {}) => {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    const response = await fetch(`${API_URL}${normalizedPath}`, {
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
        ...(options.headers || {}),
      },
      ...options,
    });

    if (!response.ok) {
      if (response.status === 401) {
        removeStorage("token");
        removeStorage("user");
        setToken("");
        setUser(null);
        setPage("login");
        setAppointments([]);
      }

      const data = await response.json().catch(() => ({}));
      throw new Error(data.msg || data.error || response.statusText);
    }

    return response.json();
  };

  const showMessage = (text) => {
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
    }

    setMessage(text);
    messageTimeoutRef.current = setTimeout(() => setMessage(""), 4200);
  };

  const loadDoctors = async () => {
    try {
      const data = await fetchApi("/api/doctors");
      setDoctors(Array.isArray(data) ? data : []);
    } catch (err) {
      showMessage(err.message);
    }
  };

  const loadAppointments = async () => {
    if (!token) return;
    try {
      const data = await fetchApi("/api/appointments");
      setAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      showMessage(err.message);
    }
  };

  useEffect(() => {
    loadDoctors();
    if (token) loadAppointments();
  }, [token]);

  useEffect(() => {
    return () => {
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }
    };
  }, []);

  const saveAuth = (tokenValue, userValue) => {
    writeStorage("token", tokenValue);
    writeStorage("user", JSON.stringify(userValue));
    setToken(tokenValue);
    setUser(userValue);
    setPage("dashboard");
  };

  const logout = () => {
    removeStorage("token");
    removeStorage("user");
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
        password: authForm.password,
      };

      if (adminMode) {
        payload.role = "admin";
        payload.adminKey = authForm.adminKey;
      }

      await fetchApi("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
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
          password: authForm.password,
        }),
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
        body: JSON.stringify(doctorForm),
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
        body: JSON.stringify(bookingForm),
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
      <div className="auth-layout">
        <aside className="auth-intro card">
          <p className="eyebrow">HealthBridge Portal</p>
          <h1>Book trusted doctors with a clean, secure workflow</h1>
          <p className="subtitle">
            Search specialists, lock in your preferred slot, and keep your full
            appointment journey in one medical dashboard.
          </p>

          <div className="intro-metrics">
            <article className="metric-item">
              <span>{doctors.length || 0}</span>
              <p>Doctors onboarded</p>
            </article>
            <article className="metric-item">
              <span>{specializationCount || 0}</span>
              <p>Specializations</p>
            </article>
            <article className="metric-item">
              <span>{appointments.length || 0}</span>
              <p>Appointments tracked</p>
            </article>
          </div>

          <div className="intro-points">
            <p>Verified doctor profiles with specialization and experience.</p>
            <p>Role-based access for patients, admins, and doctors.</p>
            <p>Simple booking flow with real-time appointment visibility.</p>
          </div>
        </aside>

        <div className="card auth-card">
          <div className="hero-block compact">
            <span className="hero-chip">
              {page === "login"
                ? "Patient / Admin / Doctor Access"
                : "Create a Secure Medical Account"}
            </span>
            <h2>{page === "login" ? "Welcome back" : "Create your profile"}</h2>
            <p>
              {page === "login"
                ? "Sign in to continue booking and tracking appointments."
                : "Register now and start managing appointments in minutes."}
            </p>
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
                  onChange={(e) =>
                    setAuthForm({ ...authForm, email: e.target.value })
                  }
                  placeholder="doctor@email.com"
                  required
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  value={authForm.password}
                  onChange={(e) =>
                    setAuthForm({ ...authForm, password: e.target.value })
                  }
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
                  onChange={(e) =>
                    setAuthForm({ ...authForm, name: e.target.value })
                  }
                  placeholder="John Doe"
                  required
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={authForm.email}
                  onChange={(e) =>
                    setAuthForm({ ...authForm, email: e.target.value })
                  }
                  placeholder="john@email.com"
                  required
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  value={authForm.password}
                  onChange={(e) =>
                    setAuthForm({ ...authForm, password: e.target.value })
                  }
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
                    onChange={(e) =>
                      setAuthForm({ ...authForm, adminKey: e.target.value })
                    }
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
      </div>
    </section>
  );

  const patientDashboard = (
    <div className="dashboard dashboard--patient">
      <div className="page-header">
        <div>
          <p className="eyebrow">Patient Portal</p>
          <h1>Welcome, {user?.name || "Patient"}</h1>
          <p className="subtitle">
            Browse {doctors.length} doctors and manage{" "}
            {upcomingAppointmentsCount} upcoming appointments
          </p>
          {nextAppointment && (
            <p className="next-visit">
              Next visit: {formatDisplayDate(nextAppointment.date)} at{" "}
              {formatDisplayTime(nextAppointment.time)} with{" "}
              {nextAppointment.doctorId?.name || "your doctor"}
            </p>
          )}
        </div>
        <div className="header-actions">
          <RolePill role="patient" label="Patient" />
          <button className="button secondary" onClick={logout}>
            Logout
          </button>
        </div>
      </div>

      <section className="card">
        <h2>Featured Doctors</h2>
        <p className="section-note">
          Top available specialists for online consultation booking.
        </p>
        <div className="doctors-scroll">
          {doctors.length === 0 ? (
            <p className="empty-state">No doctors available right now.</p>
          ) : (
            doctors.map((doctor, index) => (
              <div
                className="doctor-card-scroll"
                key={doctor._id}
                style={{ "--stagger": index % 8 }}
              >
                <strong>{doctor.name}</strong>
                <span className="spec">{doctor.specialization}</span>
                <div className="rating">
                  <span>★ {doctor.rating || 4.5}</span>
                  <span>({doctor.reviews || 0})</span>
                </div>
                <span className="doctor-meta">
                  Experience: {doctor.experience || 10}y
                </span>
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
                onChange={(e) =>
                  setBookingForm({ ...bookingForm, doctorId: e.target.value })
                }
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
                onChange={(e) =>
                  setBookingForm({ ...bookingForm, date: e.target.value })
                }
                min={todayDate}
                required
              />
            </label>
            <label>
              Time Slot
              <input
                type="time"
                value={bookingForm.time}
                onChange={(e) =>
                  setBookingForm({ ...bookingForm, time: e.target.value })
                }
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
              <p className="empty-state">No specialists added yet.</p>
            ) : (
              doctors.slice(0, 8).map((doctor, index) => (
                <div
                  className="doctor-card"
                  key={doctor._id}
                  style={{ "--stagger": index % 8 }}
                >
                  <strong>{doctor.name}</strong>
                  <span>{doctor.specialization}</span>
                  <span className="price-tag">₹{doctor.fees || 400}/visit</span>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      <section className="card">
        <h2>Your Booked Appointments</h2>
        <p className="section-note">
          Track your scheduled consultations and visit details.
        </p>
        {appointments.length === 0 ? (
          <p className="empty-state">
            No appointments yet. Book one to get started.
          </p>
        ) : (
          <div className="appointment-grid">
            {appointments.map((appointment, index) => (
              <AppointmentCard
                key={appointment._id}
                appointment={appointment}
                heading={appointment.doctorId?.name || "Doctor"}
                subheading={
                  appointment.doctorId?.specialization || "Specialist"
                }
                stagger={index % 8}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );

  const adminDashboard = (
    <div className="dashboard dashboard--admin">
      <div className="page-header">
        <div>
          <p className="eyebrow">Administrator</p>
          <h1>{user?.name || "Admin"}</h1>
          <p className="subtitle">
            Manage clinicians, patient bookings, and overall clinic operations
          </p>
        </div>
        <div className="header-actions">
          <RolePill role="admin" label="Admin" />
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
          <p>
            {
              new Set(
                appointments.map((a) => a.patientId?.email).filter(Boolean),
              ).size
            }
          </p>
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
                onChange={(e) =>
                  setDoctorForm({ ...doctorForm, name: e.target.value })
                }
                placeholder="Dr. John Smith"
                required
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={doctorForm.email}
                onChange={(e) =>
                  setDoctorForm({ ...doctorForm, email: e.target.value })
                }
                placeholder="doctor@hospital.com"
                required
              />
            </label>
            <label>
              Specialization
              <input
                type="text"
                value={doctorForm.specialization}
                onChange={(e) =>
                  setDoctorForm({
                    ...doctorForm,
                    specialization: e.target.value,
                  })
                }
                placeholder="e.g., Cardiology"
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={doctorForm.password}
                onChange={(e) =>
                  setDoctorForm({ ...doctorForm, password: e.target.value })
                }
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
              <p className="empty-state">No doctors registered yet.</p>
            ) : (
              doctors.slice(0, 10).map((doctor, index) => (
                <div
                  className="doctor-card"
                  key={doctor._id}
                  style={{ "--stagger": index % 8 }}
                >
                  <strong>{doctor.name}</strong>
                  <span>{doctor.specialization}</span>
                  <span className="star-tag">★ {doctor.rating || 4.5}</span>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      <section className="card">
        <h2>All Appointments</h2>
        {appointments.length === 0 ? (
          <p className="empty-state">No appointments recorded.</p>
        ) : (
          <div className="appointment-grid">
            {appointments.map((appointment, index) => (
              <AppointmentCard
                key={appointment._id}
                appointment={appointment}
                heading={appointment.doctorId?.name || "Doctor"}
                subheading={appointment.patientId?.name || "Patient"}
                stagger={index % 8}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );

  const doctorDashboard = (
    <div className="dashboard dashboard--doctor">
      <div className="page-header">
        <div>
          <p className="eyebrow">Healthcare Professional</p>
          <h1>Dr. {user?.name || "Doctor"}</h1>
          <p className="subtitle">
            Review your schedule and stay updated on patient consultations
          </p>
        </div>
        <div className="header-actions">
          <RolePill role="doctor" label="Doctor" />
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
          <p className="empty-state">No appointments assigned yet.</p>
        ) : (
          <div className="appointment-grid">
            {appointments.map((appointment, index) => (
              <AppointmentCard
                key={appointment._id}
                appointment={appointment}
                heading={appointment.patientId?.name || "Patient"}
                subheading={appointment.patientId?.email || "No email provided"}
                stagger={index % 8}
              />
            ))}
          </div>
        )}
      </section>

      <section className="card">
        <h2>Patient List</h2>
        {doctorPatients.length === 0 ? (
          <p className="empty-state">No patients assigned yet.</p>
        ) : (
          <div className="doctor-list">
            {doctorPatients.map((name, index) => (
              <div
                className="doctor-card"
                key={name}
                style={{ "--stagger": index % 8 }}
              >
                <strong>{name}</strong>
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
      {token
        ? isAdmin
          ? adminDashboard
          : isDoctor
            ? doctorDashboard
            : patientDashboard
        : authSection}
    </div>
  );
}

export default App;
