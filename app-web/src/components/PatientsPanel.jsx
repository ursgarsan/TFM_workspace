import { useState } from 'react'
import { FiPlus, FiRefreshCw, FiX } from 'react-icons/fi'

function PatientsPanel({
  patients,
  selectedPatientId,
  patientsLoading,
  patientForm,
  busyAction,
  onRefresh,
  onCreatePatient,
  onPatientFieldChange,
  onSelectPatient,
}) {
  const [showCreatePatientForm, setShowCreatePatientForm] = useState(false)

  const handleCreatePatient = async (event) => {
    await onCreatePatient(event)
    setShowCreatePatientForm(false)
  }

  return (
    <aside className="panel patients-panel">
      <div className="panel-head">
        <h2>Pacientes</h2>
        <div className="panel-actions">
          <button
            className="ghost icon-button"
            type="button"
            onClick={onRefresh}
            disabled={patientsLoading}
            aria-label="Refrescar pacientes"
            title="Refrescar pacientes"
          >
            <FiRefreshCw size={18} aria-hidden="true" focusable="false" />
          </button>
          <button
            className="icon-button create-toggle-button"
            type="button"
            onClick={() => setShowCreatePatientForm((previous) => !previous)}
            aria-label={showCreatePatientForm ? 'Cerrar formulario de paciente' : 'Crear paciente'}
            title={showCreatePatientForm ? 'Cerrar formulario de paciente' : 'Crear paciente'}
          >
            {showCreatePatientForm ? (
              <FiX size={21} aria-hidden="true" focusable="false" />
            ) : (
              <FiPlus size={21} aria-hidden="true" focusable="false" />
            )}
          </button>
        </div>
      </div>

      {showCreatePatientForm && (
        <form className="form-grid compact" onSubmit={handleCreatePatient}>
          <label>
            <span className="label-with-required">
              Nombre completo <span className="required-mark">*</span>
            </span>
            <input name="full_name" value={patientForm.full_name} onChange={onPatientFieldChange} required />
          </label>
          <label>
            <span className="label-with-required">
              Email <span className="required-mark">*</span>
            </span>
            <input name="email" type="email" value={patientForm.email} onChange={onPatientFieldChange} required />
          </label>
          <label>
            <span className="label-with-required">
              Password inicial <span className="required-mark">*</span>
            </span>
            <input
              name="password"
              type="password"
              value={patientForm.password}
              onChange={onPatientFieldChange}
              required
            />
          </label>
          <button type="submit" disabled={busyAction === 'patient'}>
            {busyAction === 'patient' ? 'Creando...' : 'Crear paciente'}
          </button>
        </form>
      )}

      <ul className="patient-list">
        {patients.map((patient) => (
          <li key={patient.id}>
            <button
              className={selectedPatientId === patient.id ? 'patient-item active' : 'patient-item'}
              onClick={() => onSelectPatient(patient.id)}
            >
              <strong>{patient.full_name}</strong>
              <span>{patient.email}</span>
            </button>
          </li>
        ))}
        {patients.length === 0 && <li className="empty">No hay pacientes</li>}
      </ul>
    </aside>
  )
}

export { PatientsPanel }
