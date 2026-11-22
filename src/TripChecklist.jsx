import { useId, useRef, useState } from 'react'
import './trip-checklist.css'

const starterTasks = [
  'Confirm flights or intercity transport',
  'Confirm accommodation and check-in details',
  'Book tickets for planned attractions',
  'Save the itinerary and booking confirmations offline',
  'Check which travel documents to bring',
  'Pack essentials and chargers',
].map((label, index) => ({
  id: 'starter-' + index,
  label,
  done: false,
}))

export default function TripChecklist({ items = starterTasks, onChange }) {
  const titleId = useId()
  const taskInput = useRef(null)
  const [draft, setDraft] = useState('')
  const completed = items.filter((item) => item.done).length
  const label = draft.trim()

  function addTask(event) {
    event.preventDefault()
    if (!label) return

    const id = Array.from(
      crypto.getRandomValues(new Uint32Array(4)),
      (part) => part.toString(16).padStart(8, '0'),
    ).join('')

    onChange([...items, { id, label, done: false }])
    setDraft('')
    taskInput.current?.focus()
  }

  function setDone(id, done) {
    onChange(items.map((item) => item.id === id ? { ...item, done } : item))
  }

  function removeTask(id) {
    onChange(items.filter((item) => item.id !== id))
  }

  return (
    <section className="trip-checklist" aria-labelledby={titleId}>
      <div className="checklist-header">
        <h3 id={titleId}>Trip Checklist</h3>
        <p role="status">{completed} of {items.length} tasks done</p>
      </div>

      {items.length > 0 && (
        <>
          <progress
            aria-label="Trip checklist completion"
            value={completed}
            max={items.length}
          />

          <ul className="checklist-items">
            {items.map((item) => (
              <li key={item.id}>
                <label>
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={(event) => setDone(item.id, event.target.checked)}
                  />
                  <span>{item.label}</span>
                </label>

                <button
                  className="secondary"
                  type="button"
                  aria-label={'Remove task ' + item.label}
                  onClick={() => removeTask(item.id)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      <form className="checklist-form" onSubmit={addTask}>
        <label>
          New task
          <input
            ref={taskInput}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="e.g. Confirm airport pickup"
            maxLength={100}
            required
          />
        </label>

        <button className="button" type="submit" disabled={!label}>
          Add task
        </button>
      </form>
    </section>
  )
}