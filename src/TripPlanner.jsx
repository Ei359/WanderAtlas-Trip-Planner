import { useState } from 'react'
import CityBudget from './CityBudget.jsx'
import TripChecklist from './TripChecklist.jsx'
import { cityPackages } from './packageData.js'
import { sampleTrip } from './sampleTrip.js'
import {
  buildTimeline,
  convertActivityCost,
  costTotal,
  currencies,
  currencyStep,
  formatActivityCost,
  formatDate,
  formatMoney,
  fromMinor,
  printItinerary,
  stepDay,
  toMinor,
} from './tripTools.js'
import './trip-planner.css'

const storageKey = 'wanderatlas-trips-v3'
const cities = Object.keys(cityPackages)
const cityKey = (name) => name.trim().toLowerCase()

function viewItinerary() {
  const itinerary = document.getElementById('itinerary')
  itinerary?.focus({ preventScroll: true })
  itinerary?.scrollIntoView({ block: 'start' })
}

function readStored(key) {
  try {
    return JSON.parse(localStorage.getItem(key))
  } catch {
    return null
  }
}

function readTrips() {
  const current = readStored(storageKey)
  if (Array.isArray(current?.trips)) return current

  const previous = readStored('wanderatlas-trips-v2')

  if (Array.isArray(previous?.trips)) {
    const trips = previous.trips.map((trip, index) => ({
      ...trip,
      id: 'legacy-' + index,
    }))

    const active = previous.active ?? ''
    const selected = trips.find(
      (trip) => cityKey(trip.destination) === cityKey(active),
    )

    return { activeId: selected?.id ?? trips.at(-1)?.id ?? null, trips }
  }

  const single = readStored('wanderatlas-trip')

  if (typeof single?.destination === 'string' && Array.isArray(single.activities)) {
    const currency = Object.hasOwn(currencies, single.currency) ? single.currency : 'USD'

    return {
      activeId: 'legacy-0',
      trips: [{ ...single, currency, id: 'legacy-0' }],
    }
  }

  return { activeId: null, trips: [] }
}

function createTripId() {
  return Array.from(
    crypto.getRandomValues(new Uint32Array(4)),
    (part) => part.toString(16).padStart(8, '0'),
  ).join('')
}

function tripName(trip) {
  return trip.title || trip.destination + ' trip'
}

function tripCosts(trip) {
  const activities = trip.activities.filter(
    ({ date }) => date >= trip.startDate && date <= trip.endDate,
  )
  const extraCost = costTotal(activities)

  return {
    activities,
    extraCost,
    total: trip.plan ? trip.budget + extraCost : extraCost,
    pending: activities.filter(({ cost }) => cost == null).length,
  }
}

export default function TripPlanner({
  isSample = false,
  destinationInput,
  selectedDestination,
  onDestinationChange,
}) {
  if (isSample) return <SampleItinerary />

  return (
    <PersonalPlanner
      destinationInput={destinationInput}
      selectedDestination={selectedDestination}
      onDestinationChange={onDestinationChange}
    />
  )
}

function SampleItinerary() {
  const [trip, setTrip] = useState(sampleTrip)
  return <Itinerary trip={trip} onChange={setTrip} isSample />
}

function PersonalPlanner({ destinationInput, selectedDestination, onDestinationChange }) {
  const [library, setLibrary] = useState(readTrips)
  const [notice, setNotice] = useState('')
  const [draftCity, setDraftCity] = useState(null)

  const activeTrip = library.trips.find(({ id }) => id === library.activeId)
  const key = cityKey(selectedDestination ?? activeTrip?.destination ?? '')
  const city = cities.find((name) => cityKey(name) === key)

  const matchingTrip = cityKey(activeTrip?.destination ?? '') === key
    ? activeTrip
    : library.trips.findLast(({ destination }) => cityKey(destination) === key)

  const trip = draftCity === key ? undefined : matchingTrip
  const destination = city ?? trip?.destination ?? ''
  const editorKey = trip?.id ?? key

  function chooseCity(value) {
    setDraftCity(null)
    setNotice('')
    onDestinationChange(value)
  }

  function startNewTrip() {
    setDraftCity(key)
    setNotice('')
  }

  function writeLibrary(next, message) {
    setLibrary(next)

    try {
      localStorage.setItem(storageKey, JSON.stringify(next))
      setNotice(message)
    } catch {
      setNotice('Browser storage is unavailable. Changes are available in this tab until you leave the planner.')
    }
  }

  function openTrip(savedTrip) {
    setDraftCity(null)
    writeLibrary({ ...library, activeId: savedTrip.id }, '')

    if (cityKey(savedTrip.destination) !== key) {
      onDestinationChange(savedTrip.destination)
    }
  }

  function saveTrip(next, message = 'Trip updated in this browser.') {
    const existing = library.trips.some(({ id }) => id === next.id)
    const trips = existing
      ? library.trips.map((saved) => saved.id === next.id ? next : saved)
      : [...library.trips, next]

    writeLibrary({ activeId: next.id, trips }, message)
  }

  function savePackage(details, rate) {
    if (!Number.isFinite(rate) || rate <= 0) {
      return 'Enter an exchange rate greater than zero.'
    }

    const activities = trip?.activities.map((activity) =>
      convertActivityCost(activity, trip.currency, details.currency, rate),
    ) ?? []

    let budgetLimit = trip?.budgetLimit ?? null

    if (budgetLimit !== null && trip.currency !== details.currency) {
      budgetLimit = toMinor(fromMinor(budgetLimit, trip.currency) * rate, details.currency)
    }

    if (
      !Number.isSafeInteger(costTotal(activities) + details.budget) ||
      (budgetLimit !== null && !Number.isSafeInteger(budgetLimit))
    ) {
      return 'Check the exchange rate. The converted amount is too large.'
    }

    saveTrip(
      {
        ...trip,
        ...details,
        id: trip?.id ?? createTripId(),
        activities,
        budgetLimit,
      },
      trip ? 'Trip updated in this browser.' : 'New trip saved in this browser.',
    )

    setDraftCity(null)
    return ''
  }

  return (
    <section id="planner" aria-label="Trip planner">
      <div className="panel package-destinations">
        <label>
          Destination
          <select
            ref={destinationInput}
            value={destination}
            onChange={(event) => chooseCity(event.target.value)}
          >
            <option value="">Choose a destination</option>
            {cities.map((name) => <option key={name} value={name}>{name}</option>)}
            {trip && !city && <option value={trip.destination}>{trip.destination}</option>}
          </select>
        </label>
      </div>

      <MyTrips
        trips={library.trips}
        selectedId={trip?.id}
        onOpen={openTrip}
        onNew={trip && city ? startNewTrip : undefined}
      />

      {trip && (
        <SavedTripOverview
          key={'overview-' + editorKey + '-' + trip.currency}
          trip={trip}
          onSave={saveTrip}
        />
      )}

      {city ? (
        <CityBudget
          key={'builder-' + editorKey}
          destination={city}
          trip={trip}
          onSave={savePackage}
          submitLabel={trip ? 'Update trip' : 'Save as new trip'}
        />
      ) : (
        !trip && <p className="panel">Choose a destination to start planning.</p>
      )}

      {notice && (
        <div className="package-save-status planner-save">
          <p role="status">{notice}</p>
          {trip && (
            <button className="secondary" type="button" onClick={viewItinerary}>
              View itinerary & checklist
            </button>
          )}
        </div>
      )}

      {trip && (
        <Itinerary key={'itinerary-' + editorKey} trip={trip} onChange={saveTrip} />
      )}
    </section>
  )
}

function MyTrips({ trips, selectedId, onOpen, onNew }) {
  return (
    <section className="panel trip-overview" aria-labelledby="my-trips-heading">
      <div className="section-heading">
        <h2 id="my-trips-heading">My Trips</h2>

        {onNew && (
          <button className="secondary" type="button" onClick={onNew}>
            New trip
          </button>
        )}
      </div>

      {trips.length ? (
        <ul className="timeline">
          {trips.map((trip) => {
            const { total, pending } = tripCosts(trip)
            const selected = trip.id === selectedId

            return (
              <li key={trip.id}>
                <div>
                  <h3>{tripName(trip)}</h3>
                  <p>{trip.destination} · {formatDate(trip.startDate)} – {formatDate(trip.endDate)}</p>
                  <p>
                    {pending ? 'Known total' : trip.plan ? 'Estimated total' : 'Planned spending'}{' '}
                    <strong>{formatMoney(total, trip.currency)}</strong>
                  </p>
                </div>

                {selected ? (
                  <span className="package-note">Currently open</span>
                ) : (
                  <button
                    className="secondary"
                    type="button"
                    aria-label={'Open ' + tripName(trip) + ', ' + formatDate(trip.startDate)}
                    onClick={() => onOpen(trip)}
                  >
                    Open trip
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      ) : (
        <p>Your saved trips will appear here.</p>
      )}
    </section>
  )
}

function SavedTripOverview({ trip, onSave }) {
  const [title, setTitle] = useState(trip.title ?? '')
  const [notes, setNotes] = useState(trip.notes ?? '')
  const [limit, setLimit] = useState(() =>
    trip.budgetLimit == null ? '' : String(fromMinor(trip.budgetLimit, trip.currency)),
  )
  const [error, setError] = useState('')

  const travelers = trip.travelers ?? 1
  const nextLimit = limit === '' ? null : toMinor(limit, trip.currency)
  const hasChanges = title.trim() !== (trip.title ?? '') ||
    notes.trim() !== (trip.notes ?? '') ||
    nextLimit !== (trip.budgetLimit ?? null)

  const { total, pending } = tripCosts(trip)
  const difference = trip.budgetLimit == null ? null : trip.budgetLimit - total

  function saveDetails(event) {
    event.preventDefault()

    if (nextLimit !== null && (!Number.isSafeInteger(nextLimit) || nextLimit < 0)) {
      setError('Enter a valid budget limit.')
      return
    }

    setError('')
    onSave({ ...trip, title: title.trim(), notes: notes.trim(), budgetLimit: nextLimit })
  }

  return (
    <section className="panel trip-overview" aria-labelledby="saved-trip-heading">
      <div className="section-heading">
        <div>
          <h2 id="saved-trip-heading">{tripName(trip)}</h2>
          <p>{trip.destination} · {travelers} {travelers === 1 ? 'traveler' : 'travelers'}</p>
          <p>{formatDate(trip.startDate)} – {formatDate(trip.endDate)}</p>
        </div>

        <button className="secondary" type="button" onClick={viewItinerary}>
          View itinerary & checklist
        </button>
      </div>

      {difference !== null && (
        <div className="package-saved" aria-label="Budget comparison">
          <div>Budget limit <strong>{formatMoney(trip.budgetLimit, trip.currency)}</strong></div>
          <div>
            {pending ? 'Known total' : 'Planned total'}{' '}
            <strong>{formatMoney(total, trip.currency)}</strong>
          </div>
          <div>
            {difference < 0 ? 'Over limit by' : 'Budget remaining'}{' '}
            <strong className={difference < 0 ? 'warning' : undefined}>
              {formatMoney(Math.abs(difference), trip.currency)}
            </strong>
          </div>
          {pending > 0 && <p className="package-note">Activities with pending prices are excluded.</p>}
        </div>
      )}

      <form onSubmit={saveDetails}>
        <label>
          Trip name
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={trip.destination + ' trip'}
            maxLength={80}
          />
        </label>

        <label>
          Trip notes
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="e.g. Hotel check-in at 3 pm"
            rows={3}
            maxLength={600}
          />
        </label>

        <label>
          Budget limit ({trip.currency}, optional)
          <input
            type="number"
            min="0"
            step={currencyStep(trip.currency)}
            value={limit}
            onChange={(event) => setLimit(event.target.value)}
          />
        </label>

        {error && <p className="warning" role="alert">{error}</p>}
        <button className="button" type="submit" disabled={!hasChanges}>
          Save trip details
        </button>
      </form>
    </section>
  )
}

function Itinerary({ trip, onChange, isSample = false }) {
  const [selectedDay, setSelectedDay] = useState(trip.startDate)
  const [printError, setPrintError] = useState('')

  const { currency, startDate, endDate, plan } = trip
  const day = selectedDay >= startDate && selectedDay <= endDate ? selectedDay : startDate
  const index = (Date.parse(day) - Date.parse(startDate)) / 86400000
  const included = plan?.schedule[index] ?? []
  const { activities: activeActivities, extraCost, total, pending } = tripCosts(trip)
  const dailyExtras = activeActivities.filter(({ date }) => date === day)
  const timeline = buildTimeline([...included, ...dailyExtras])
  const remainder = trip.budget - extraCost

  function money(amount) {
    return formatMoney(amount, currency)
  }

  function viewDay(value) {
    if (!value || value < startDate || value > endDate) return
    setSelectedDay(value)
  }

  function removeActivity(id) {
    onChange({ ...trip, activities: trip.activities.filter((item) => item.id !== id) })
  }

  function print() {
    const printable = isSample ? { ...trip, destination: trip.destination + ' (sample)' } : trip

    setPrintError(
      printItinerary(printable, activeActivities, currency)
        ? ''
        : 'Allow pop-ups for WanderAtlas to print the itinerary.',
    )
  }

  return (
    <section
      className="panel itinerary trip-timeline"
      id={isSample ? undefined : 'itinerary'}
      tabIndex={isSample ? undefined : -1}
    >
      <div className="section-heading">
        <div>
          <h2>Daily itinerary · {trip.destination}</h2>
          <p>{formatDate(day)}</p>
        </div>

        <div className="trip-day-controls">
          <button
            className="secondary"
            type="button"
            disabled={day === startDate}
            onClick={() => viewDay(stepDay(day, -1))}
          >
            Previous day
          </button>

          <label>
            View day
            <input
              type="date"
              value={day}
              min={startDate}
              max={endDate}
              onChange={(event) => viewDay(event.target.value)}
            />
          </label>

          <button
            className="secondary"
            type="button"
            disabled={day === endDate}
            onClick={() => viewDay(stepDay(day, 1))}
          >
            Next day
          </button>
        </div>
      </div>

      <div className="package-saved">
        {plan ? (
          <>
            <div>Saved package <strong>{money(trip.budget)}</strong></div>
            <div>
              {pending ? 'Known activity costs' : 'Extra activities'}{' '}
              <strong>{money(extraCost)}</strong>
            </div>
            <div>
              {pending ? 'Known total with extras' : 'Total with extras'}{' '}
              <strong>{money(total)}</strong>
            </div>
          </>
        ) : (
          <>
            <div>Saved budget <strong>{money(trip.budget)}</strong></div>
            <div>
              {pending ? 'Known planned spending' : 'Planned spending'}{' '}
              <strong>{money(extraCost)}</strong>
            </div>
            <div>
              {remainder < 0 ? 'Over budget by' : 'Remaining budget'}{' '}
              <strong>{money(Math.abs(remainder))}</strong>
            </div>
          </>
        )}
      </div>

      {pending > 0 && (
        <p className="package-note">
          {pending} {pending === 1 ? 'activity has' : 'activities have'} a price pending.
          Pending prices are excluded from the total.
        </p>
      )}

      <button className="secondary" type="button" onClick={print}>Print / Save as PDF</button>
      {printError && <p role="status">{printError}</p>}

      {activeActivities.length < trip.activities.length && (
        <p className="package-note">
          Some saved activities are outside these dates. Update the trip dates to view them.
        </p>
      )}

      {plan && (
        <p className="package-note package-itinerary-note">
          Package times are suggestions. Allow time to travel between stops.
        </p>
      )}

      {timeline.length > 0 ? (
        <ul className="timeline">
          {timeline.map((activity) => (
            <li key={activity.id ?? activity.time + activity.name}>
              <div>
                <h3><time>{activity.time}</time> · {activity.name}</h3>

                <p>
                  {activity.id
                    ? formatActivityCost(activity, currency)
                    : 'Included in package estimate'}
                </p>

                {activity.duration > 0 && (
                  <p>
                    {activity.duration} min
                    {activity.travel > 0 ? ' · ' + activity.travel + ' min travel before' : ''}
                  </p>
                )}

                {activity.hasConflict && (
                  <p className="warning">Check for overlapping times or insufficient travel time.</p>
                )}
              </div>

              {activity.id && (
                <div className="actions">
                  <button
                    className="secondary"
                    type="button"
                    aria-label={'Remove ' + activity.name}
                    onClick={() => removeActivity(activity.id)}
                  >
                    Remove
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="package-note package-itinerary-note">No activities planned for this day.</p>
      )}

      <TripChecklist
        items={trip.checklist}
        onChange={(checklist) => onChange({ ...trip, checklist })}
      />
    </section>
  )
}