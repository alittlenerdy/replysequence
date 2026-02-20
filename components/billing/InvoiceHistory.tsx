'use client';

import {
  Receipt,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import type { BillingData, Invoice } from './billing-types';

const statusConfig: Record<string, { icon: typeof CheckCircle2; color: string; label: string }> = {
  paid: { icon: CheckCircle2, color: 'text-emerald-400', label: 'Paid' },
  open: { icon: Clock, color: 'text-amber-400', label: 'Open' },
  draft: { icon: Clock, color: 'text-gray-400', label: 'Draft' },
  void: { icon: AlertCircle, color: 'text-gray-400', label: 'Void' },
  uncollectible: { icon: AlertCircle, color: 'text-red-400', label: 'Failed' },
};

const defaultStatus = { icon: Clock, color: 'text-gray-400', label: 'Unknown' };

function formatPeriod(start: string | null, end: string | null): string | null {
  if (!start || !end) return null;
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(start)} - ${fmt(end)}`;
}

interface InvoiceHistoryProps {
  billing: BillingData;
  onScrollToPlans: () => void;
}

export function InvoiceHistory({ billing, onScrollToPlans }: InvoiceHistoryProps) {
  if (billing.invoices.length === 0) {
    return (
      <div className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Receipt className="w-5 h-5 text-gray-400 light:text-gray-500" />
          <h3 className="text-lg font-semibold text-white light:text-gray-900">Invoice History</h3>
        </div>
        <div className="text-center py-8">
          <div className="relative mx-auto w-16 h-16 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-700/50 to-gray-800/50 light:from-gray-100 light:to-gray-200 rounded-2xl flex items-center justify-center border border-gray-600/30 light:border-gray-300">
              <Receipt className="w-8 h-8 text-gray-500 light:text-gray-400" />
            </div>
          </div>
          <p className="text-gray-400 light:text-gray-500 text-sm">
            {billing.tier === 'free'
              ? 'Invoices will appear here once you upgrade to a paid plan.'
              : 'Your invoices will appear here after your first billing cycle.'}
          </p>
          {billing.tier === 'free' && (
            <button
              onClick={onScrollToPlans}
              className="inline-flex items-center gap-2 mt-3 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              View available plans
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Receipt className="w-5 h-5 text-gray-400 light:text-gray-500" />
        <h3 className="text-lg font-semibold text-white light:text-gray-900">Invoice History</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700 light:border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-400 light:text-gray-500">Date</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-400 light:text-gray-500 hidden sm:table-cell">Period</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-400 light:text-gray-500 hidden md:table-cell">Plan</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-400 light:text-gray-500">Amount</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-400 light:text-gray-500">Status</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-400 light:text-gray-500">PDF</th>
            </tr>
          </thead>
          <tbody>
            {billing.invoices.map((invoice) => {
              const status = statusConfig[invoice.status] || defaultStatus;
              const StatusIcon = status.icon;
              const period = formatPeriod(invoice.periodStart, invoice.periodEnd);

              return (
                <tr
                  key={invoice.id}
                  className="border-b border-gray-800 light:border-gray-100 last:border-0 hover:bg-gray-800/30 light:hover:bg-gray-50 transition-colors"
                >
                  <td className="py-4 px-4">
                    <span className="text-white light:text-gray-900 text-sm">
                      {new Date(invoice.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </td>
                  <td className="py-4 px-4 hidden sm:table-cell">
                    <span className="text-gray-400 light:text-gray-500 text-sm">
                      {period || '-'}
                    </span>
                  </td>
                  <td className="py-4 px-4 hidden md:table-cell">
                    <span className="text-gray-400 light:text-gray-500 text-sm truncate max-w-[200px] block">
                      {invoice.planName || '-'}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="font-semibold text-white light:text-gray-900 text-sm">
                      ${invoice.amount.toFixed(2)}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center gap-1.5 text-sm ${status.color}`}>
                      <StatusIcon className="w-4 h-4" />
                      {status.label}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    {(invoice.pdfUrl || invoice.invoiceUrl) && (
                      <a
                        href={invoice.pdfUrl || invoice.invoiceUrl!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">PDF</span>
                      </a>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
