import React from "react";
import ReactDOM from "react-dom/client";
import "./styles.css";

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Frontend render error:", error, errorInfo);
  }

  handleReload = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } catch {
      // Continue even if localStorage is unavailable.
    }

    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            padding: "24px",
            background: "#edf6f5",
            color: "#17313a",
            fontFamily: "Manrope, Segoe UI, sans-serif",
          }}
        >
          <div
            style={{
              maxWidth: "560px",
              width: "100%",
              border: "1px solid #d2e4e2",
              borderRadius: "16px",
              padding: "24px",
              background: "#ffffff",
              boxShadow: "0 20px 60px rgba(12, 63, 81, 0.12)",
            }}
          >
            <h1 style={{ marginTop: 0, marginBottom: "12px" }}>
              Something went wrong while loading the app
            </h1>
            <p style={{ marginTop: 0, marginBottom: "16px", opacity: 0.9 }}>
              A runtime error prevented rendering. Clear session data and reload
              to recover.
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              style={{
                border: "none",
                borderRadius: "10px",
                padding: "10px 14px",
                fontWeight: 600,
                background: "linear-gradient(130deg, #0d7f79, #1d96df)",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              Clear Session and Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element with id 'root' was not found");
}

const root = ReactDOM.createRoot(rootElement);

const renderFatalLoadError = () => {
  root.render(
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "24px",
        background: "#edf6f5",
        color: "#17313a",
        fontFamily: "Manrope, Segoe UI, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "560px",
          width: "100%",
          border: "1px solid #d2e4e2",
          borderRadius: "16px",
          padding: "24px",
          background: "#ffffff",
          boxShadow: "0 20px 60px rgba(12, 63, 81, 0.12)",
        }}
      >
        <h1 style={{ marginTop: 0, marginBottom: "12px" }}>
          Unable to load the app bundle
        </h1>
        <p style={{ marginTop: 0, marginBottom: "16px", opacity: 0.9 }}>
          A script loading error occurred. Try a hard refresh. If it persists,
          clear browser cache and site data.
        </p>
      </div>
    </div>,
  );
};

const bootstrap = async () => {
  try {
    const { default: App } = await import("./App");

    root.render(
      <React.StrictMode>
        <AppErrorBoundary>
          <App />
        </AppErrorBoundary>
      </React.StrictMode>,
    );
  } catch (error) {
    console.error("Frontend bootstrap error:", error);
    renderFatalLoadError();
  }
};

bootstrap();
