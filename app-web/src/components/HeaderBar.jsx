import { FiLogOut } from 'react-icons/fi'

function HeaderBar({ userFullName, onLogout }) {
  return (
    <header className="portal-header">
      <div>
        <p className="eyebrow">Portal sanitario</p>
        <h1>Panel de personal clínico</h1>
        <p className="subtitle">Gestiona pacientes, tratamientos y pautas desde una única vista.</p>
      </div>
      <div className="header-actions">
        <p className="user-chip">{userFullName}</p>
        <button
          className="ghost icon-button"
          type="button"
          onClick={onLogout}
          aria-label="Cerrar sesion"
          title="Cerrar sesion"
        >
          <FiLogOut size={18} aria-hidden="true" focusable="false" />
        </button>
      </div>
    </header>
  )
}

export { HeaderBar }
