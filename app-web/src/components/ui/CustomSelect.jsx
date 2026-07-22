import { useEffect, useId, useRef, useState } from 'react'
import { FiCheck, FiChevronDown } from 'react-icons/fi'

function CustomSelect({ value, options, onChange, ariaLabel }) {
  const [open, setOpen] = useState(false)
  const [placement, setPlacement] = useState('down')
  const containerRef = useRef(null)
  const triggerRef = useRef(null)
  const listboxId = useId()
  const selectedOption = options.find((option) => option.value === value) ?? options[0]

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
    <div className="custom-picker" ref={containerRef}>
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
              setPlacement(spaceBelow < 150 && rect.top > spaceBelow ? 'up' : 'down')
            }
          }
          setOpen((current) => !current)
        }}
      >
        <span>{selectedOption?.label}</span>
        <FiChevronDown aria-hidden="true" className={open ? 'picker-chevron open' : 'picker-chevron'} />
      </button>

      {open && (
        <div
          className={`picker-popover select-popover open-${placement}`}
          id={listboxId}
          role="listbox"
          aria-label={ariaLabel}
        >
          {options.map((option) => {
            const selected = option.value === value
            return (
              <button
                type="button"
                role="option"
                aria-selected={selected}
                className={selected ? 'picker-option selected' : 'picker-option'}
                key={option.value}
                onClick={() => {
                  onChange(option.value)
                  setOpen(false)
                }}
              >
                <span>{option.label}</span>
                {selected ? <FiCheck aria-hidden="true" /> : null}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export { CustomSelect }
