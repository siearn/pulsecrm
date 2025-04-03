import { Users, BarChart3, Calendar, Mail, FileText, Layers } from "lucide-react"

export function FeaturesSection() {
  const features = [
    {
      icon: <Users className="h-10 w-10 text-primary" />,
      title: "Contact Management",
      description: "Organize and track all your customer information in one centralized database.",
    },
    {
      icon: <Layers className="h-10 w-10 text-primary" />,
      title: "Pipeline Management",
      description: "Visualize your sales process with customizable pipelines and deal tracking.",
    },
    {
      icon: <Calendar className="h-10 w-10 text-primary" />,
      title: "Task Management",
      description: "Never miss a follow-up with integrated task management and reminders.",
    },
    {
      icon: <BarChart3 className="h-10 w-10 text-primary" />,
      title: "Reporting & Analytics",
      description: "Gain insights with powerful reporting tools to optimize your sales process.",
    },
    {
      icon: <Mail className="h-10 w-10 text-primary" />,
      title: "Email Integration",
      description: "Send and track emails directly from the platform to streamline communication.",
    },
    {
      icon: <FileText className="h-10 w-10 text-primary" />,
      title: "Document Management",
      description: "Store and share important files and documents with your team and customers.",
    },
  ]

  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-50 dark:bg-gray-900">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
              Powerful Features for Growing Businesses
            </h2>
            <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
              Everything you need to manage your customer relationships effectively
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mt-12">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex flex-col items-center space-y-2 rounded-lg border p-6 bg-white dark:bg-gray-800"
            >
              {feature.icon}
              <h3 className="text-xl font-bold">{feature.title}</h3>
              <p className="text-center text-gray-500 dark:text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

