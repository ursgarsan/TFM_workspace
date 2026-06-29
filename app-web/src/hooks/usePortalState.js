import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  addSchedule,
  createPatient,
  createTreatment,
  deleteSchedule,
  deleteTreatment,
  getCurrentUser,
  listPatients,
  listTreatments,
  loginProfessional,
  updateTreatment,
  updateSchedule,
} from '../services/api'

const DEFAULT_SCHEDULE_FORM = {
  time_of_day: '09:00',
  frequency: 'daily',
  weekdays_csv: '',
  editing_schedule_id: null,
}

function normalizeTimeForInput(timeValue) {
  if (!timeValue) {
    return '09:00'
  }

  const match = String(timeValue).match(/^(\d{2}):(\d{2})/)
  if (!match) {
    return '09:00'
  }

  return `${match[1]}:${match[2]}`
}

function parseWeekdaysCsv(weekdaysCsv) {
  if (!weekdaysCsv) {
    return []
  }

  return weekdaysCsv
    .split(',')
    .map((value) => value.trim())
    .filter((value) => /^[1-7]$/.test(value))
}

function createDefaultTreatmentForm() {
  return {
    title: '',
    medication_name: '',
    dosage: '',
    notes: '',
    start_date: new Date().toISOString().slice(0, 10),
    end_date: '',
  }
}

function usePortalState() {
  const [token, setToken] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState('')
  const [user, setUser] = useState(null)

  const [patients, setPatients] = useState([])
  const [patientsLoading, setPatientsLoading] = useState(false)
  const [selectedPatientId, setSelectedPatientId] = useState(null)
  const [treatments, setTreatments] = useState([])
  const [treatmentsLoading, setTreatmentsLoading] = useState(false)
  const [busyAction, setBusyAction] = useState('')
  const [pageMessage, setPageMessage] = useState('')
  const [editingTreatmentId, setEditingTreatmentId] = useState(null)
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
  })

  const confirmResolverRef = useRef(null)

  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [patientForm, setPatientForm] = useState({ full_name: '', email: '', password: '' })
  const [treatmentForm, setTreatmentForm] = useState(createDefaultTreatmentForm)
  const [scheduleForms, setScheduleForms] = useState({})

  const selectedPatient = useMemo(
    () => patients.find((patient) => patient.id === selectedPatientId) ?? null,
    [patients, selectedPatientId],
  )

  const selectedPatientTreatmentCount = useMemo(() => treatments.length, [treatments])

  const loadPatients = useCallback(async (sessionToken) => {
    setPatientsLoading(true)
    try {
      const list = await listPatients(sessionToken)
      setPatients(list)
      return list
    } catch (error) {
      setPageMessage(error instanceof Error ? error.message : 'No se pudieron cargar pacientes')
      return []
    } finally {
      setPatientsLoading(false)
    }
  }, [])

  const loadTreatments = useCallback(async (sessionToken, patientId) => {
    if (!patientId) {
      setTreatments([])
      return
    }

    setTreatmentsLoading(true)
    try {
      const list = await listTreatments(sessionToken, patientId)
      setTreatments(list)
    } catch (error) {
      setPageMessage(error instanceof Error ? error.message : 'No se pudieron cargar tratamientos')
    } finally {
      setTreatmentsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!token) {
      return
    }

    let cancelled = false

    async function bootstrap() {
      try {
        const me = await getCurrentUser(token)
        if (cancelled) {
          return
        }
        if (me.role !== 'professional') {
          setAuthError('Este portal es exclusivo para personal sanitario')
          setToken('')
          setUser(null)
          return
        }

        setUser(me)
        const patientList = await loadPatients(token)
        const firstPatientId = patientList[0]?.id ?? null
        setSelectedPatientId(firstPatientId)
        if (firstPatientId) {
          await loadTreatments(token, firstPatientId)
        }
      } catch (error) {
        if (!cancelled) {
          setAuthError(error instanceof Error ? error.message : 'No se pudo iniciar sesion')
          setToken('')
          setUser(null)
        }
      }
    }

    bootstrap()
    return () => {
      cancelled = true
    }
  }, [token, loadPatients, loadTreatments])

  useEffect(() => {
    if (!pageMessage) {
      return
    }

    const timeoutId = setTimeout(() => {
      setPageMessage('')
    }, 2800)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [pageMessage])

  useEffect(
    () => () => {
      if (confirmResolverRef.current) {
        confirmResolverRef.current(false)
        confirmResolverRef.current = null
      }
    },
    [],
  )

  const requestConfirmation = useCallback((message, title = 'Confirmar eliminación') => {
    return new Promise((resolve) => {
      confirmResolverRef.current = resolve
      setConfirmDialog({
        isOpen: true,
        title,
        message,
      })
    })
  }, [])

  const closeConfirmation = useCallback((accepted) => {
    if (confirmResolverRef.current) {
      confirmResolverRef.current(accepted)
      confirmResolverRef.current = null
    }

    setConfirmDialog({
      isOpen: false,
      title: '',
      message: '',
    })
  }, [])

  const updateLoginField = useCallback((event) => {
    const { name, value } = event.target
    setLoginForm((previous) => ({ ...previous, [name]: value }))
  }, [])

  const handleLogin = useCallback(
    async (event) => {
      event.preventDefault()
      setAuthError('')
      setAuthLoading(true)
      try {
        const response = await loginProfessional(loginForm)
        setToken(response.access_token)
        setPageMessage('Sesion iniciada correctamente')
      } catch (error) {
        setAuthError(error instanceof Error ? error.message : 'No se pudo iniciar sesion')
      } finally {
        setAuthLoading(false)
      }
    },
    [loginForm],
  )

  const logout = useCallback(() => {
    setToken('')
    setUser(null)
    setPatients([])
    setTreatments([])
    setSelectedPatientId(null)
    setAuthError('')
    setPageMessage('Sesion cerrada')
  }, [])

  const updatePatientField = useCallback((event) => {
    const { name, value } = event.target
    setPatientForm((previous) => ({ ...previous, [name]: value }))
  }, [])

  const handleCreatePatient = useCallback(
    async (event) => {
      event.preventDefault()
      if (!token) {
        return
      }

      setBusyAction('patient')
      setPageMessage('')
      try {
        const newPatient = await createPatient(token, patientForm)
        setPatients((previous) => [newPatient, ...previous])
        setSelectedPatientId(newPatient.id)
        await loadTreatments(token, newPatient.id)
        setPatientForm({ full_name: '', email: '', password: '' })
        setPageMessage('Paciente creado')
      } catch (error) {
        setPageMessage(error instanceof Error ? error.message : 'No se pudo crear paciente')
      } finally {
        setBusyAction('')
      }
    },
    [token, patientForm, loadTreatments],
  )

  const updateTreatmentField = useCallback((event) => {
    const { name, value } = event.target
    setTreatmentForm((previous) => ({ ...previous, [name]: value }))
  }, [])

  const handleCreateTreatment = useCallback(
    async (event) => {
      event.preventDefault()
      if (!token || !selectedPatientId) {
        return
      }

      setBusyAction('treatment')
      setPageMessage('')
      try {
        if (editingTreatmentId) {
          const payload = {
            title: treatmentForm.title,
            medication_name: treatmentForm.medication_name,
            dosage: treatmentForm.dosage,
            notes: treatmentForm.notes || null,
            start_date: treatmentForm.start_date,
            end_date: treatmentForm.end_date || null,
          }
          const updated = await updateTreatment(token, editingTreatmentId, payload)
          setTreatments((previous) =>
            previous.map((treatment) => (treatment.id === editingTreatmentId ? updated : treatment)),
          )
          setPageMessage('Tratamiento actualizado')
        } else {
          const payload = {
            ...treatmentForm,
            patient_id: selectedPatientId,
            end_date: treatmentForm.end_date || null,
            notes: treatmentForm.notes || null,
          }
          const created = await createTreatment(token, payload)
          setTreatments((previous) => [created, ...previous])
          setPageMessage('Tratamiento creado')
        }

        setTreatmentForm(createDefaultTreatmentForm())
        setEditingTreatmentId(null)
      } catch (error) {
        setPageMessage(error instanceof Error ? error.message : 'No se pudo guardar tratamiento')
      } finally {
        setBusyAction('')
      }
    },
    [token, selectedPatientId, treatmentForm, editingTreatmentId],
  )

  const handleEditTreatment = useCallback((treatment) => {
    setEditingTreatmentId(treatment.id)
    setTreatmentForm({
      title: treatment.title,
      medication_name: treatment.medication_name,
      dosage: treatment.dosage,
      notes: treatment.notes || '',
      start_date: treatment.start_date,
      end_date: treatment.end_date || '',
    })
  }, [])

  const handleCancelTreatmentEdit = useCallback(() => {
    setEditingTreatmentId(null)
    setTreatmentForm(createDefaultTreatmentForm())
  }, [])

  const getScheduleForm = useCallback(
    (treatmentId) =>
      scheduleForms[treatmentId] ?? DEFAULT_SCHEDULE_FORM,
    [scheduleForms],
  )

  const updateScheduleForm = useCallback(
    (treatmentId, field, value) => {
      setScheduleForms((previous) => ({
        ...previous,
        [treatmentId]: {
          ...(previous[treatmentId] ?? DEFAULT_SCHEDULE_FORM),
          [field]: value,
        },
      }))
    },
    [],
  )

  const toggleScheduleWeekday = useCallback((treatmentId, dayNumber) => {
    const dayToken = String(dayNumber)

    setScheduleForms((previous) => {
      const current = previous[treatmentId] ?? DEFAULT_SCHEDULE_FORM
      const selectedDays = parseWeekdaysCsv(current.weekdays_csv)
      const hasDay = selectedDays.includes(dayToken)
      const nextDays = hasDay
        ? selectedDays.filter((day) => day !== dayToken)
        : [...selectedDays, dayToken]

      nextDays.sort((a, b) => Number(a) - Number(b))

      return {
        ...previous,
        [treatmentId]: {
          ...current,
          weekdays_csv: nextDays.join(','),
        },
      }
    })
  }, [])

  const handleAddSchedule = useCallback(
    async (event, treatmentId) => {
      event.preventDefault()
      if (!token) {
        return
      }

      const form = getScheduleForm(treatmentId)
      setBusyAction(`schedule-${treatmentId}`)
      setPageMessage('')

      try {
        const normalizedFrequency = form.frequency.trim().toLowerCase() || 'daily'
        const usesWeekdays = normalizedFrequency === 'weekdays'
        const payload = {
          time_of_day: form.time_of_day,
          frequency: normalizedFrequency,
          weekdays_csv: usesWeekdays ? form.weekdays_csv || null : null,
        }

        if (form.editing_schedule_id) {
          const updated = await updateSchedule(token, treatmentId, form.editing_schedule_id, payload)

          setTreatments((previous) =>
            previous.map((treatment) =>
              treatment.id === treatmentId
                ? {
                    ...treatment,
                    schedules: treatment.schedules.map((schedule) =>
                      schedule.id === form.editing_schedule_id ? updated : schedule,
                    ),
                  }
                : treatment,
            ),
          )

          setPageMessage('Horario actualizado')
        } else {
          const created = await addSchedule(token, treatmentId, payload)

          setTreatments((previous) =>
            previous.map((treatment) =>
              treatment.id === treatmentId
                ? { ...treatment, schedules: [...treatment.schedules, created] }
                : treatment,
            ),
          )

          setPageMessage('Horario añadido')
        }

        setScheduleForms((previous) => ({
          ...previous,
          [treatmentId]: DEFAULT_SCHEDULE_FORM,
        }))
      } catch (error) {
        setPageMessage(error instanceof Error ? error.message : 'No se pudo guardar horario')
      } finally {
        setBusyAction('')
      }
    },
    [token, getScheduleForm],
  )

  const handleEditSchedule = useCallback((treatmentId, schedule) => {
    setScheduleForms((previous) => ({
      ...previous,
      [treatmentId]: {
        time_of_day: normalizeTimeForInput(schedule.time_of_day),
        frequency: schedule.frequency,
        weekdays_csv: schedule.weekdays_csv || '',
        editing_schedule_id: schedule.id,
      },
    }))
  }, [])

  const handleCancelScheduleEdit = useCallback((treatmentId) => {
    setScheduleForms((previous) => ({
      ...previous,
      [treatmentId]: DEFAULT_SCHEDULE_FORM,
    }))
  }, [])

  const handleDeleteSchedule = useCallback(
    async (treatmentId, scheduleId) => {
      if (!token) {
        return
      }

      const confirmed = await requestConfirmation('¿Seguro que quieres eliminar este horario?')
      if (!confirmed) {
        return
      }

      setBusyAction(`delete-schedule-${scheduleId}`)
      setPageMessage('')

      try {
        await deleteSchedule(token, treatmentId, scheduleId)
        setTreatments((previous) =>
          previous.map((treatment) =>
            treatment.id === treatmentId
              ? {
                  ...treatment,
                  schedules: treatment.schedules.filter((schedule) => schedule.id !== scheduleId),
                }
              : treatment,
          ),
        )

        setScheduleForms((previous) => {
          const current = previous[treatmentId]
          if (!current || current.editing_schedule_id !== scheduleId) {
            return previous
          }

          return {
            ...previous,
            [treatmentId]: DEFAULT_SCHEDULE_FORM,
          }
        })
        setPageMessage('Horario eliminado')
      } catch (error) {
        setPageMessage(error instanceof Error ? error.message : 'No se pudo eliminar horario')
      } finally {
        setBusyAction('')
      }
    },
    [token, requestConfirmation],
  )

  const handleDeleteTreatment = useCallback(
    async (treatmentId) => {
      if (!token) {
        return
      }

      const confirmed = await requestConfirmation('¿Seguro que quieres eliminar este tratamiento?')
      if (!confirmed) {
        return
      }

      setBusyAction(`delete-${treatmentId}`)
      setPageMessage('')
      try {
        await deleteTreatment(token, treatmentId)
        setTreatments((previous) => previous.filter((treatment) => treatment.id !== treatmentId))
        setPageMessage('Tratamiento eliminado')
      } catch (error) {
        setPageMessage(error instanceof Error ? error.message : 'No se pudo eliminar tratamiento')
      } finally {
        setBusyAction('')
      }
    },
    [token, requestConfirmation],
  )

  const handleSelectPatient = useCallback(
    (patientId) => {
      setSelectedPatientId(patientId)
      if (token) {
        loadTreatments(token, patientId)
      }
    },
    [token, loadTreatments],
  )

  const handleRefreshPatients = useCallback(async () => {
    if (!token) {
      return
    }

    const list = await loadPatients(token)
    if (list.length === 0) {
      setSelectedPatientId(null)
      setTreatments([])
      return
    }

    const nextPatientId = list.some((patient) => patient.id === selectedPatientId)
      ? selectedPatientId
      : list[0].id
    setSelectedPatientId(nextPatientId)
    await loadTreatments(token, nextPatientId)
  }, [token, loadPatients, loadTreatments, selectedPatientId])

  const confirmDelete = useCallback(() => {
    closeConfirmation(true)
  }, [closeConfirmation])

  const cancelDelete = useCallback(() => {
    closeConfirmation(false)
  }, [closeConfirmation])

  return {
    isAuthenticated: Boolean(token && user),
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
    APIState: {
      token,
    },
    handlers: {
      updateLoginField,
      handleLogin,
      logout,
      updatePatientField,
      handleCreatePatient,
      updateTreatmentField,
      handleCreateTreatment,
      handleEditTreatment,
      handleCancelTreatmentEdit,
      getScheduleForm,
      updateScheduleForm,
      toggleScheduleWeekday,
      handleAddSchedule,
      handleEditSchedule,
      handleCancelScheduleEdit,
      handleDeleteSchedule,
      handleDeleteTreatment,
      handleSelectPatient,
      handleRefreshPatients,
      confirmDelete,
      cancelDelete,
    },
  }
}

export { usePortalState }
