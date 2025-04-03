"use client"

import React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { logger } from "@/lib/logger"

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function ErrorBoundary({ children, fallback }: ErrorBoundaryProps) {
  const [hasError, setHasError] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [errorInfo, setErrorInfo] = useState<React.ErrorInfo | null>(null)

  useEffect(() => {
    const errorHandler = (error: ErrorEvent) => {
      logger.error({
        message: "Global error caught",
        error: error.error.message,
        stack: error.error.stack,
      })
      setError(error.error)
      setHasError(true)
    }

    const rejectionHandler = (event: PromiseRejectionEvent) => {
      logger.error({
        message: "Unhandled promise rejection",
        reason: event.reason,
      })
      setError(new Error(event.reason?.message || "Promise rejected"))
      setHasError(true)
    }

    window.addEventListener("error", errorHandler)
    window.addEventListener("unhandledrejection", rejectionHandler)

    return () => {
      window.removeEventListener("error", errorHandler)
      window.removeEventListener("unhandledrejection", rejectionHandler)
    }
  }, [])

  const handleReset = () => {
    setHasError(false)
    setError(null)
    setErrorInfo(null)
  }

  if (hasError) {
    // If a custom fallback is provided, use it
    if (fallback) {
      return <>{fallback}</>
    }

    // Default error UI
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg dark:bg-gray-800">
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full dark:bg-red-900/20">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-500" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-center">Something went wrong</h3>
          <p className="mb-4 text-sm text-center text-gray-500 dark:text-gray-400">
            We encountered an unexpected error. Our team has been notified.
          </p>
          {error && (
            <div className="p-2 mb-4 overflow-auto text-xs bg-gray-100 rounded dark:bg-gray-900 max-h-32">
              <code>{error.message || "Unknown error"}</code>
            </div>
          )}
          <div className="flex gap-2">
            <Button className="w-full" onClick={() => window.location.reload()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Reload Page
            </Button>
            <Button variant="outline" className="w-full" onClick={handleReset}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

// Class component for catching errors in the component tree
export class ErrorBoundaryClass extends React.Component<
  ErrorBoundaryProps,
  { hasError: boolean; error: Error | null; errorInfo: React.ErrorInfo | null }
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo })
    logger.error({
      message: "Component error caught",
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg dark:bg-gray-800">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full dark:bg-red-900/20">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-500" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-center">Component Error</h3>
            <p className="mb-4 text-sm text-center text-gray-500 dark:text-gray-400">
              An error occurred in a component. Our team has been notified.
            </p>
            {this.state.error && (
              <div className="p-2 mb-4 overflow-auto text-xs bg-gray-100 rounded dark:bg-gray-900 max-h-32">
                <code>{this.state.error.message || "Unknown error"}</code>
              </div>
            )}
            <Button className="w-full" onClick={() => window.location.reload()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Reload Page
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

