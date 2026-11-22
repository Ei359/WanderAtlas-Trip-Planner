const firstDay = '2027-02-06'
const secondDay = '2027-02-07'

export const sampleTrip = {
  destination: 'Bagan',
  startDate: firstDay,
  endDate: secondDay,
  currency: 'MMK',
  budget: 350000,
  activities: [
    {
      id: 'sample-ananda',
      name: 'Visit Ananda Temple',
      date: firstDay,
      time: '09:00',
      duration: 75,
      travel: 0,
      cost: 35000,
    },
    {
      id: 'sample-lunch',
      name: 'Lunch in Old Bagan',
      date: firstDay,
      time: '10:30',
      duration: 60,
      travel: 30,
      cost: 30000,
    },
    {
      id: 'sample-shwezigon',
      name: 'Visit Shwezigon Pagoda',
      date: secondDay,
      time: '09:30',
      duration: 60,
      travel: 0,
      cost: 25000,
    },
    {
      id: 'sample-market',
      name: 'Explore Nyaung-U Market',
      date: secondDay,
      time: '11:30',
      duration: 60,
      travel: 20,
      cost: 20000,
    },
  ],
}