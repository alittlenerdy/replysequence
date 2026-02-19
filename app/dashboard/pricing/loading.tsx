/**
 * Pricing page loading skeleton - matches DashboardPricingPage layout
 * (centered hero text, 3 pricing cards side by side)
 */
export default function PricingLoading() {
  return (
    <div className="animate-pulse">
      {/* Hero section */}
      <section className="pb-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="h-10 w-64 bg-gray-700 light:bg-gray-200 rounded mx-auto mb-6" />
          <div className="h-5 w-96 max-w-full bg-gray-700/60 light:bg-gray-200 rounded mx-auto" />
        </div>
      </section>

      {/* Billing toggle */}
      <div className="flex justify-center mb-8">
        <div className="h-10 w-48 bg-gray-800/50 light:bg-gray-100 border border-gray-700 light:border-gray-200 rounded-lg" />
      </div>

      {/* Pricing cards - 3 column grid */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`bg-gray-900/50 light:bg-white border rounded-2xl p-6 ${
              i === 2
                ? 'border-blue-500/50 light:border-blue-400'
                : 'border-gray-700 light:border-gray-200'
            }`}
          >
            {/* Icon */}
            <div className="w-10 h-10 bg-gray-700 light:bg-gray-200 rounded-xl mb-4" />
            {/* Plan name */}
            <div className="h-6 w-16 bg-gray-700 light:bg-gray-200 rounded mb-1" />
            {/* Price */}
            <div className="h-10 w-20 bg-gray-700 light:bg-gray-200 rounded mb-2" />
            {/* Description */}
            <div className="h-4 w-full bg-gray-700/50 light:bg-gray-100 rounded mb-6" />
            {/* Features list */}
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((j) => (
                <div key={j} className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-700/50 light:bg-gray-200 rounded-full shrink-0" />
                  <div className="h-3 bg-gray-700/50 light:bg-gray-100 rounded" style={{ width: `${60 + j * 8}%` }} />
                </div>
              ))}
            </div>
            {/* CTA button */}
            <div className="h-11 w-full bg-gray-700 light:bg-gray-200 rounded-xl mt-6" />
          </div>
        ))}
      </div>
    </div>
  );
}
