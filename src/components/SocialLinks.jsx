import { SOCIAL_LINKS } from '../config/socialLinks'

const SocialLinks = () => (
  <div className="flex items-center space-x-4">
    <span className="text-sm text-gray-600">Follow me:</span>
    {SOCIAL_LINKS.map(({ name, icon: Icon, url, hover }) => (
      <a
        key={name}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={`text-gray-500 ${hover} transition-colors duration-200`}
        title={name}
        aria-label={name}
      >
        <Icon className="w-5 h-5" />
      </a>
    ))}
  </div>
)

export default SocialLinks
