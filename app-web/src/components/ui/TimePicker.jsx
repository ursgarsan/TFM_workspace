import { useEffect, useId, useRef, useState } from 'react'
import { FiCheck, FiClock } from 'react-icons/fi'

const CLOCK_HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
const CLOCK_MINUTES = Array.from({ length: 12 }, (_, index) => index * 5)

function normalizeTime(value) {
  const match = String(value ?? '').match(/^(\d{2}):(\d{2})/)
  return match ? { hour: match[1], minute: match[2] } : { hour: '09', minute: '00' }
}

function positionOnClock(index) {
  const angle = (index * 30 * Math.PI) / 180
  return {
    left: `${50 + Math.sin(angle) * 40}%`,
    top: `${50 - Math.cos(angle) * 40}%`,
  }
}

function TimePicker({ value, onChange, ariaLabel }) {
  const initialTime = normalizeTime(value)
  const [open, setOpen] = useState(false)
  const [placement, setPlacement] = useState('down')
  const [availableHeight, setAvailableHeight] = useState(null)
  const [hour, setHour] = useState(initialTime.hour)
  const [minute, setMinute] = useState(initialTime.minute)
  const [mode, setMode] = useState('hour')
  const containerRef = useRef(null)
  const triggerRef = useRef(null)
  const dialogId = useId()
  const savedTime = normalizeTime(value)
  const hour24 = Number(hour)
  const displayHour = hour24 % 12 || 12
  const period = hour24 >= 12 ? 'PM' : 'AM'
  const handAngle = mode === 'hour' ? (displayHour % 12) * 30 : Number(minute) * 6

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false)
      }
    }
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [])

  const selectHour = (selectedHour) => {
    const nextHour = selectedHour === 12 ? (period === 'AM' ? 0 : 12) : selectedHour + (period === 'PM' ? 12 : 0)
    setHour(String(nextHour).padStart(2, '0'))
    setMode('minute')
  }

  const selectPeriod = (nextPeriod) => {
    const normalizedHour = hour24 % 12 + (nextPeriod === 'PM' ? 12 : 0)
    setHour(String(normalizedHour).padStart(2, '0'))
  }

  const clockValues = mode === 'hour' ? CLOCK_HOURS : CLOCK_MINUTES

  return (
    <div className="custom-picker time-picker" ref={containerRef}>
      <button
        type="button"
        className="picker-trigger"
        ref={triggerRef}
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={dialogId}
        onClick={() => {
          if (!open) {
            const rect = triggerRef.current?.getBoundingClientRect()
            if (rect) {
              const spaceBelow = window.innerHeight - rect.bottom
              const nextPlacement = spaceBelow < 410 && rect.top > spaceBelow ? 'up' : 'down'
              setPlacement(nextPlacement)
              setAvailableHeight(Math.max(180, (nextPlacement === 'up' ? rect.top : spaceBelow) - 16))
            }
            setHour(savedTime.hour)
            setMinute(savedTime.minute)
            setMode('hour')
          }
          setOpen((current) => !current)
        }}
      >
        <span>{savedTime.hour}:{savedTime.minute}</span>
        <FiClock aria-hidden="true" />
      </button>

      {open && (
        <div
          className={`picker-popover time-popover open-${placement}`}
          id={dialogId}
          role="dialog"
          aria-label="Seleccionar hora"
          style={availableHeight ? { maxHeight: `${availableHeight}px` } : undefined}
        >
          <div className="analog-time-header">
            <FiClock aria-hidden="true" />
            <button
              type="button"
              className={mode === 'hour' ? 'time-part active' : 'time-part'}
              onClick={() => setMode('hour')}
              aria-label="Seleccionar horas"
            >
              {String(displayHour).padStart(2, '0')}
            </button>
            <span>:</span>
            <button
              type="button"
              className={mode === 'minute' ? 'time-part active' : 'time-part'}
              onClick={() => setMode('minute')}
              aria-label="Seleccionar minutos"
            >
              {minute}
            </button>
            <div className="period-toggle" aria-label="Periodo horario">
              {['AM', 'PM'].map((option) => (
                <button
                  type="button"
                  key={option}
                  className={period === option ? 'period-option selected' : 'period-option'}
                  aria-pressed={period === option}
                  onClick={() => selectPeriod(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div
            className="analog-clock"
            role="listbox"
            aria-label={mode === 'hour' ? 'Horas' : 'Minutos'}
          >
            <div className="clock-center" />
            <div className="clock-hand" style={{ transform: `rotate(${handAngle}deg)` }} />
            {clockValues.map((option, index) => {
              const selected = mode === 'hour' ? displayHour === option : Number(minute) === option
              const label = mode === 'minute' ? String(option).padStart(2, '0') : String(option)
              return (
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  aria-label={mode === 'hour' ? `${label} horas` : `${label} minutos`}
                  className={selected ? 'clock-number selected' : 'clock-number'}
                  style={positionOnClock(index)}
                  key={option}
                  onClick={() => {
                    if (mode === 'hour') {
                      selectHour(option)
                    } else {
                      setMinute(String(option).padStart(2, '0'))
                    }
                  }}
                >
                  {label}
                </button>
              )
            })}
          </div>

          <p className="clock-help">
            {mode === 'hour' ? 'Seleccione la hora' : 'Seleccione los minutos'}
          </p>
          <button
            type="button"
            className="time-confirm"
            onClick={() => {
              onChange(`${hour}:${minute}`)
              setOpen(false)
            }}
          >
            <FiCheck aria-hidden="true" />
            Aceptar
          </button>
        </div>
      )}
    </div>
  )
}

export { TimePicker }
