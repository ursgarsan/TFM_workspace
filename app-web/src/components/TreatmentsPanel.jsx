import { useState } from 'react'
import { FiEdit2, FiPlus, FiTrash2, FiX } from 'react-icons/fi'
import { formatDate, formatTime, formatWeekdaysCsv, parseWeekdaysCsv } from '../utils/formatters'
import { CustomSelect } from './ui/CustomSelect'
import { CustomMultiSelect } from './ui/CustomMultiSelect'
import { TimePicker } from './ui/TimePicker'

const WEEKDAY_OPTIONS = [
  { value: '1', label: 'Lun' },
  { value: '2', label: 'Mar' },
  { value: '3', label: 'Mié' },
  { value: '4', label: 'Jue' },
  { value: '5', label: 'Vie' },
  { value: '6', label: 'Sáb' },
  { value: '7', label: 'Dom' },
]

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Diaria' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'weekdays', label: 'Personalizar' },
]

function translateFrequency(value) {
  const normalized = value?.trim().toLowerCase()
  const option = FREQUENCY_OPTIONS.find((item) => item.value === normalized)
  return option ? option.label : value
}

function TreatmentsPanel({
  selectedPatient,
  treatmentForm,
  editingTreatmentId,
  busyAction,
  treatments,
  treatmentsLoading,
  getScheduleForm,
  onTreatmentFieldChange,
  onCreateTreatment,
  onEditTreatment,
  onCancelTreatmentEdit,
  onDeleteTreatment,
  onScheduleFormChange,
  onToggleScheduleWeekday,
  onEditSchedule,
  onCancelScheduleEdit,
  onDeleteSchedule,
  onAddSchedule,
}) {
  const [showCreateTreatmentForm, setShowCreateTreatmentForm] = useState(false)
  const [visibleScheduleForms, setVisibleScheduleForms] = useState({})

  const toggleScheduleForm = (treatmentId) => {
    setVisibleScheduleForms((previous) => ({
      ...previous,
      [treatmentId]: !previous[treatmentId],
    }))
  }

  const closeScheduleForm = (treatmentId) => {
    setVisibleScheduleForms((previous) => ({
      ...previous,
      [treatmentId]: false,
    }))
  }

  const handleCreateTreatment = async (event) => {
    await onCreateTreatment(event)
    setShowCreateTreatmentForm(false)
  }

  const handleEditTreatment = (treatment) => {
    onEditTreatment(treatment)
    setShowCreateTreatmentForm(true)
  }

  const handleCancelTreatmentEdit = () => {
    onCancelTreatmentEdit()
    setShowCreateTreatmentForm(false)
  }

  const handleTreatmentFormToggle = () => {
    if (showCreateTreatmentForm && editingTreatmentId) {
      handleCancelTreatmentEdit()
      return
    }

    setShowCreateTreatmentForm((previous) => !previous)
  }

  const handleAddSchedule = async (event, treatmentId) => {
    await onAddSchedule(event, treatmentId)
    closeScheduleForm(treatmentId)
  }

  const handleEditSchedule = (treatmentId, schedule) => {
    setVisibleScheduleForms((previous) => ({
      ...previous,
      [treatmentId]: true,
    }))
    onEditSchedule(treatmentId, schedule)
  }

  const handleCancelScheduleEdit = (treatmentId) => {
    onCancelScheduleEdit(treatmentId)
    closeScheduleForm(treatmentId)
  }

  return (
    <section className="panel treatments-panel">
      <div className="panel-head">
        <h2>Tratamientos</h2>
        <div className="panel-actions">
          <p>{selectedPatient ? `Paciente: ${selectedPatient.full_name}` : 'Selecciona un paciente'}</p>
          {selectedPatient && (
            <button
              type="button"
              className="icon-button create-toggle-button"
              onClick={handleTreatmentFormToggle}
              aria-label={showCreateTreatmentForm ? 'Cerrar formulario de tratamiento' : 'Crear tratamiento'}
              title={showCreateTreatmentForm ? 'Cerrar formulario de tratamiento' : 'Crear tratamiento'}
            >
              {showCreateTreatmentForm ? (
                <FiX size={21} aria-hidden="true" focusable="false" />
              ) : (
                <FiPlus size={21} aria-hidden="true" focusable="false" />
              )}
            </button>
          )}
        </div>
      </div>

      {selectedPatient && showCreateTreatmentForm && (
        <form className="form-grid" onSubmit={handleCreateTreatment}>
          <label>
            <span className="label-with-required">
              Titulo clínico <span className="required-mark">*</span>
            </span>
            <input name="title" value={treatmentForm.title} onChange={onTreatmentFieldChange} required />
          </label>
          <label>
            <span className="label-with-required">
              Medicamento <span className="required-mark">*</span>
            </span>
            <input
              name="medication_name"
              value={treatmentForm.medication_name}
              onChange={onTreatmentFieldChange}
              required
            />
          </label>
          <label>
            <span className="label-with-required">
              Dosis <span className="required-mark">*</span>
            </span>
            <input name="dosage" value={treatmentForm.dosage} onChange={onTreatmentFieldChange} required />
          </label>
          <label>
            <span className="label-with-required">
              Inicio <span className="required-mark">*</span>
            </span>
            <input
              name="start_date"
              type="date"
              value={treatmentForm.start_date}
              onChange={onTreatmentFieldChange}
              required
            />
          </label>
          <label>
            Fin (opcional)
            <input name="end_date" type="date" value={treatmentForm.end_date} onChange={onTreatmentFieldChange} />
          </label>
          <label className="full-row">
            Notas
            <textarea name="notes" value={treatmentForm.notes} onChange={onTreatmentFieldChange} rows={2} />
          </label>
          <button className="treatment-submit-button" type="submit" disabled={busyAction === 'treatment'}>
            {busyAction === 'treatment'
              ? 'Guardando...'
              : editingTreatmentId
                ? 'Guardar'
                : 'Crear tratamiento'}
          </button>
        </form>
      )}

      <div className="treatment-list">
        {treatmentsLoading && <p className="loading">Cargando tratamientos...</p>}
        {!treatmentsLoading && treatments.length === 0 && (
          <p className="empty">No hay tratamientos para este paciente</p>
        )}

        {treatments.map((treatment) => {
          const scheduleForm = getScheduleForm(treatment.id)
          const selectedWeekdays = parseWeekdaysCsv(scheduleForm.weekdays_csv)
          const isWeekdaysSchedule = scheduleForm.frequency.trim().toLowerCase() === 'weekdays'
          const isEditingSchedule = Boolean(scheduleForm.editing_schedule_id)
          const isScheduleFormVisible = Boolean(visibleScheduleForms[treatment.id] || isEditingSchedule)

              const scheduleToggleLabel = isScheduleFormVisible ? 'Cancelar' : 'Añadir horario'

              const handleScheduleToggle = isEditingSchedule
                ? () => handleCancelScheduleEdit(treatment.id)
                : () => toggleScheduleForm(treatment.id)

          return (
            <article key={treatment.id} className="treatment-card">
              <div className="treatment-head">
                <div>
                  <h3>{treatment.title}</h3>
                  <p>
                    {treatment.medication_name} · {treatment.dosage}
                  </p>
                </div>
                <div className="treatment-actions">
                  <button
                    type="button"
                    className="icon-button edit-icon"
                    onClick={() => handleEditTreatment(treatment)}
                    aria-label="Editar tratamiento"
                    title="Editar tratamiento"
                  >
                    <FiEdit2 size={16} aria-hidden="true" focusable="false" />
                  </button>
                  <button
                    type="button"
                    className="icon-button danger-icon"
                    onClick={() => onDeleteTreatment(treatment.id)}
                    disabled={busyAction === `delete-${treatment.id}`}
                    aria-label="Eliminar tratamiento"
                    title="Eliminar tratamiento"
                  >
                    <FiTrash2 size={16} aria-hidden="true" focusable="false" />
                  </button>
                </div>
              </div>

              <p className="meta">
                Inicio: {formatDate(treatment.start_date)}
                {treatment.end_date ? ` · Fin: ${formatDate(treatment.end_date)}` : ''}
              </p>
              {treatment.notes && <p className="meta">Notas: {treatment.notes}</p>}

              <ul className="schedule-list">
                {treatment.schedules.map((schedule) => (
                  <li key={schedule.id}>
                    <span>
                      {formatTime(schedule.time_of_day)} · {translateFrequency(schedule.frequency)}
                      {schedule.weekdays_csv ? ` (${formatWeekdaysCsv(schedule.weekdays_csv)})` : ''}
                    </span>
                    <span className="schedule-actions">
                      <button
                        type="button"
                        className="icon-button edit-icon"
                        onClick={() => handleEditSchedule(treatment.id, schedule)}
                        aria-label="Editar horario"
                        title="Editar horario"
                      >
                        <FiEdit2 size={14} aria-hidden="true" focusable="false" />
                      </button>
                      <button
                        type="button"
                        className="icon-button danger-icon"
                        onClick={() => onDeleteSchedule(treatment.id, schedule.id)}
                        disabled={busyAction === `delete-schedule-${schedule.id}`}
                        aria-label="Eliminar horario"
                        title="Eliminar horario"
                      >
                        <FiTrash2 size={14} aria-hidden="true" focusable="false" />
                      </button>
                    </span>
                  </li>
                ))}
                {treatment.schedules.length === 0 && <li>Sin horarios configurados</li>}
              </ul>

              <div className="schedule-form-wrapper">
                <button type="button" className="ghost" onClick={handleScheduleToggle}>
                  {scheduleToggleLabel}
                </button>

                {isScheduleFormVisible && (
                  <form className="schedule-form" onSubmit={(event) => handleAddSchedule(event, treatment.id)}>
                    <label className="schedule-field">
                      <span className="label-with-required">
                        Hora <span className="required-mark">*</span>
                      </span>
                      <TimePicker
                        value={scheduleForm.time_of_day}
                        ariaLabel="Hora del tratamiento"
                        onChange={(value) => onScheduleFormChange(treatment.id, 'time_of_day', value)}
                      />
                    </label>
                    <label className="schedule-field">
                      <span className="label-with-required">
                        Frecuencia <span className="required-mark">*</span>
                      </span>
                      <CustomSelect
                        value={scheduleForm.frequency}
                        options={FREQUENCY_OPTIONS}
                        ariaLabel="Frecuencia del tratamiento"
                        onChange={(value) => onScheduleFormChange(treatment.id, 'frequency', value)}
                      />
                    </label>
                    {isWeekdaysSchedule && (
                      <div className="weekday-picker">
                        <p className="weekday-label">
                          Días <span className="required-mark">*</span>
                        </p>
                        <CustomMultiSelect
                          values={selectedWeekdays}
                          options={WEEKDAY_OPTIONS}
                          placeholder="Seleccione los días"
                          ariaLabel="Días de la semana"
                          onToggle={(dayValue) => onToggleScheduleWeekday(treatment.id, dayValue)}
                        />
                      </div>
                    )}
                    <button type="submit" disabled={busyAction === `schedule-${treatment.id}`}>
                      {busyAction === `schedule-${treatment.id}`
                        ? isEditingSchedule
                          ? 'Guardando...'
                          : 'Añadiendo...'
                        : isEditingSchedule
                          ? 'Guardar'
                          : 'Guardar'}
                    </button>
                  </form>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

export { TreatmentsPanel }
