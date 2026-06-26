function Login() {
    const handleLogin = () => {
        window.location.href = "/__catalyst/auth/login";
    };

    return (
        <div style={{
            height: "100vh",
            width: "100%",
            background: "#1a1a2e",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
        }}>
            <div style={{
                background: "#16213e",
                border: "1px solid #e94560",
                borderRadius: "12px",
                padding: "48px",
                textAlign: "center",
                width: "360px",
            }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>🚨</div>
                <h1 style={{ color: "white", fontSize: "24px", marginBottom: "4px" }}>CrimeSight AI</h1>
                <p style={{ color: "#aaa", fontSize: "13px", marginBottom: "32px" }}>
                    Karnataka State Police — Crime Intelligence
                </p>
                <button
                    onClick={handleLogin}
                    style={{
                        background: "#e94560",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        padding: "14px 32px",
                        fontSize: "16px",
                        fontWeight: "bold",
                        cursor: "pointer",
                        width: "100%",
                    }}
                >
                    Login with Zoho
                </button>
                <p style={{ color: "#555", fontSize: "11px", marginTop: "24px" }}>
                    Authorized personnel only
                </p>
            </div>
        </div>
    );
}

export default Login;