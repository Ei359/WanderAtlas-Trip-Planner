import { useState } from 'react'
import {
  buildPackageDays,
  cityPackages,
  foodStyles,
  meals,
  presets,
  pricePackage,
  roomStyles,
} from './packageData.js'
import { formatDate, formatMoney, stepDay, toMinor } from './tripTools.js'
import './city-budget.css'

const dayMs = 86400000
const lengths = Array.from({ length: 30 }, (_, index) => index + 1)
const partySizes = Array.from({ length: 12 }, (_, index) => index + 1)

function initialDays(trip) {
  if (!trip) return 3

  const days = (Date.parse(trip.endDate) - Date.parse(trip.startDate)) / dayMs + 1
  return lengths.includes(days) ? days : 3
}

function toggleChoice(ids, id) {
  return ids.includes(id)
    ? ids.filter((item) => item !== id)
    : [...ids, id].sort((a, b) => a - b)
}

export default function CityBudget({
  destination,
  trip,
  onSave,
  submitLabel = 'Save as new trip',
}) {
  const profile = cityPackages[destination]

  const [draft, setDraft] = useState(() => ({
    startDate: trip?.startDate ?? '',
    days: initialDays(trip),
    travelers: partySizes.includes(trip?.travelers) ? trip.travelers : 1,
    choices: trip?.plan?.choices ?? presets.Explorer,
    preset: trip?.plan?.preset ?? 'Explorer',
  }))

  const [error, setError] = useState('')

  if (!profile) return null

  const { startDate, days, travelers, choices, preset } = draft
  const [currency, , , , places, food] = profile
  const quote = pricePackage(profile, days, travelers, choices)
  const endDate = startDate ? stepDay(startDate, days - 1) : ''

  const requiresExchangeRate = trip && trip.currency !== currency &&
    (trip.budgetLimit > 0 || trip.activities.some((activity) => activity.cost > 0))

  function money(amount) {
    return formatMoney(amount, currency)
  }

  function persistDraft(next, rate = 1) {
    if (!next.startDate) {
      setError('Choose an arrival date to save changes.')
      return
    }

    const nextQuote = pricePackage(profile, next.days, next.travelers, next.choices)

    const problem = onSave({
      destination,
      currency,
      startDate: next.startDate,
      endDate: stepDay(next.startDate, next.days - 1),
      travelers: next.travelers,
      budget: nextQuote.total,
      plan: {
        preset: next.preset,
        choices: next.choices,
        schedule: buildPackageDays(
          next.startDate,
          next.days,
          next.travelers,
          next.choices,
          nextQuote,
        ),
      },
    }, rate)

    setError(problem || '')
  }

  function updateDraft(changes) {
    const next = { ...draft, ...changes }
    setDraft(next)

    if (trip && !requiresExchangeRate) {
      persistDraft(next)
    } else {
      setError('')
    }
  }

  function updateChoice(field, value) {
    updateDraft({
      choices: { ...choices, [field]: value },
      preset: 'Custom',
    })
  }

  function applyExchangeRate(input) {
    if (!input.value || !input.validity.valid) {
      setError('Enter a valid exchange rate to save your changes.')
      return
    }

    persistDraft(draft, input.valueAsNumber)
  }

  function saveNewTrip(event) {
    event.preventDefault()

    if (!trip) persistDraft(draft)
  }

  return (
    <form className="package-grid" onSubmit={saveNewTrip}>
      <div className="panel package-builder">
        <h2>Build your {destination} package</h2>

        <div className="package-fields">
          <label>
            Arrival date
            <input
              type="date"
              required
              value={startDate}
              onChange={(event) => updateDraft({ startDate: event.target.value })}
            />
          </label>

          <label>
            Length of stay
            <select
              value={days}
              onChange={(event) => updateDraft({ days: Number(event.target.value) })}
            >
              {lengths.map((day) => (
                <option key={day} value={day}>
                  {day} {day === 1 ? 'day' : 'days'}
                </option>
              ))}
            </select>
          </label>

          <label>
            Travelers
            <select
              value={travelers}
              onChange={(event) => updateDraft({ travelers: Number(event.target.value) })}
            >
              {partySizes.map((count) => (
                <option key={count} value={count}>{count}</option>
              ))}
            </select>
          </label>
        </div>

        {endDate && <p>Last day of trip · {formatDate(endDate)}</p>}

        <fieldset>
          <legend>Start with a package</legend>

          <div className="package-options">
            {Object.entries(presets).map(([name, template]) => (
              <button
                key={name}
                type="button"
                className="secondary package-option"
                aria-pressed={preset === name}
                onClick={() => updateDraft({ preset: name, choices: template })}
              >
                <strong>{name}</strong>
                <span>{money(pricePackage(profile, days, travelers, template).total)}</span>
                <span>
                  {roomStyles[template.room][0]} · {template.stopIds.length}{' '}
                  {template.stopIds.length === 1 ? 'place' : 'places'}
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>Food and meals</legend>

          <label>
            Dining style
            <select
              value={choices.style}
              onChange={(event) => updateChoice('style', event.target.value)}
            >
              {Object.entries(foodStyles).map(([id, [name]]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          </label>

          <p className="package-note">Local foods to try · {food}</p>

          {meals.map(([name], index) => (
            <label className="package-check" key={name}>
              <input
                type="checkbox"
                checked={choices.mealIds.includes(index)}
                onChange={() => updateChoice('mealIds', toggleChoice(choices.mealIds, index))}
              />
              <span>{name}</span>
              <span>{money(quote.mealCosts[index])} / person / day</span>
            </label>
          ))}
        </fieldset>

        <fieldset>
          <legend>Places to visit</legend>

          <p className="package-note">
            Each selected place is added to the suggested itinerary once.
          </p>

          {places.map(([name, price], index) => (
            <label className="package-check" key={name}>
              <input
                type="checkbox"
                checked={choices.stopIds.includes(index)}
                onChange={() => updateChoice('stopIds', toggleChoice(choices.stopIds, index))}
              />
              <span>{name}</span>
              <span>
                {price ? money(toMinor(price, currency)) + ' / person' : 'No ticket in estimate'}
              </span>
            </label>
          ))}
        </fieldset>

        <div className="package-fields package-fields-two">
          <label>
            Stay type
            <select
              value={choices.room}
              onChange={(event) => updateChoice('room', event.target.value)}
            >
              {Object.entries(roomStyles).map(([id, [name]]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          </label>

          <label>
            Extra buffer
            <select
              value={choices.buffer}
              onChange={(event) => updateChoice('buffer', Number(event.target.value))}
            >
              {[0, 5, 10, 15, 20].map((percent) => (
                <option key={percent} value={percent}>{percent}%</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <section className="panel package-quote" aria-label="Package estimate">
        <h2>Estimated trip total</h2>

        <p className="package-note">
          {preset} · {days} {days === 1 ? 'day' : 'days'} · {travelers}{' '}
          {travelers === 1 ? 'traveler' : 'travelers'}
        </p>

        <output className="package-price">{money(quote.total)}</output>

        <p className="package-note">
          {money(Math.round(quote.total / travelers))} per traveler for the trip
        </p>

        <dl className="budget">
          <div><dt>Selected meals</dt><dd>{money(quote.mealTotal)}</dd></div>
          <div><dt>Local transport</dt><dd>{money(quote.transport)}</dd></div>
          <div><dt>Selected places</dt><dd>{money(quote.tickets)}</dd></div>
          <div>
            <dt>
              Stay · {quote.rooms} {quote.rooms === 1 ? 'room' : 'rooms'} ×{' '}
              {quote.nights} {quote.nights === 1 ? 'night' : 'nights'}
            </dt>
            <dd>{money(quote.lodging)}</dd>
          </div>
          <div><dt>Buffer ({choices.buffer}%)</dt><dd>{money(quote.reserve)}</dd></div>
        </dl>

        <p className="package-note">
          Demo rates in {currency}. Flights are excluded. Rooms assume up to two travelers each.
        </p>

        {requiresExchangeRate && (
          <label>
            1 {trip.currency} equals how many {currency}?
            <input
              name="rate"
              type="number"
              min="0.00000001"
              step="any"
              onBlur={(event) => applyExchangeRate(event.currentTarget)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  event.currentTarget.blur()
                }
              }}
              required
            />
            <small>Enter the rate and press Enter or leave this field to save your changes.</small>
          </label>
        )}

        {error && <p className="warning" role="alert">{error}</p>}

        {trip ? (
          !requiresExchangeRate && <p className="package-note">Changes save automatically.</p>
        ) : (
          <>
            <button className="button" type="submit">{submitLabel}</button>
            {!startDate && <p className="package-note">Select an arrival date to save.</p>}
          </>
        )}
      </section>
    </form>
  )
}