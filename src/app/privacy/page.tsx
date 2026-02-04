import { Layout } from "@/components/layout"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Price Lens Privacy Policy",
}

export default function PrivacyPage() {
  return (
    <Layout>
      <div className="container mx-auto flex w-full max-w-4xl flex-col items-center px-4 py-12">
        <div className="prose dark:prose-invert mb-16">
          <h1>Privacy Policy</h1>
          <p>
            Your privacy is important to us. It is Price Lens&apos; policy to respect your privacy regarding any
            information we may collect from you across our website.
          </p>

          <h2>1. Information We Collect</h2>
          <p>
            We only ask for personal information when we truly need it to provide a service to you. We collect it by
            fair and lawful means, with your knowledge and consent. We also let you know why we’re collecting it and how
            it will be used.
          </p>
          <p>
            The only personal information we collect is via your authentication provider (e.g., Google) when you sign
            up. This includes your email address, name, and profile picture. We do not collect any other personal data.
          </p>

          <h2>2. How We Use Your Information</h2>
          <p>
            We use the collected information to create and manage your account, and to provide you with access to our
            services. We do not sell or share your personal information with third parties, except as required by law.
          </p>

          <h2>3. Data Storage and Security</h2>
          <p>
            We only retain collected information for as long as necessary to provide you with your requested service.
            What data we store, we’ll protect within commercially acceptable means to prevent loss and theft, as well as
            unauthorized access, disclosure, copying, use or modification.
          </p>
          <p>
            Our website may link to external sites that are not operated by us. Please be aware that we have no control
            over the content and practices of these sites, and cannot accept responsibility or liability for their
            respective privacy policies.
          </p>

          <h2>4. Your Rights</h2>
          <p>
            You are free to refuse our request for your personal information, with the understanding that we may be
            unable to provide you with some of your desired services.
          </p>

          <h2>5. Contact Us</h2>
          <p>
            If you have any questions about how we handle user data and personal information, feel free to contact us.
          </p>
        </div>
      </div>
    </Layout>
  )
}
