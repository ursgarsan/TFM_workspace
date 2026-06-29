import { API_BASE_URL } from '../services/api'

function LoginView({ loginForm, authLoading, authError, onLogin, onLoginFieldChange }) {
  return (
    <main className="portal-shell login-shell">
      <section className="login-card">
        <p className="eyebrow">Portal sanitario</p>
        <h1>Gestión clínica de medicación</h1>
        <p className="subtitle">Inicia sesión como profesional para gestionar pacientes y tratamientos.</p>
        <form className="form-grid" onSubmit={onLogin}>
          <label>
            Email
            <input
              name="email"
              type="email"
              value={loginForm.email}
              onChange={onLoginFieldChange}
              placeholder="pro@tfmapp.com"
              required
            />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              value={loginForm.password}
              onChange={onLoginFieldChange}
              placeholder="********"
              required
            />
          </label>
          <button className="login-submit-button" type="submit" disabled={authLoading}>
            {authLoading ? 'Accediendo...' : 'Acceder'}
          </button>
        </form>
        {authError && <p className="error-text">{authError}</p>}
        <p className="hint">API: {API_BASE_URL}</p>
      </section>
    </main>
  )
}

export { LoginView }
