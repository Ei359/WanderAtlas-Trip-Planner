import { useEffect, useRef, useState } from 'react'
import { places, regions } from './places.js'
import TripPlanner from './TripPlanner.jsx'
import './sample-trip.css'
import './pages.css'
import SiteNav from './SiteNav.jsx'

const CONTACT_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSffThrNueM2uWh0R9RJj0GvpOSKk7Fin8Vw61kgUA_PnryWDw/viewform?usp=dialog' 

const exploreSections = new Set([
  'welcome', 'destinations', 'about', 'faq', 'contact',
])

function plannerLink(destination) {
  if (destination == null) return '#/planner'
  return '#/planner?' + new URLSearchParams({ destination }).toString()
}

function readRoute() {
  const [path, query] = window.location.hash.slice(1).split('?')

  if (path === '/planner' || path === 'planner' || path === 'itinerary') {
    return {
      page: 'planner',
      destination: new URLSearchParams(query).get('destination'),
      section: path === 'itinerary' ? 'itinerary' : null,
    }
  }

  return {
    page: 'explore',
    destination: null,
    section: exploreSections.has(path) ? path : null,
  }
}

function handlePhotoError(event, onlinePhoto) {
  const image = event.currentTarget

  if (image.src === onlinePhoto) {
    image.hidden = true
  } else {
    image.src = onlinePhoto
  }
}

export default function App() {
  const [route, setRoute] = useState(readRoute)

  useEffect(() => {
    function onRouteChange() {
      setRoute(readRoute())
    }

    window.addEventListener('hashchange', onRouteChange)
    return () => window.removeEventListener('hashchange', onRouteChange)
  }, [])

  useEffect(() => {
    document.title = route.page === 'planner'
      ? 'Trip Planner | WanderAtlas'
      : 'Explore Destinations | WanderAtlas'

    const section = route.section && document.getElementById(route.section)

    if (section) {
      section.focus({ preventScroll: true })
      section.scrollIntoView({ block: 'start' })
    } else {
      window.scrollTo(0, 0)
      document.getElementById('page-title')?.focus({ preventScroll: true })
    }
  }, [route.page, route.section])

  return (
    <div className="site">
      <SiteNav route={route} />
      {route.page === 'planner' ? (
        <main>
          <header className="panel planner-intro">
            <div>
              <h1 id="page-title" tabIndex={-1}>Trip Planner</h1>
              <p>Choose your dates, compare package estimates, and organize your trip.</p>
            </div>

            <a className="secondary" href="#destinations">Browse destinations</a>
          </header>

          <TripPlanner
            selectedDestination={route.destination}
            onDestinationChange={(destination) => {
              window.location.hash = plannerLink(destination)
            }}
          />
        </main>
      ) : (
        <>
          <ExplorePage />
          <SiteFooter />
        </>
      )}
    </div>
  )
}

function ExplorePage() {
  const [query, setQuery] = useState('')
  const [region, setRegion] = useState('')
  const [sampleOpen, setSampleOpen] = useState(false)
  const [edges, setEdges] = useState({ left: false, right: false })
  const railRef = useRef(null)

  const search = query.trim().toLowerCase()
  const matchingPlaces = places.filter(({ city, country, region: placeRegion }) => {
    const label = (city + ' ' + country).toLowerCase()
    return label.includes(search) && (!region || placeRegion === region)
  })

  useEffect(() => {
    const rail = railRef.current

    function measure() {
      const left = rail.scrollLeft > 1
      const right = rail.scrollLeft + rail.clientWidth < rail.scrollWidth - 1

      setEdges((previous) =>
        previous.left === left && previous.right === right
          ? previous
          : { left, right },
      )
    }

    measure()
    rail.addEventListener('scroll', measure, { passive: true })
    window.addEventListener('resize', measure)

    return () => {
      rail.removeEventListener('scroll', measure)
      window.removeEventListener('resize', measure)
    }
  }, [matchingPlaces.length])

  function scrollDestinations(direction) {
    const rail = railRef.current
    rail.scrollBy({ left: direction * Math.round(rail.clientWidth * 0.85) })
  }

  return (
    <main>
      <header className="hero" id="welcome" tabIndex={-1}>
        <h1 id="page-title" tabIndex={-1}>Plan your next trip</h1>
        <p>Explore 20 destinations, estimate your budget, and build an itinerary you can come back to.</p>

        <div className="actions hero-actions">
          <a className="button" href="#destinations">Explore destinations</a>
          <button
            className="button sample-trigger"
            type="button"
            aria-haspopup="dialog"
            onClick={() => setSampleOpen(true)}
          >
            Try a sample trip
          </button>
        </div>
      </header>

      <section className="explore" id="destinations" tabIndex={-1}>
        <div className="section-heading">
          <h2>Where would you like to go?</h2>

          <div className="destination-filters">
            <label>
              City or country
              <input
                type="search"
                value={query}
                placeholder="e.g. Myanmar"
                onChange={(event) => {
                  setQuery(event.target.value)
                  railRef.current.scrollLeft = 0
                }}
              />
            </label>

            <label>
              Region
              <select
                value={region}
                onChange={(event) => {
                  setRegion(event.target.value)
                  railRef.current.scrollLeft = 0
                }}
              >
                <option value="">All regions</option>
                {regions.map((name) => <option key={name}>{name}</option>)}
              </select>
            </label>
          </div>
        </div>

        <div className="destination-toolbar">
          <p role="status">
            {matchingPlaces.length > 0
              ? matchingPlaces.length + (matchingPlaces.length === 1 ? ' destination' : ' destinations')
              : 'No destinations match your search.'}
          </p>

          {(edges.left || edges.right) && (
            <div className="actions">
              <button
                className="secondary destination-arrow"
                type="button"
                aria-label="Scroll destinations left"
                aria-controls="destination-results"
                disabled={!edges.left}
                onClick={() => scrollDestinations(-1)}
              >
                ←
              </button>

              <button
                className="secondary destination-arrow"
                type="button"
                aria-label="Scroll destinations right"
                aria-controls="destination-results"
                disabled={!edges.right}
                onClick={() => scrollDestinations(1)}
              >
                →
              </button>
            </div>
          )}
        </div>

        <div
          className="destination-grid destination-rail"
          id="destination-results"
          ref={railRef}
          role="region"
          aria-label="Destination photos"
          tabIndex={matchingPlaces.length > 0 ? 0 : undefined}
        >
          {matchingPlaces.map(({ city, country, image, onlinePhoto }) => (
            <a className="destination" key={city} href={plannerLink(city)}>
              <span className="photo">
                <span aria-hidden="true">{city.slice(0, 2).toUpperCase()}</span>
                <img
                  src={image}
                  width="160"
                  height="160"
                  loading="lazy"
                  alt=""
                  onError={(event) => handlePhotoError(event, onlinePhoto)}
                />
              </span>

              <strong>{city}</strong>
              <span>{country}</span>
            </a>
          ))}
        </div>
      </section>

      <div className="explore-info">
        <section className="panel" id="about" tabIndex={-1}>
          <h2>About WanderAtlas</h2>
          <p>
            WanderAtlas helps independent travelers compare trip estimates,
            put together a daily itinerary, and track what they need to do before leaving.
          </p>
          <p>Use the sample trip to try the planner, or select a destination to create your own trip.</p>
        </section>

        <section className="panel" id="faq" tabIndex={-1}>
          <h2>Frequently asked questions</h2>

          <details>
            <summary>Are the prices live?</summary>
            <p>Package prices are planning estimates. Confirm rates and availability with the provider before booking.</p>
          </details>

          <details>
            <summary>Where are my trips saved?</summary>
            <p>Trips, notes, and checklist progress are saved in this browser. Reopen them in Trip Planner.</p>
          </details>

          <details>
            <summary>Can I take my itinerary offline?</summary>
            <p>Use Print / Save as PDF in the itinerary to keep a copy on your device.</p>
          </details>
        </section>
      </div>

      <ContactSection />
      {sampleOpen && <SampleDialog onClose={() => setSampleOpen(false)} />}
    </main>
  )
}

function SampleDialog({ onClose }) {
  const dialogRef = useRef(null)
  const [resetCount, setResetCount] = useState(0)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog.open) dialog.showModal()
  }, [])

  return (
    <dialog
      className="sample-dialog"
      ref={dialogRef}
      aria-labelledby="sample-title"
      aria-describedby="sample-description"
      onClose={onClose}
    >
      <header className="section-heading sample-header">
        <div>
          <h2 id="sample-title">Sample trip to Bagan</h2>
          <p id="sample-description">
            Explore two days in Bagan with a sample budget in kyats.
            Try checking off tasks in the trip checklist.
          </p>
        </div>

        <div className="actions">
          <button
            className="secondary"
            type="button"
            onClick={() => setResetCount((count) => count + 1)}
          >
            Reset sample
          </button>

          <button
            className="button"
            type="button"
            onClick={() => dialogRef.current.close()}
          >
            Close sample
          </button>
        </div>
      </header>

      <p className="sample-notice" role="status">
        Demo prices and travel times are examples. Edits reset when you close the sample.
        {resetCount > 0 && ' Sample reset.'}
      </p>

      <TripPlanner key={resetCount} isSample />
    </dialog>
  )
}

function ContactSection() {
  return (
    <section className="panel contact-panel" id="contact" tabIndex={-1}>
      <h2>Contact</h2>
      <p>Have a question, spotted a bug, or want to suggest a destination?</p>

      {CONTACT_FORM_URL ? (
        <div className="actions" style={{ marginTop: 12 }}>
          <a
            className="button"
            href={CONTACT_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Send feedback (opens in a new tab)
          </a>
        </div>
      ) : (
        <p className="package-note" style={{ marginTop: 12 }}>
          The contact form is currently unavailable.
        </p>
      )}
    </section>
  )
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div>
        <a className="brand" href="#welcome">WanderAtlas</a>
        <p>© {new Date().getFullYear()} WanderAtlas</p>
      </div>

      <nav aria-label="Footer navigation">
        <a href="#destinations">Destinations</a>
        <a href="#/planner">Trip Planner</a>
        <a href="#about">About</a>
        <a href="#faq">FAQ</a>
        <a href="#contact">Contact</a>
      </nav>
    </footer>
  )
}