export const currencies = {
  MMK: { name: 'Myanmar kyat', digits: 0 },
  USD: { name: 'US dollar', digits: 2 },
  THB: { name: 'Thai baht', digits: 2 },
  SGD: { name: 'Singapore dollar', digits: 2 },
  JPY: { name: 'Japanese yen', digits: 0 },
  EUR: { name: 'Euro', digits: 2 },
  GBP: { name: 'British pound', digits: 2 },
  MYR: { name: 'Malaysian ringgit', digits: 2 },
  KRW: { name: 'South Korean won', digits: 0 },
  VND: { name: 'Vietnamese dong', digits: 0 },
  IDR: { name: 'Indonesian rupiah', digits: 0 },
  KHR: { name: 'Cambodian riel', digits: 0 },
  TWD: { name: 'New Taiwan dollar', digits: 2 },
  HKD: { name: 'Hong Kong dollar', digits: 2 },
  AED: { name: 'UAE dirham', digits: 2 },
  AUD: { name: 'Australian dollar', digits: 2 },
}

const dates = new Intl.DateTimeFormat('en', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
})

export function fromMinor(amount, currency) {
  return amount / 10 ** currencies[currency].digits
}

export function toMinor(amount, currency) {
  return Math.round(Number(amount) * 10 ** currencies[currency].digits)
}

export function currencyStep(currency) {
  return currencies[currency].digits === 0 ? '1' : '0.01'
}

export function formatMoney(amount, currency) {
  const digits = currencies[currency].digits

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    currencyDisplay: 'code',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(fromMinor(amount, currency))
}

export function formatDate(date) {
  return dates.format(new Date(date + 'T00:00:00Z'))
}

export function stepDay(date, offset) {
  const day = new Date(date + 'T00:00:00Z')
  day.setUTCDate(day.getUTCDate() + offset)
  return day.toISOString().slice(0, 10)
}

export function toMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

export function buildTimeline(activities) {
  let occupiedUntil = 0

  return [...activities]
    .sort((first, second) => first.time.localeCompare(second.time))
    .map((activity) => {
      const start = toMinutes(activity.time)
      const hasConflict = start - (activity.travel ?? 0) < occupiedUntil
      occupiedUntil = Math.max(occupiedUntil, start + (activity.duration ?? 0))
      return { ...activity, hasConflict }
    })
}

export function costTotal(activities) {
  return activities.reduce((sum, activity) => sum + (activity.cost ?? 0), 0)
}

export function formatActivityCost(activity, currency) {
  if (activity.cost == null) return 'Price pending'

  const { pricing } = activity
  const prefix = pricing?.demo ? 'Demo estimate · ' : ''

  if (pricing?.mode === 'free') return prefix + 'Free'

  const total = formatMoney(activity.cost, currency)

  if (pricing?.mode === 'person') {
    const each = formatMoney(pricing.unitCost, currency)
    const people = pricing.participants === 1 ? 'person' : 'people'

    return prefix + each + ' × ' + pricing.participants + ' ' + people +
      ' = ' + total + ' for the group'
  }

  return prefix + total + ' for the group'
}

export function convertActivityCost(activity, from, to, rate) {
  if (activity.cost == null || from === to) return activity

  if (activity.pricing?.mode === 'person' || activity.pricing?.mode === 'group') {
    const unitCost = toMinor(fromMinor(activity.pricing.unitCost, from) * rate, to)

    return {
      ...activity,
      cost: unitCost * (activity.pricing.participants ?? 1),
      pricing: { ...activity.pricing, unitCost },
    }
  }

  return {
    ...activity,
    cost: toMinor(fromMinor(activity.cost, from) * rate, to),
  }
}

const printStyles = `
  @page { margin: 14mm; }

  * { box-sizing: border-box; }

  body {
    margin: 0 auto;
    padding: 28px;
    max-width: 880px;
    color: #22352d;
    background: #fff;
    font: 14px/1.5 system-ui, sans-serif;
    overflow-wrap: anywhere;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  h1, h2, h3, p, dl, dd, ul, ol { margin: 0; }

  h1 {
    font: 700 2.3rem/1.12 Georgia, serif;
    margin: 6px 0 10px;
  }

  h2 {
    font-size: 1.15rem;
    margin-bottom: 8px;
    break-after: avoid;
  }

  h3 { font-size: 1rem; }
  p + p { margin-top: 4px; }

  .print-actions {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 18px;
  }

  .print-actions button {
    padding: 8px 14px;
    border: 1px solid #2a6249;
    border-radius: 7px;
    background: white;
    color: #204d39;
    font: inherit;
    cursor: pointer;
  }

  .trip-header {
    padding-bottom: 15px;
    border-bottom: 3px solid #2a6249;
    break-inside: avoid;
  }

  .brand { font-size: .86rem; font-weight: 750; color: #2a6249; }
  .trip-meta, .muted, .activity-details { color: #4b5e55; }
  .trip-meta { font-size: .93rem; }

  section { margin-top: 18px; }
  .budget { break-inside: avoid; }

  .totals, .limit {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }

  .limit {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    margin-top: 8px;
  }

  .amount {
    padding: 9px 11px;
    border: 1px solid #d9e4da;
    border-radius: 8px;
    background: #f4f8f3;
  }

  .amount dt { font-size: .87rem; }

  .amount dd {
    margin-top: 2px;
    font-weight: 750;
    font-variant-numeric: tabular-nums;
  }

  .amount.total { border-color: #93b49e; background: #eaf4ec; }
  .amount.over-limit { border-color: #c68677; }
  .budget .muted, .budget .warning { margin-top: 6px; }

  .day { margin-top: 12px; }

  .day-heading {
    padding: 7px 10px;
    border-top: 1px solid #c2d5c7;
    background: #edf4ee;
    break-after: avoid;
  }

  .day-number { color: #24543d; margin-right: 9px; }
  .activities, .checklist { list-style: none; padding: 0; }

  .activity {
    display: grid;
    grid-template-columns: 4rem minmax(0, 1fr);
    gap: 8px;
    padding: 8px 0;
    border-bottom: 1px solid #dfe8df;
    break-inside: avoid;
  }

  .activity time { font-weight: 700; font-variant-numeric: tabular-nums; }
  .activity-name { font-weight: 700; }
  .activity-details { font-size: .88rem; }
  .warning { color: #823a2e; font-size: .88rem; }
  .free-day { padding: 7px 0; }
  .notes { white-space: pre-wrap; }

  .checklist li {
    padding: 5px 0;
    border-bottom: 1px solid #dfe8df;
    break-inside: avoid;
  }

  .checklist .task-status { margin-right: 7px; font-weight: 750; }

  @media screen and (max-width: 540px) {
    body { padding: 16px; }
    h1 { font-size: 1.9rem; }
    .totals, .limit { grid-template-columns: minmax(0, 1fr); }
  }

  @media print {
    body { max-width: none; padding: 0; font-size: 10.5pt; }
    .print-actions { display: none; }
    h1 { font-size: 25pt; }
    h2, h3 { break-after: avoid; }
  }
`

export function printItinerary(trip, activities, currency) {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return false

  printWindow.opener = null

  const doc = printWindow.document
  doc.open()
  doc.write(
    '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    '</head><body></body></html>',
  )
  doc.close()

  const title = trip.title?.trim() || trip.destination + ' itinerary'
  doc.title = title + ' | WanderAtlas'

  function add(parent, tag, text, className) {
    const element = doc.createElement(tag)

    if (text !== undefined) element.textContent = text
    if (className) element.className = className

    parent.append(element)
    return element
  }

  function amount(parent, label, value, emphasis = '') {
    const item = add(parent, 'div', undefined, ('amount ' + emphasis).trim())
    add(item, 'dt', label)
    add(item, 'dd', formatMoney(value, currency))
  }

  add(doc.head, 'style', printStyles)

  const actions = add(doc.body, 'div', undefined, 'print-actions')
  const printButton = add(actions, 'button', 'Print / Save as PDF')
  printButton.type = 'button'
  printButton.addEventListener('click', () => printWindow.print())

  const days = new Map()

  for (let date = trip.startDate; date <= trip.endDate; date = stepDay(date, 1)) {
    days.set(date, [])
  }

  const extras = activities.filter(({ date }) => days.has(date))

  for (const activity of [...(trip.plan?.schedule.flat() ?? []), ...extras]) {
    days.get(activity.date)?.push(activity)
  }

  const sheet = add(doc.body, 'main')
  const header = add(sheet, 'header', undefined, 'trip-header')

  add(header, 'p', 'WanderAtlas', 'brand')
  add(header, 'h1', title)

  const travelers = trip.travelers ?? 1
  const dayCount = days.size
  const counts = dayCount + (dayCount === 1 ? ' day' : ' days') +
    ' · ' + travelers + (travelers === 1 ? ' traveler' : ' travelers')
  const dateRange = trip.startDate === trip.endDate
    ? formatDate(trip.startDate)
    : formatDate(trip.startDate) + ' to ' + formatDate(trip.endDate)

  add(header, 'p', trip.destination + ' · ' + counts, 'trip-meta')
  add(header, 'p', dateRange, 'trip-meta')

  const extraCost = costTotal(extras)
  const pending = extras.filter(({ cost }) => cost == null).length
  const total = trip.plan ? trip.budget + extraCost : extraCost

  const budget = add(sheet, 'section', undefined, 'budget')
  add(budget, 'h2', 'Budget overview')
  const totals = add(budget, 'dl', undefined, 'totals')

  if (trip.plan) {
    amount(totals, 'Package estimate', trip.budget)
    amount(totals, pending ? 'Known extra costs' : 'Extra activities', extraCost)
    amount(totals, pending ? 'Known total' : 'Estimated total', total, 'total')
    add(budget, 'p', 'Package prices are estimates. Flights are excluded.', 'muted')
  } else {
    amount(totals, 'Saved budget', trip.budget)
    amount(totals, pending ? 'Known planned spending' : 'Planned spending', total, 'total')
  }

  const limitValue = trip.budgetLimit ?? (trip.plan ? null : trip.budget)

  if (limitValue != null) {
    const limit = add(budget, 'dl', undefined, 'limit')
    const remaining = limitValue - total

    if (trip.plan || trip.budgetLimit != null) {
      amount(limit, 'Budget limit', limitValue)
    }

    amount(
      limit,
      remaining < 0
        ? 'Over budget by'
        : pending ? 'Remaining after known costs' : 'Budget remaining',
      Math.abs(remaining),
      remaining < 0 ? 'over-limit' : '',
    )
  }

  if (pending) {
    const subject = pending === 1 ? ' activity has' : ' activities have'
    add(budget, 'p', pending + subject + ' a pending price, excluded from the total.', 'warning')
  }

  const itinerary = add(sheet, 'section')
  add(itinerary, 'h2', 'Daily itinerary')

  let dayNumber = 0

  for (const [date, dailyActivities] of days) {
    dayNumber += 1

    const day = add(itinerary, 'section', undefined, 'day')
    const heading = add(day, 'h3', undefined, 'day-heading')
    add(heading, 'span', 'Day ' + dayNumber, 'day-number')
    add(heading, 'span', formatDate(date))

    if (!dailyActivities.length) {
      add(day, 'p', 'Free day · No activities planned.', 'muted free-day')
      continue
    }

    const list = add(day, 'ol', undefined, 'activities')

    for (const activity of buildTimeline(dailyActivities)) {
      const row = add(list, 'li', undefined, 'activity')
      add(row, 'time', activity.time)

      const details = add(row, 'div')
      add(details, 'p', activity.name, 'activity-name')

      const pricing = activity.id
        ? formatActivityCost(activity, currency)
        : 'Included in package estimate'
      const information = [pricing]

      if (activity.duration > 0) information.push(activity.duration + ' min')
      if (activity.travel > 0) information.push('Allow ' + activity.travel + ' min travel')

      add(details, 'p', information.join(' · '), 'activity-details')

      if (activity.hasConflict) {
        add(details, 'p', 'Check for overlapping times or insufficient travel time.', 'warning')
      }
    }
  }

  const notes = trip.notes?.trim()

  if (notes) {
    const notesSection = add(sheet, 'section')
    add(notesSection, 'h2', 'Trip notes')
    add(notesSection, 'p', notes, 'notes')
  }

  if (trip.checklist?.length) {
    const checklistSection = add(sheet, 'section')
    add(checklistSection, 'h2', 'Trip checklist')
    const list = add(checklistSection, 'ul', undefined, 'checklist')

    for (const task of trip.checklist) {
      const item = add(list, 'li')
      add(item, 'span', task.done ? 'Done' : 'To do', 'task-status')
      add(item, 'span', task.label)
    }
  }

  printWindow.focus()
  printWindow.print()
  return true
}