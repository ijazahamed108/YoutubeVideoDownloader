import { useEffect, useRef, useState } from 'react'
import { X, Heart } from 'lucide-react'
import { APP_CONFIG } from '../config/app'
import { SOCIAL_LINKS } from '../config/socialLinks'

const { intervalMinutes, autoHideSeconds, maxShows } = APP_CONFIG.followNotification

const FollowNotification = () => {
  const [isVisible, setIsVisible] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const showCount = useRef(0)
  const hideTimer = useRef(null)

  useEffect(() => {
    const interval = setInterval(() => {
      if (showCount.current >= maxShows) {
        clearInterval(interval)
        return
      }
      showCount.current += 1
      setIsVisible(true)
      clearTimeout(hideTimer.current)
      hideTimer.current = setTimeout(() => setIsVisible(false), autoHideSeconds * 1000)
    }, intervalMinutes * 60 * 1000)

    return () => {
      clearInterval(interval)
      clearTimeout(hideTimer.current)
    }
  }, [])

  const openModal = () => {
    clearTimeout(hideTimer.current) // don't auto-hide while the modal is open
    setShowModal(true)
  }

  const closeAll = () => {
    setShowModal(false)
    setIsVisible(false)
  }

  if (!isVisible && !showModal) return null

  return (
    <>
      {isVisible && (
        <div className="fixed bottom-4 right-4 z-40 animate-slide-up">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-lg shadow-lg max-w-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                <Heart className="w-5 h-5 text-pink-200 animate-pulse" />
                <div>
                  <p className="font-medium text-sm">Enjoying the app?</p>
                  <button
                    onClick={openModal}
                    className="text-xs text-pink-100 mt-1 hover:text-white underline cursor-pointer text-left"
                  >
                    Follow me on social media for more projects
                  </button>
                </div>
              </div>
              <button
                onClick={() => setIsVisible(false)}
                className="text-pink-200 hover:text-white transition-colors ml-2"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={closeAll}
          role="dialog"
          aria-modal="true"
          aria-label="Follow me"
        >
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Follow Me</h3>
              <button onClick={closeAll} className="text-gray-400 hover:text-gray-600" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              {SOCIAL_LINKS.map(({ name, icon: Icon, url, color }) => (
                <a
                  key={name}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Icon className={`w-5 h-5 ${color}`} />
                  <span className="text-gray-700 font-medium">{name}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default FollowNotification
