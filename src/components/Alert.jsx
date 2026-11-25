import { AlertCircle, CheckCircle, Info } from 'lucide-react'

const VARIANTS = {
  error: { box: 'bg-red-50 border-red-200 text-red-700', Icon: AlertCircle },
  success: { box: 'bg-green-50 border-green-200 text-green-700', Icon: CheckCircle },
  info: { box: 'bg-blue-50 border-blue-200 text-blue-700', Icon: Info },
  warning: { box: 'bg-amber-50 border-amber-200 text-amber-800', Icon: AlertCircle }
}

const Alert = ({ variant = 'info', children, className = '' }) => {
  const { box, Icon } = VARIANTS[variant] || VARIANTS.info
  return (
    <div role={variant === 'error' ? 'alert' : 'status'} className={`flex items-start gap-2 p-3 border rounded-md text-sm ${box} ${className}`}>
      <Icon className="w-4 h-4 mt-0.5 shrink-0" />
      <div className="min-w-0 break-words">{children}</div>
    </div>
  )
}

export default Alert
