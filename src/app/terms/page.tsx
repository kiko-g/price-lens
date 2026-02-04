import { Layout } from "@/components/layout"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Price Lens Terms of Service",
}

export default function TermsPage() {
  return (
    <Layout>
      <div className="container mx-auto flex w-full max-w-4xl flex-col items-center px-4 py-12">
        <div className="prose dark:prose-invert mb-16">
          <h1>Terms of Service</h1>
          <p>
            By accessing the website at Price Lens, you are agreeing to be bound by these terms of service, all
            applicable laws and regulations, and agree that you are responsible for compliance with any applicable local
            laws.
          </p>

          <h2>1. Use License</h2>
          <p>
            Permission is granted to temporarily download one copy of the materials (information or software) on Price
            Lens&apos; website for personal, non-commercial transitory viewing only. This is the grant of a license, not
            a transfer of title, and under this license you may not:
          </p>
          <ul>
            <li>modify or copy the materials;</li>
            <li>
              use the materials for any commercial purpose, or for any public display (commercial or non-commercial);
            </li>
            <li>attempt to decompile or reverse engineer any software contained on Price Lens&apos; website;</li>
            <li>remove any copyright or other proprietary notations from the materials; or</li>
            <li>transfer the materials to another person or &quot;mirror&quot; the materials on any other server.</li>
          </ul>
          <p>
            This license shall automatically terminate if you violate any of these restrictions and may be terminated by
            Price Lens&apos; at any time.
          </p>

          <h2>2. Disclaimer</h2>
          <p>
            The materials on Price Lens&apos; website are provided on an &apos;as is&apos; basis. Price Lens makes no
            warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without
            limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or
            non-infringement of intellectual property or other violation of rights.
          </p>

          <h2>3. Limitations</h2>
          <p>
            In no event shall Price Lens&apos; or its suppliers be liable for any damages (including, without
            limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or
            inability to use the materials on Price Lens&apos; website, even if Price Lens&apos; or a Price Lens&apos;
            authorized representative has been notified orally or in writing of the possibility of such damage.&apos;
          </p>

          <h2>4. Governing Law</h2>
          <p>
            These terms and conditions are governed by and construed in accordance with the laws of Portugal and you
            irrevocably submit to the exclusive jurisdiction of the courts in that State or location.
          </p>
        </div>
      </div>
    </Layout>
  )
}
