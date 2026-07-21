import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl p-8 space-y-6">
          <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
          <p className="text-sm text-gray-500">Last updated: July 2026</p>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">1. Acceptance of Terms</h2>
            <p className="text-gray-600 leading-relaxed">
              By accessing or using the Enterprise Resource Planning system (&quot;ERP&quot;), you agree to be bound by these Terms of Service. If you do not agree, you may not use the service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">2. Description of Service</h2>
            <p className="text-gray-600 leading-relaxed">
              ERP provides organizations with tools for managing inventory, orders, customers, vendors, procurement, and related business operations.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">3. User Responsibilities</h2>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Maintain the confidentiality of your account credentials</li>
              <li>Provide accurate and complete information during registration</li>
              <li>Use the service in compliance with all applicable laws</li>
              <li>Not misuse or attempt to disrupt the service</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">4. Data Privacy</h2>
            <p className="text-gray-600 leading-relaxed">
              Your use of the service is governed by our Privacy Policy. By using ERP, you consent to the collection and use of your data as described therein.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">5. Limitation of Liability</h2>
            <p className="text-gray-600 leading-relaxed">
              ERP is provided &quot;as is&quot; without warranties of any kind. We are not liable for any damages arising from your use of the service.
            </p>
          </section>

          <div className="pt-4 border-t border-gray-100">
            <Link href="/auth/register" className="text-blue-600 hover:underline text-sm">
              &larr; Back to Registration
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
