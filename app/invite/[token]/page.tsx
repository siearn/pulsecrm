"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSignIn, useSignUp, useUser } from "@clerk/nextjs"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"

interface InviteDetails {
  email: string
  name?: string
  role: string
  companyName: string
  expires: string
}

export default function InvitePage({ params }: { params: { token: string } }) {
  const router = useRouter()
  const { token } = params
  const { isLoaded: isUserLoaded, isSignedIn, user } = useUser()
  const { isLoaded: isSignInLoaded, signIn, setActive } = useSignIn()
  const { isLoaded: isSignUpLoaded, signUp } = useSignUp()

  const [isLoading, setIsLoading] = useState(true)
  const [invite, setInvite] = useState<InviteDetails | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [processingAccept, setProcessingAccept] = useState(false)

  // Fetch the invite details
  useEffect(() => {
    async function fetchInvite() {
      try {
        const response = await fetch(`/api/invites/${token}`)

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.message || "Failed to fetch invitation")
        }

        const data = await response.json()
        setInvite(data.invite)
      } catch (error) {
        console.error("Error fetching invite:", error)
        setError(error instanceof Error ? error.message : "Failed to fetch invitation")
      } finally {
        setIsLoading(false)
      }
    }

    if (token) {
      fetchInvite()
    }
  }, [token])

  // Handle accepting the invite
  const handleAcceptInvite = async () => {
    if (!isUserLoaded || !invite) return

    setProcessingAccept(true)

    try {
      // If user is already signed in
      if (isSignedIn && user) {
        // Check if the user's email matches the invite
        const hasMatchingEmail = user.emailAddresses.some(
          (email) => email.emailAddress.toLowerCase() === invite.email.toLowerCase(),
        )

        if (!hasMatchingEmail) {
          toast({
            title: "Email mismatch",
            description: `This invitation was sent to ${invite.email}. Please sign in with that email address.`,
            variant: "destructive",
          })
          setProcessingAccept(false)
          return
        }

        // Accept the invite
        const response = await fetch(`/api/invites/${token}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user.id,
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.message || "Failed to accept invitation")
        }

        toast({
          title: "Invitation accepted",
          description: `You have successfully joined ${invite.companyName}.`,
        })

        // Reload the user to update metadata
        await user.reload()

        // Redirect to dashboard
        router.push("/dashboard")
      } else {
        // User is not signed in, show sign in/sign up options
        toast({
          title: "Please sign in",
          description: "You need to sign in or create an account to accept this invitation.",
        })

        // Redirect to sign-in page with the invite token as a parameter
        router.push(`/login?invite=${token}`)
      }
    } catch (error) {
      console.error("Error accepting invite:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to accept invitation",
        variant: "destructive",
      })
    } finally {
      setProcessingAccept(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error || !invite) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Invitation Error</CardTitle>
            <CardDescription className="text-center">
              {error || "This invitation is invalid or has expired."}
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button onClick={() => router.push("/")}>Return to Home</Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md shadow-soft">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">You're invited!</CardTitle>
          <CardDescription>Join {invite.companyName} on PulseCRM</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <span className="font-medium">Invitation details:</span>
            </p>
            <ul className="mt-2 space-y-1 text-sm text-blue-700 dark:text-blue-400">
              <li>Email: {invite.email}</li>
              <li>Company: {invite.companyName}</li>
              <li>Role: {invite.role.charAt(0) + invite.role.slice(1).toLowerCase()}</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button className="w-full" onClick={handleAcceptInvite} disabled={processingAccept}>
            {processingAccept && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSignedIn ? "Accept Invitation" : "Sign in to Accept"}
          </Button>

          {!isSignedIn && (
            <p className="text-sm text-center text-muted-foreground">
              Don't have an account yet? You'll be able to create one after clicking the button above.
            </p>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

