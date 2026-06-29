import './App.css'
import { ConfirmDialog } from './components/ConfirmDialog'
import { HeaderBar } from './components/HeaderBar'
import { KpiCards } from './components/KpiCards'
import { LoginView } from './components/LoginView'
import { PatientsPanel } from './components/PatientsPanel'
import { TreatmentsPanel } from './components/TreatmentsPanel'
import { usePortalState } from './hooks/usePortalState'

function App() {
  const {
    isAuthenticated,
    authLoading,
    authError,
    user,
    patients,
    patientsLoading,
    selectedPatient,
    selectedPatientId,
    treatments,
    treatmentsLoading,
    busyAction,
    pageMessage,
    confirmDialog,
    loginForm,
    patientForm,
    treatmentForm,
    editingTreatmentId,
    selectedPatientTreatmentCount,
    handlers,
  } = usePortalState()

  if (!isAuthenticated) {
    return (
      <LoginView
        loginForm={loginForm}
        authLoading={authLoading}
        authError={authError}
        onLogin={handlers.handleLogin}
        onLoginFieldChange={handlers.updateLoginField}
      />
    )
  }

  return (
    <main className="portal-shell">
      <HeaderBar userFullName={user.full_name} onLogout={handlers.logout} />

      <KpiCards patientsCount={patients.length} treatmentCount={selectedPatientTreatmentCount} />

      {pageMessage && <div className="toast-message">{pageMessage}</div>}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={handlers.confirmDelete}
        onCancel={handlers.cancelDelete}
      />

      <section className="portal-grid">
        <PatientsPanel
          patients={patients}
          selectedPatientId={selectedPatientId}
          patientsLoading={patientsLoading}
          patientForm={patientForm}
          busyAction={busyAction}
          onRefresh={handlers.handleRefreshPatients}
          onCreatePatient={handlers.handleCreatePatient}
          onPatientFieldChange={handlers.updatePatientField}
          onSelectPatient={handlers.handleSelectPatient}
        />

        <TreatmentsPanel
          selectedPatient={selectedPatient}
          treatmentForm={treatmentForm}
          editingTreatmentId={editingTreatmentId}
          busyAction={busyAction}
          treatments={treatments}
          treatmentsLoading={treatmentsLoading}
          getScheduleForm={handlers.getScheduleForm}
          onTreatmentFieldChange={handlers.updateTreatmentField}
          onCreateTreatment={handlers.handleCreateTreatment}
          onEditTreatment={handlers.handleEditTreatment}
          onCancelTreatmentEdit={handlers.handleCancelTreatmentEdit}
          onDeleteTreatment={handlers.handleDeleteTreatment}
          onScheduleFormChange={handlers.updateScheduleForm}
          onToggleScheduleWeekday={handlers.toggleScheduleWeekday}
          onEditSchedule={handlers.handleEditSchedule}
          onCancelScheduleEdit={handlers.handleCancelScheduleEdit}
          onDeleteSchedule={handlers.handleDeleteSchedule}
          onAddSchedule={handlers.handleAddSchedule}
        />
      </section>
    </main>
  )
}

export default App
