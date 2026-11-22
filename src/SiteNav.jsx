import { useEffect, useRef, useState } from 'react'
import './site-nav.css'

const mobileQuery = '(max-width: 760px)'
const exploreLink = { label: 'Explore', href: '#/explore', page: 'explore' }

const links = [
  exploreLink,
  { label: 'Destinations', href: '#destinations', section: 'destinations' },
  { label: 'Trip Planner', href: '#/planner', page: 'planner' },
  { label: 'About', href: '#about', section: 'about' },
  { label: 'Contact', href: '#contact', section: 'contact' },
]

export default function SiteNav({ route }) {
  const [open, setOpen] = useState(false)
  const navRef = useRef(null)
  const toggleRef = useRef(null)

  useEffect(() => {
    if (!open) return

    const mobile = window.matchMedia(mobileQuery)
    const close = () => setOpen(false)

    function handlePointerDown(event) {
      if (!navRef.current?.contains(event.target)) close()
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        close()
        toggleRef.current?.focus()
      }
    }

    function handleResize(event) {
      if (!event.matches) close()
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('hashchange', close)
    mobile.addEventListener('change', handleResize)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('hashchange', close)
      mobile.removeEventListener('change', handleResize)
    }
  }, [open])

  function followLink(event, link) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

    if (open) {
      setOpen(false)
      toggleRef.current?.focus()
    }

    // App handles scrolling when the page or section changes.
    if (link.page === route.page && !route.section) {
      window.scrollTo(0, 0)
      document.getElementById('page-title')?.focus({ preventScroll: true })
    } else if (link.section && link.section === route.section) {
      const section = document.getElementById(link.section)
      section?.focus({ preventScroll: true })
      section?.scrollIntoView({ block: 'start' })
    }
  }

  function currentLink(link) {
    if (link.section && link.section === route.section) return 'location'
    if (link.page === route.page && !route.section) return 'page'
    return undefined
  }

  return (
    <header className="site-header">
      <nav className="site-nav" ref={navRef} aria-label="Main navigation">
        <a
          className="brand"
          href={exploreLink.href}
          onClick={(event) => followLink(event, exploreLink)}
        >
          WanderAtlas
        </a>

        <button
          className="site-menu-toggle"
          type="button"
          ref={toggleRef}
          aria-expanded={open}
          aria-controls="wanderatlas-main-links"
          onClick={() => setOpen(!open)}
        >
          <span aria-hidden="true">{open ? '×' : '☰'}</span>
          {open ? 'Close' : 'Menu'}
        </button>

        <ul className="site-menu-links" id="wanderatlas-main-links" data-open={open}>
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                aria-current={currentLink(link)}
                onClick={(event) => followLink(event, link)}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}