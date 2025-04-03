import Link from "next/link"
import { Button } from "@/components/ui/button"

export function HeroSection() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
      <div className="container px-4 md:px-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
          <div className="flex flex-col justify-center space-y-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                Streamline Your Customer Relationships
              </h1>
              <p className="max-w-[600px] text-gray-500 md:text-xl dark:text-gray-400">
                PulseCRM helps you manage leads, nurture relationships, and close more deals with our powerful yet
                intuitive platform.
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Link href="/signup">
                <Button size="lg" className="px-8">
                  Start Free Trial
                </Button>
              </Link>
              <Link href="/demo">
                <Button size="lg" variant="outline" className="px-8">
                  Request Demo
                </Button>
              </Link>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">No credit card required. 14-day free trial.</div>
          </div>
          <div className="flex items-center justify-center">
            <div className="relative w-full h-[350px] md:h-[400px] lg:h-[500px] rounded-lg overflow-hidden shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-indigo-500 opacity-90 rounded-lg"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-lg w-[80%] h-[80%] flex items-center justify-center">
                  <span className="text-lg font-medium">Dashboard Preview</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

