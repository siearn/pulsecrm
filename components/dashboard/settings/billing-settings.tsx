"use client"

import { useState } from "react"
import { CreditCard, Package } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"

interface Company {
  id: string
  name: string
  planType: string
  maxSeats: number
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
  trialEndsAt: Date | null
}

interface BillingSettingsProps {
  company: Company
  isAdmin: boolean
}

const planDetails = {
  FREE_TRIAL: {
    name: "Free Trial",
    price: "$0",
    features: ["5 team members", "1,000 contacts", "Basic features"],
  },
  STARTER: {
    name: "Starter",
    price: "$29/month",
    features: ["5 team members", "1,000 contacts", "Basic features"],
  },
  PRO: {
    name: "Pro",
    price: "$79/month",
    features: ["20 team members", "10,000 contacts", "Advanced features", "Priority support"],
  },
  ENTERPRISE: {
    name: "Enterprise",
    price: "$199/month",
    features: ["Unlimited team members", "Unlimited contacts", "All features", "Dedicated support"],
  },
}

export function BillingSettings({ company, isAdmin }: BillingSettingsProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleManageBilling = async () => {
    if (!isAdmin) {
      toast({
        title: "Permission denied",
        description: "Only admins can manage billing.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Here you would make an API call to create a Stripe billing portal session
      // For now, we'll just simulate a successful redirect
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Redirecting to billing portal",
        description: "You will be redirected to the Stripe billing portal.",
      })
    } catch (error) {
      toast({
        title: "Error",\
        description: "Failed to redirect to billing portal.  {
      toast({
        title: "Error",
        description: "Failed to redirect to billing portal. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpgrade = async () => {
    if (!isAdmin) {
      toast({
        title: "Permission denied",
        description: "Only admins can upgrade the plan.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Here you would make an API call to create a Stripe checkout session
      // For now, we'll just simulate a successful redirect
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Redirecting to checkout",
        description: "You will be redirected to the payment page.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to redirect to checkout. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const plan = planDetails[company.planType as keyof typeof planDetails]

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Subscription Plan</CardTitle>
          <CardDescription>Manage your subscription and billing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Current Plan</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">{plan.name}</Badge>
                <span className="text-sm text-muted-foreground">{plan.price}</span>
              </div>
            </div>
            {company.planType === "FREE_TRIAL" && company.trialEndsAt && (
              <div className="text-sm text-muted-foreground">
                Trial ends on {new Date(company.trialEndsAt).toLocaleDateString()}
              </div>
            )}
          </div>
          <div>
            <h3 className="font-medium mb-2">Plan Features</h3>
            <ul className="space-y-1">
              {plan.features.map((feature, index) => (
                <li key={index} className="text-sm flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleManageBilling}
            disabled={isLoading || !isAdmin || !company.stripeCustomerId}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Manage Billing
          </Button>
          {company.planType !== "ENTERPRISE" && (
            <Button onClick={handleUpgrade} disabled={isLoading || !isAdmin}>
              Upgrade Plan
            </Button>
          )}
        </CardFooter>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
          <CardDescription>Manage your payment methods</CardDescription>
        </CardHeader>
        <CardContent>
          {company.stripeCustomerId ? (
            <div className="flex items-center gap-4">
              <CreditCard className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="font-medium">Credit Card</p>
                <p className="text-sm text-muted-foreground">Ending in •••• 4242</p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">No payment method on file.</p>
          )}
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={handleManageBilling} disabled={isLoading || !isAdmin}>
            {company.stripeCustomerId ? "Update" : "Add"} Payment Method
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

