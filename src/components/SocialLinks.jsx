import { Github, Instagram, Youtube, Facebook, Linkedin } from 'lucide-react'
import { APP_CONFIG } from '../config/app'

const SocialLinks = () => {
  const socialLinks = [
    {
      name: 'GitHub',
      icon: Github,
      url: APP_CONFIG.socialLinks.github,
      color: 'hover:text-gray-900'
    },
    {
      name: 'Instagram',
      icon: Instagram,
      url: APP_CONFIG.socialLinks.instagram,
      color: 'hover:text-pink-600'
    },
    {
      name: 'YouTube',
      icon: Youtube,
      url: APP_CONFIG.socialLinks.youtube,
      color: 'hover:text-red-600'
    },
    {
      name: 'Facebook',
      icon: Facebook,
      url: APP_CONFIG.socialLinks.facebook,
      color: 'hover:text-blue-600'
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      url: APP_CONFIG.socialLinks.linkedin,
      color: 'hover:text-blue-700'
    }
  ]

  return (
    <div className="flex items-center space-x-4">
      <span className="text-sm text-gray-600">Follow me:</span>
      {socialLinks.map((link) => {
        const Icon = link.icon
        return (
          <a
            key={link.name}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`text-gray-500 ${link.color} transition-colors duration-200`}
            title={link.name}
          >
            <Icon className="w-5 h-5" />
          </a>
        )
      })}
    </div>
  )
}

export default SocialLinks