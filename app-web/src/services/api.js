const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000'

function normalizeJsonBody(body) {
  if (body == null) {
    return body
  }

  if (typeof body === 'string') {
    try {
      const parsed = JSON.parse(body)
      if (typeof parsed === 'string') {
        try {
          return JSON.stringify(JSON.parse(parsed))
        } catch {
          return JSON.stringify(parsed)
        }
      }
      return JSON.stringify(parsed)
    } catch {
      return body
    }
  }

  return JSON.stringify(body)
}

async function parseError(response) {
  try {
    const payload = await response.json()
    if (typeof payload?.detail === 'string') {
      return payload.detail
    }
    if (Array.isArray(payload?.detail) && payload.detail.length > 0) {
      return payload.detail[0]?.msg ?? 'Request failed'
    }
  } catch {
    // Ignore parser errors and use fallback below.
  }
  return `Request failed with status ${response.status}`
}

async function request(path, options = {}) {
  const { headers: customHeaders = {}, ...restOptions } = options
  const normalizedBody = normalizeJsonBody(options.body)
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...customHeaders,
    },
    ...restOptions,
    body: normalizedBody,
  })

  if (!response.ok) {
    throw new Error(await parseError(response))
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` }
}

async function loginProfessional(payload) {
  return request('/api/v1/auth/login', {
    method: 'POST',
    body: payload,
  })
}

async function getCurrentUser(token) {
  return request('/api/v1/auth/me', {
    headers: authHeaders(token),
  })
}

async function listPatients(token) {
  return request('/api/v1/patients/', {
    headers: authHeaders(token),
  })
}

async function createPatient(token, payload) {
  return request('/api/v1/patients/', {
    method: 'POST',
    headers: authHeaders(token),
    body: payload,
  })
}

async function listTreatments(token, patientId) {
  return request(`/api/v1/treatments/?patient_id=${patientId}`, {
    headers: authHeaders(token),
  })
}

async function createTreatment(token, payload) {
  return request('/api/v1/treatments/', {
    method: 'POST',
    headers: authHeaders(token),
    body: payload,
  })
}

async function updateTreatment(token, treatmentId, payload) {
  return request(`/api/v1/treatments/${treatmentId}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: payload,
  })
}

async function deleteTreatment(token, treatmentId) {
  return request(`/api/v1/treatments/${treatmentId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
}

async function addSchedule(token, treatmentId, payload) {
  return request(`/api/v1/treatments/${treatmentId}/schedules`, {
    method: 'POST',
    headers: authHeaders(token),
    body: payload,
  })
}

async function updateSchedule(token, treatmentId, scheduleId, payload) {
  return request(`/api/v1/treatments/${treatmentId}/schedules/${scheduleId}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: payload,
  })
}

async function deleteSchedule(token, treatmentId, scheduleId) {
  return request(`/api/v1/treatments/${treatmentId}/schedules/${scheduleId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
}

export {
  API_BASE_URL,
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
}
