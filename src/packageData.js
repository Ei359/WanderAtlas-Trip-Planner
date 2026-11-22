import { stepDay, toMinor } from './tripTools.js'

// Demo rates in local currency. Meals are per person, rooms per night,
// transport per person per day, and attraction prices per visit per person.
export const cityPackages = {
  Bangkok: ['THB', 1400, 180, [90, 150, 210], [
    ['Lumphini Park', 0], ['Wat Arun', 200], ['Grand Palace', 500],
  ], 'Jok, pad thai, tom yum'],
  Tokyo: ['JPY', 12000, 1000, [650, 1100, 1750], [
    ['Sensō-ji', 0], ['Tokyo Skytree', 2400], ['Tokyo National Museum', 1000],
  ], 'Onigiri, soba, ramen'],
  Singapore: ['SGD', 150, 12, [8, 12, 20], [
    ['Singapore Botanic Gardens', 0],
    ['Gardens by the Bay conservatories', 35],
    ['National Gallery Singapore', 20],
  ], 'Kaya toast, chicken rice, laksa'],
  'Kuala Lumpur': ['MYR', 170, 20, [12, 18, 30], [
    ['KLCC Park', 0],
    ['Petronas Twin Towers observation deck', 100],
    ['Islamic Arts Museum Malaysia', 20],
  ], 'Nasi lemak, roti canai, char kway teow'],
  Seoul: ['KRW', 90000, 8000, [6000, 10000, 16000], [
    ['Cheonggyecheon Stream', 0],
    ['Gyeongbokgung Palace', 3000],
    ['N Seoul Tower observatory', 22000],
  ], 'Gimbap, bibimbap, Korean barbecue'],
  Hanoi: ['VND', 850000, 100000, [55000, 85000, 140000], [
    ['Hoan Kiem Lake', 0], ['Temple of Literature', 70000], ['Water puppet show', 150000],
  ], 'Phở, bún chả, chả cá'],
  Bali: ['IDR', 750000, 120000, [45000, 70000, 105000], [
    ['Ubud Palace', 0], ['Tegallalang Rice Terraces', 50000], ['Uluwatu Temple', 60000],
  ], 'Bubur ayam, nasi campur, sate lilit'],
  Kyoto: ['JPY', 10500, 850, [600, 1000, 1600], [
    ['Fushimi Inari Taisha', 0], ['Kiyomizu-dera', 500], ['Nijō Castle', 1300],
  ], 'Rice and miso soup, udon, yudofu'],
  Bagan: ['MMK', 90000, 22000, [6000, 10000, 14000], [
    ['Nyaung-U Market', 0], ['Ananda Temple', 0], ['Bagan Archaeological Museum', 10000],
  ], 'Mohinga, tea-leaf salad, Burmese curry'],
  Yangon: ['MMK', 100000, 18000, [7000, 11000, 17000], [
    ['Maha Bandula Park', 0], ['Shwedagon Pagoda', 15000], ['National Museum of Myanmar', 10000],
  ], 'Mohinga, Shan noodles, Burmese curry'],
  'Chiang Mai': ['THB', 1000, 140, [70, 110, 170], [
    ['Tha Phae Gate', 0], ['Wat Phra That Doi Suthep', 40], ['Wat Chedi Luang', 50],
  ], 'Jok, khao soi, sai ua'],
  'Siem Reap': ['KHR', 180000, 40000, [15000, 25000, 35000], [
    ['Old Market', 0], ['Angkor Wat with day pass', 150000], ['Angkor National Museum', 50000],
  ], 'Nom banh chok, fish amok, lok lak'],
  Taipei: ['TWD', 2300, 160, [120, 220, 310], [
    ['Longshan Temple', 0], ['Taipei 101 Observatory', 600], ['National Palace Museum', 350],
  ], 'Soy milk and egg pancake, beef noodle soup, lu rou fan'],
  'Hong Kong': ['HKD', 780, 65, [45, 70, 105], [
    ['Tsim Sha Tsui Promenade', 0], ['Peak Tram', 110], ['M+ museum', 120],
  ], 'Pineapple bun, wonton noodles, roast meats'],
  Dubai: ['AED', 320, 35, [20, 35, 45], [
    ['Al Fahidi Historical Neighbourhood', 0], ['Dubai Frame', 50],
    ['Burj Khalifa observation deck', 180],
  ], 'Balaleet, shawarma, machboos'],
  Paris: ['EUR', 140, 12, [9, 14, 22], [
    ['Jardin du Luxembourg', 0], ['Eiffel Tower', 35], ['Louvre Museum', 25],
  ], 'Croissant, jambon-beurre, steak frites'],
  London: ['GBP', 135, 12, [8, 14, 20], [
    ['Hyde Park', 0], ['Tower of London', 35], ['Westminster Abbey', 30],
  ], 'English breakfast, sandwich, fish and chips'],
  Rome: ['EUR', 115, 8, [6, 12, 20], [
    ['Villa Borghese Gardens', 0], ['Colosseum', 20], ['Borghese Gallery', 18],
  ], 'Cornetto, pizza al taglio, carbonara'],
  Sydney: ['AUD', 180, 18, [13, 22, 30], [
    ['Royal Botanic Garden Sydney', 0], ['Sydney Opera House tour', 45], ['Taronga Zoo', 55],
  ], 'Toast, fish and chips, grilled barramundi'],
  'New York': ['USD', 210, 14, [13, 22, 30], [
    ['Central Park', 0], ['Metropolitan Museum of Art', 30], ['Top of the Rock', 45],
  ], 'Bagel, pizza slice, deli sandwich'],
}

export const meals = [
  ['Breakfast', '08:00'],
  ['Lunch', '12:30'],
  ['Dinner', '19:00'],
]

export const foodStyles = {
  local: ['Street food and markets', 0.7],
  casual: ['Casual restaurants', 1],
  table: ['Table-service dining', 1.6],
}

export const roomStyles = {
  none: ['Arrange my own stay', 0],
  basic: ['Budget room', 0.7],
  standard: ['Standard room', 1],
  comfort: ['Comfort room', 1.5],
}

export const presets = {
  Essential: { style: 'local', mealIds: [1, 2], room: 'basic', stopIds: [0], buffer: 5 },
  Explorer: { style: 'casual', mealIds: [0, 1, 2], room: 'standard', stopIds: [0, 1], buffer: 10 },
  Comfort: { style: 'table', mealIds: [0, 1, 2], room: 'comfort', stopIds: [0, 1, 2], buffer: 15 },
}

export function pricePackage(profile, days, travelers, choices) {
  const [currency, roomRate, transportRate, mealRates, places] = profile
  const nights = days - 1
  const rooms = nights > 0 && choices.room !== 'none' ? Math.ceil(travelers / 2) : 0
  const mealCosts = mealRates.map((rate) => toMinor(rate * foodStyles[choices.style][1], currency))
  const roomCost = toMinor(roomRate * roomStyles[choices.room][1], currency)
  const transportPerPerson = toMinor(transportRate, currency)

  const stops = choices.stopIds.map((id) => {
    const [name, price] = places[id]
    return { name, cost: toMinor(price, currency) * travelers }
  })

  const dailyMeals = choices.mealIds.reduce((sum, id) => sum + mealCosts[id] * travelers, 0)
  const mealTotal = dailyMeals * days
  const transport = transportPerPerson * travelers * days
  const lodging = roomCost * rooms * nights
  const tickets = stops.reduce((sum, stop) => sum + stop.cost, 0)
  const subtotal = mealTotal + transport + lodging + tickets
  const reserve = Math.round(subtotal * choices.buffer / 100)

  return {
    nights, rooms, mealCosts, stops,
    mealTotal, transport, lodging, tickets, reserve, total: subtotal + reserve,
  }
}

export function buildPackageDays(startDate, days, travelers, choices, quote) {
  const times = ['09:30', '14:30', '16:00']

  return Array.from({ length: days }, (_, day) => {
    const date = stepDay(startDate, day)
    const rows = choices.mealIds.map((id) => ({
      date,
      name: meals[id][0],
      time: meals[id][1],
      cost: quote.mealCosts[id] * travelers,
      duration: 45,
    }))

    quote.stops.forEach((stop, index) => {
      if (index % days === day) {
        rows.push({
          ...stop,
          date,
          time: times[Math.floor(index / days)],
          duration: 60,
        })
      }
    })

    return rows.sort((first, second) => first.time.localeCompare(second.time))
  })
}