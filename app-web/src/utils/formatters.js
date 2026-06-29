const WEEKDAY_LABELS = {
  '1': 'Lun',
  '2': 'Mar',
  '3': 'Mie',
  '4': 'Jue',
  '5': 'Vie',
  '6': 'Sab',
  '7': 'Dom',
}

function formatDate(dateValue) {
  if (!dateValue) {
    return '-'
  }

  if (typeof dateValue === 'string') {
    const match = dateValue.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (match) {
      return `${match[3]}/${match[2]}/${match[1]}`
    }
  }

  const parsedDate = new Date(dateValue)
  if (Number.isNaN(parsedDate.getTime())) {
    return String(dateValue)
  }

  return new Intl.DateTimeFormat('es-ES').format(parsedDate)
}

function formatTime(timeValue) {
  if (!timeValue) {
    return '-'
  }

  if (typeof timeValue === 'string') {
    const match = timeValue.match(/^(\d{2}):(\d{2})/)
    if (match) {
      return `${match[1]}:${match[2]}`
    }
  }

  const parsedDate = new Date(`1970-01-01T${timeValue}`)
  if (!Number.isNaN(parsedDate.getTime())) {
    return parsedDate.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  }

  return String(timeValue)
}

function formatWeekdaysCsv(weekdaysCsv) {
  if (!weekdaysCsv) {
    return ''
  }

  return weekdaysCsv
    .split(',')
    .map((value) => value.trim())
    .filter((value) => WEEKDAY_LABELS[value])
    .map((value) => WEEKDAY_LABELS[value])
    .join(', ')
}

function parseWeekdaysCsv(weekdaysCsv) {
  if (!weekdaysCsv) {
    return []
  }

  return weekdaysCsv
    .split(',')
    .map((value) => value.trim())
    .filter((value) => WEEKDAY_LABELS[value])
}

export { formatDate, formatTime, formatWeekdaysCsv, parseWeekdaysCsv }
