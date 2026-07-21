import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl p-8 space-y-6">
          <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
          <p className="text-sm text-gray-500">Last updated: July 2026</p>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">1. Information We Collect</h2>
            <p className="text-gray-600 leading-relaxed">
              We collect information you provide during registration including your name, email address, and organization details. We also collect usage data to improve our service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">2. How We Use Your Information</h2>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>To provide and maintain the ERP service</li>
              <li>To authenticate your access and secure your account</li>
              <li>To communicate important service updates</li>
              <li>To improve and personalize your experience</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">3. Data Security</h2>
            <p className="text-gray-600 leading-relaxed">
              We implement industry-standard security measures including encryption at rest and in transit, access controls, and regular security audits to protect your data.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">4. Data Retention</h2>
            <p className="text-gray-600 leading-relaxed">
              We retain your data for as long as your account is active. Upon account deletion, your data is permanently removed within 30 days.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">5. Contact</h2>
            <p className="text-gray-600 leading-relaxed">
              For questions about this policy, please contact your organization administrator.
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
