import { useState, useEffect } from 'react'
import { X, Heart, Github, Instagram, Youtube, Facebook, Linkedin } from 'lucide-react'
import { APP_CONFIG } from '../config/app'

const FollowNotification = ({ intervalMinutes = APP_CONFIG.followNotification.intervalMinutes }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [showSocialModal, setShowSocialModal] = useState(false)

  const socialLinks = [
    { name: 'GitHub', icon: Github, url: APP_CONFIG.socialLinks.github, color: 'text-gray-700' },
    { name: 'Instagram', icon: Instagram, url: APP_CONFIG.socialLinks.instagram, color: 'text-pink-600' },
    { name: 'YouTube', icon: Youtube, url: APP_CONFIG.socialLinks.youtube, color: 'text-red-600' },
    { name: 'Facebook', icon: Facebook, url: APP_CONFIG.socialLinks.facebook, color: 'text-blue-600' },
    { name: 'LinkedIn', icon: Linkedin, url: APP_CONFIG.socialLinks.linkedin, color: 'text-blue-700' }
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(true)
      // Auto hide after configured seconds
      setTimeout(() => setIsVisible(false), APP_CONFIG.followNotification.autoHideSeconds * 1000)
    }, intervalMinutes * 60 * 1000)

    return () => clearInterval(interval)
  }, [intervalMinutes])

  if (!isVisible) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-2 duration-500">
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-lg shadow-lg max-w-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <Heart className="w-5 h-5 text-pink-200 animate-pulse" />
            <div>
              <p className="font-medium text-sm">Enjoying the app?</p>
              <button
                onClick={() => setShowSocialModal(true)}
                className="text-xs text-pink-100 mt-1 hover:text-white underline cursor-pointer"
              >
                Follow me on social media for more awesome projects! 🚀
              </button>
            </div>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="text-pink-200 hover:text-white transition-colors ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {showSocialModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Follow Me</h3>
              <button
                onClick={() => setShowSocialModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              {socialLinks.map((link) => {
                const Icon = link.icon
                return (
                  <a
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Icon className={`w-5 h-5 ${link.color}`} />
                    <span className="text-gray-700 font-medium">{link.name}</span>
                  </a>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FollowNotification