"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Check } from "lucide-react"
import Link from "next/link"

export function PricingSection() {
  const [billingAnnually, setBillingAnnually] = useState(true)

  const plans = [
    {
      name: "Starter",
      description: "Perfect for small teams just getting started",
      priceMonthly: 29,
      priceAnnually: 24,
      features: [
        "Up to 5 team members",
        "1,000 contacts",
        "Basic pipeline management",
        "Email integration",
        "Standard support",
      ],
      cta: "Start Free Trial",
      popular: false,
    },
    {
      name: "Pro",
      description: "Ideal for growing businesses with active sales teams",
      priceMonthly: 79,
      priceAnnually: 69,
      features: [
        "Up to 20 team members",
        "10,000 contacts",
        "Advanced pipeline management",
        "Email & calendar integration",
        "Custom reporting",
        "API access",
        "Priority support",
      ],
      cta: "Start Free Trial",
      popular: true,
    },
    {
      name: "Enterprise",
      description: "For large organizations with complex requirements",
      priceMonthly: 199,
      priceAnnually: 179,
      features: [
        "Unlimited team members",
        "Unlimited contacts",
        "Advanced security features",
        "Dedicated account manager",
        "Custom integrations",
        "Advanced analytics",
        "24/7 premium support",
      ],
      cta: "Contact Sales",
      popular: false,
    },
  ]

  return (
    <section id="pricing" className="w-full py-12 md:py-24 lg:py-32 bg-gray-50 dark:bg-gray-900">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Simple, Transparent Pricing</h2>
            <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
              Choose the plan that works best for your business
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`text-sm ${!billingAnnually ? "font-medium" : ""}`}>Monthly</span>
            <Switch checked={billingAnnually} onCheckedChange={setBillingAnnually} aria-label="Toggle annual billing" />
            <span className={`text-sm ${billingAnnually ? "font-medium" : ""}`}>
              Annually <span className="text-green-500 font-medium">(Save 15%)</span>
            </span>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mt-12">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`flex flex-col rounded-lg border p-6 ${
                plan.popular
                  ? "border-primary shadow-lg bg-white dark:bg-gray-800 relative"
                  : "bg-white dark:bg-gray-800"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-0 right-0 flex justify-center">
                  <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">{plan.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{plan.description}</p>
              </div>
              <div className="mt-6 space-y-2">
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold">
                    ${billingAnnually ? plan.priceAnnually : plan.priceMonthly}
                  </span>
                  <span className="ml-1 text-gray-500 dark:text-gray-400">/user/month</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {billingAnnually ? "Billed annually" : "Billed monthly"}
                </p>
              </div>
              <ul className="mt-6 space-y-2 flex-1">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <Link href={plan.name === "Enterprise" ? "/contact" : "/signup"}>
                  <Button className="w-full" variant={plan.popular ? "default" : "outline"}>
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
          All plans include a 14-day free trial. No credit card required.
        </div>
      </div>
    </section>
  )
}

