const entries = [
  ['Bangkok', 'Thailand', 'Southeast Asia', 32280274, 'bangkok.jpg'],
  ['Tokyo', 'Japan', 'East Asia', 22882149, 'tokyo.jpg'],
  ['Singapore', 'Singapore', 'Southeast Asia', 32850838, 'singapore.jpg'],
  ['Kuala Lumpur', 'Malaysia', 'Southeast Asia', 4176283, 'kuala-lumpur.jpg'],
  ['Seoul', 'South Korea', 'East Asia', 37821271, 'seoul.jpg'],
  ['Hanoi', 'Vietnam', 'Southeast Asia', 38031996, 'hanoi.jpg'],
  ['Bali', 'Indonesia', 'Southeast Asia', 13581474, 'bali.jpg'],
  ['Kyoto', 'Japan', 'East Asia', 7526805, 'kyoto.jpg'],
  ['Bagan', 'Myanmar', 'Southeast Asia', 3560161],
  ['Yangon', 'Myanmar', 'Southeast Asia', 18783419],
  ['Chiang Mai', 'Thailand', 'Southeast Asia', 7695084],
  ['Siem Reap', 'Cambodia', 'Southeast Asia', 15890689],
  ['Taipei', 'Taiwan', 'East Asia', 35894775],
  ['Hong Kong', 'Hong Kong', 'East Asia', 35295487],
  ['Dubai', 'United Arab Emirates', 'Middle East', 38518982],
  ['Paris', 'France', 'Europe', 36186370],
  ['London', 'United Kingdom', 'Europe', 427679],
  ['Rome', 'Italy', 'Europe', 36240423],
  ['Sydney', 'Australia', 'Oceania', 40285235],
  ['New York', 'United States', 'North America', 35990749],
]

export const places = entries.map(([city, country, region, photoId, localFile]) => {
  const onlinePhoto = `https://images.pexels.com/photos/${photoId}/pexels-photo-${photoId}.jpeg?auto=compress&cs=tinysrgb&w=480`

  return {
    city,
    country,
    region,
    onlinePhoto,
    image: localFile ? `${import.meta.env.BASE_URL}images/${localFile}` : onlinePhoto,
  }
})

export const regions = [...new Set(places.map((place) => place.region))]