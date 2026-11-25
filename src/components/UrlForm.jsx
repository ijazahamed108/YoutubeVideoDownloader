import { Loader2, X } from 'lucide-react'

const UrlForm = ({
  label,
  value,
  onChange,
  onSubmit,
  onClear,
  loading,
  placeholder,
  buttonLabel,
  ButtonIcon
}) => {
  const handleSubmit = (e) => {
    e.preventDefault()
    if (!loading && value.trim()) onSubmit()
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor={`url-${label}`} className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            id={`url-${label}`}
            type="url"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2 pr-9 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {value && (
            <button
              type="button"
              onClick={onClear}
              aria-label="Clear URL"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          type="submit"
          disabled={loading || !value.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ButtonIcon className="w-4 h-4" />}
          {buttonLabel}
        </button>
      </div>
    </form>
  )
}

export default UrlForm
