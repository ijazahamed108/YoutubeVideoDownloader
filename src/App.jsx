import { useState } from 'react'
import VideoDownloader from './components/VideoDownloader'
import MediaPlayer from './components/MediaPlayer'
import SocialLinks from './components/SocialLinks'
import FollowNotification from './components/FollowNotification'
import { Download, Play } from 'lucide-react'
import { APP_CONFIG } from './config/app'

function App() {
  const [activeTab, setActiveTab] = useState('download')

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Video Downloader</h1>
              <p className="text-gray-600 mt-1">Download and preview videos from YouTube, Facebook, Instagram</p>
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
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('download')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === 'download'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Download className="w-4 h-4 inline mr-2" />
              Download
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === 'preview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Play className="w-4 h-4 inline mr-2" />
              Preview
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {activeTab === 'download' && <VideoDownloader />}
        {activeTab === 'preview' && <MediaPlayer />}
      </main>
      
      <FollowNotification />
    </div>
  )
}

export default App