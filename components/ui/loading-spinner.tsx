import { Loader2 } from "lucide-react"

interface LoadingSpinnerProps {
  size?: number
  className?: string
}

export function LoadingSpinner({ size = 24, className = "" }: LoadingSpinnerProps) {
  return <Loader2 className={`animate-spin text-blue-600 dark:text-blue-400 ${className}`} size={size} />
}

