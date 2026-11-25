import { Github, Instagram, Youtube, Facebook, Linkedin } from 'lucide-react'
import { APP_CONFIG } from './app'

const { socialLinks } = APP_CONFIG

export const SOCIAL_LINKS = [
  { name: 'GitHub', icon: Github, url: socialLinks.github, color: 'text-gray-700', hover: 'hover:text-gray-900' },
  { name: 'Instagram', icon: Instagram, url: socialLinks.instagram, color: 'text-pink-600', hover: 'hover:text-pink-600' },
  { name: 'YouTube', icon: Youtube, url: socialLinks.youtube, color: 'text-red-600', hover: 'hover:text-red-600' },
  { name: 'Facebook', icon: Facebook, url: socialLinks.facebook, color: 'text-blue-600', hover: 'hover:text-blue-600' },
  { name: 'LinkedIn', icon: Linkedin, url: socialLinks.linkedin, color: 'text-blue-700', hover: 'hover:text-blue-700' }
]
