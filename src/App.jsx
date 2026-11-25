import { useState } from 'react'
import { Download, Play } from 'lucide-react'
import Alert from './components/Alert'
import FollowNotification from './components/FollowNotification'
import MediaPanel from './components/MediaPanel'
import SocialLinks from './components/SocialLinks'
import { useDownload } from './hooks/useDownload'
import { useMediaInfo } from './hooks/useMediaInfo'
import { useServerHealth } from './hooks/useServerHealth'

const TABS = [
  { id: 'download', label: 'Download', Icon: Download },
  { id: 'preview', label: 'Preview', Icon: Play }
]

function App() {
  const [activeTab, setActiveTab] = useState('download')
  const [selectedFormat, setSelectedFormat] = useState('')
  const media = useMediaInfo()
  const download = useDownload()
  const health = useServerHealth()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Video Downloader</h1>
              <p className="text-gray-600 mt-1">Download and preview videos from YouTube, Facebook, Instagram and more</p>
            </div>
            <div className="hidden md:block">
              <SocialLinks />
            </div>
          </div>
          <div className="md:hidden mt-4">
            <SocialLinks />
          </div>
        </div>
      </header>

      <nav className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex space-x-8" role="tablist">
            {TABS.map(({ id, label, Icon }) => (
              <button
                key={id}
                role="tab"
                aria-selected={activeTab === id}
                onClick={() => setActiveTab(id)}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4 inline mr-2" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {health.checked && !health.reachable && (
          <Alert variant="error">The backend server is not reachable. Start it with <code>npm run dev</code> inside <code>server/</code>.</Alert>
        )}
        {health.checked && health.reachable && !health.ok && (
          <Alert variant="error">yt-dlp is not installed on the server. Install it with <code>pip3 install yt-dlp</code> and restart the backend.</Alert>
        )}
        {health.checked && health.ok && !health.ffmpeg && (
          <Alert variant="warning">ffmpeg is not installed on the server, so only progressive (pre-merged) formats are offered. Install ffmpeg to unlock higher resolutions.</Alert>
        )}

        <MediaPanel
          mode={activeTab}
          media={media}
          download={download}
          selectedFormat={selectedFormat}
          onSelectFormat={setSelectedFormat}
        />
      </main>

      <FollowNotification />
    </div>
  )
}

export default App
