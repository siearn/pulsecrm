import type { Metadata } from "next"
import { SignUp } from "@clerk/nextjs"
import Image from "next/image"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Sign Up | PulseCRM",
  description: "Create a new PulseCRM account",
}

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <Link href="/" className="inline-block">
              <h1 className="text-3xl font-bold text-blue-600">PulseCRM</h1>
            </Link>
          </div>
          <div className="w-full shadow-soft rounded-lg overflow-hidden">
            <SignUp
              appearance={{
                elements: {
                  rootBox: "mx-auto w-full",
                  card: "shadow-none p-0 border-0",
                  formButtonPrimary: "bg-blue-600 hover:bg-blue-700 text-white",
                },
              }}
              redirectUrl="/onboarding"
            />
          </div>
        </div>
      </div>

      {/* Right side - Image/Gradient */}
      <div className="hidden md:flex md:flex-1 gradient-bg items-center justify-center p-8">
        <div className="max-w-md text-white">
          <h2 className="text-3xl font-bold mb-4">Start Growing Your Business Today</h2>
          <p className="text-lg mb-6">
            Join thousands of businesses using PulseCRM to manage leads, nurture relationships, and close more deals.
          </p>
          <div className="rounded-lg overflow-hidden shadow-xl">
            <Image
              src="/placeholder.svg?height=300&width=500"
              alt="CRM Features"
              width={500}
              height={300}
              className="w-full h-auto"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

