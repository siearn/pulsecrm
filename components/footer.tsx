import Link from "next/link"

export function Footer() {
  return (
    <footer className="w-full border-t bg-white dark:bg-gray-950">
      <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            © 2023 PulseCRM. All rights reserved.
          </p>
        </div>
        <div className="flex gap-4">
          <Link
            href="/terms"
            className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
          >
            Terms of Service
          </Link>
          <Link
            href="/privacy"
            className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
          >
            Privacy Policy
          </Link>
          <Link
            href="/contact"
            className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
          >
            Contact
          </Link>
        </div>
        <div className="flex gap-4">
          <Link
            href="https://twitter.com"
            className="text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400"
          >
            Twitter
          </Link>
          <Link
            href="https://linkedin.com"
            className="text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400"
          >
            LinkedIn
          </Link>
          <Link
            href="https://github.com"
            className="text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400"
          >
            GitHub
          </Link>
        </div>
      </div>
    </footer>
  )
}

