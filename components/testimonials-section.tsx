import Image from "next/image"

export function TestimonialsSection() {
  const testimonials = [
    {
      quote:
        "PulseCRM has transformed how we manage our sales pipeline. The intuitive interface and powerful features have helped us close 30% more deals.",
      author: "Sarah Johnson",
      role: "Sales Director, TechCorp",
      avatar: "/placeholder.svg?height=80&width=80",
    },
    {
      quote:
        "The team management features are exceptional. We can easily assign leads and track performance across our entire sales organization.",
      author: "Michael Chen",
      role: "VP of Sales, GrowthCo",
      avatar: "/placeholder.svg?height=80&width=80",
    },
    {
      quote:
        "After trying several CRM solutions, PulseCRM is the only one that perfectly balances power and ease of use. Our team adopted it immediately.",
      author: "Jessica Williams",
      role: "CEO, StartupX",
      avatar: "/placeholder.svg?height=80&width=80",
    },
  ]

  return (
    <section className="w-full py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Trusted by Growing Businesses</h2>
            <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
              See what our customers have to say about PulseCRM
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mt-12">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="flex flex-col items-center space-y-4 rounded-lg border p-6 bg-white dark:bg-gray-800"
            >
              <div className="relative h-20 w-20 rounded-full overflow-hidden">
                <Image
                  src={testimonial.avatar || "/placeholder.svg"}
                  alt={testimonial.author}
                  fill
                  className="object-cover"
                />
              </div>
              <p className="text-center text-gray-500 dark:text-gray-400 italic">"{testimonial.quote}"</p>
              <div className="text-center">
                <h4 className="font-semibold">{testimonial.author}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">{testimonial.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

