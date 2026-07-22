import { useEffect, useId, useRef, useState } from 'react'
import { FiCheck, FiChevronDown } from 'react-icons/fi'

function CustomMultiSelect({ values, options, onToggle, ariaLabel, placeholder = 'Seleccionar' }) {
  const [open, setOpen] = useState(false)
  const [placement, setPlacement] = useState('down')
  const containerRef = useRef(null)
  const triggerRef = useRef(null)
  const listboxId = useId()
  const selectedOptions = options.filter((option) => values.includes(option.value))
  const summary = selectedOptions.length === 0
    ? placeholder
    : selectedOptions.length === options.length
      ? 'Todos los días'
      : selectedOptions.map((option) => option.label).join(', ')

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

  return (
    <div className="custom-picker multi-select" ref={containerRef}>
      <button
        type="button"
        className="picker-trigger"
        ref={triggerRef}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => {
          if (!open) {
            const rect = triggerRef.current?.getBoundingClientRect()
            if (rect) {
              const spaceBelow = window.innerHeight - rect.bottom
              setPlacement(spaceBelow < 330 && rect.top > spaceBelow ? 'up' : 'down')
            }
          }
          setOpen((current) => !current)
        }}
      >
        <span className={selectedOptions.length === 0 ? 'picker-placeholder' : ''}>{summary}</span>
        <FiChevronDown aria-hidden="true" className={open ? 'picker-chevron open' : 'picker-chevron'} />
      </button>

      {open && (
        <div
          className={`picker-popover multi-select-popover open-${placement}`}
          id={listboxId}
          role="listbox"
          aria-label={ariaLabel}
          aria-multiselectable="true"
        >
          {options.map((option) => {
            const selected = values.includes(option.value)
            return (
              <button
                type="button"
                role="option"
                aria-selected={selected}
                className={selected ? 'multi-select-option selected' : 'multi-select-option'}
                key={option.value}
                onClick={() => onToggle(option.value)}
              >
                <span className="multi-check" aria-hidden="true">
                  {selected ? <FiCheck /> : null}
                </span>
                <span>{option.label}</span>
              </button>
            )
          })}
          <button type="button" className="multi-select-done" onClick={() => setOpen(false)}>
            Aceptar
          </button>
        </div>
      )}
    </div>
  )
}

export { CustomMultiSelect }
