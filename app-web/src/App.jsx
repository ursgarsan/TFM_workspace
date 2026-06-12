import { useEffect, useState } from 'react'
import { API_BASE_URL, fetchApiHealth } from './services/health'
import './App.css'

function App() {
  const [status, setStatus] = useState('loading')
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function runHealthCheck() {
      try {
        const payload = await fetchApiHealth()
        if (!cancelled) {
          setData(payload)
          setStatus('ok')
        }
      } catch (err) {
        if (!cancelled) {
          setStatus('error')
          setError(err instanceof Error ? err.message : 'Unknown error')
        }
      }
    }

    runHealthCheck()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <main className="app-shell">
      <h1>app-web</h1>
      <p className="subtitle">Conectividad con app-api</p>

      <div className={`status-card status-${status}`}>
        <p>
          <strong>Backend:</strong>{' '}
          {status === 'loading' && 'Comprobando...'}
          {status === 'ok' && 'Conectado'}
          {status === 'error' && 'Sin conexion'}
        </p>
        <p>
          <strong>API Base URL:</strong> {API_BASE_URL}
        </p>

        {status === 'ok' && data && (
          <p>
            <strong>Respuesta:</strong> status={data.status}, uptime_seconds={data.uptime_seconds}
          </p>
        )}

        {status === 'error' && <p className="error-text">{error}</p>}
      </div>
    </main>
  )
}

export default App
