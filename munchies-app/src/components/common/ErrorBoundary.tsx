/**
 * @module components/common/ErrorBoundary
 * @description Application-level error boundary. In production, suppresses all internal
 * stack traces, database schema/table names, and local file paths, presenting users
 * with a clean, localized, and friendly recovery UI.
 */

import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Suppress stack trace in production console/user view
    if (import.meta.env.PROD) {
      // In production: only log high-level classification, never internal path details
      console.error('[Production ErrorBoundary] An unexpected error occurred.');
    } else {
      console.error('[Dev ErrorBoundary Caught Error]:', error, errorInfo);
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      const isProduction = import.meta.env.PROD;

      return (
        <div
          dir="rtl"
          className="min-h-screen bg-[#FDFCFE] flex items-center justify-center p-4 font-sans"
        >
          <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-border shadow-xl text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-black text-dark">
                عذراً، حدث خطأ غير متوقع
              </h1>
              <p className="text-sm text-gray-500 leading-relaxed">
                نعتذر عن هذا الخطأ المؤقت. بياناتك بأمان ويقوم فريقنا بمتابعة النظام. يرجى إعادة المحاولة أو العودة للصفحة الرئيسية.
              </p>
            </div>

            {/* Development-only collapsible details */}
            {!isProduction && this.state.error && (
              <details className="text-left bg-gray-50 p-3 rounded-xl border border-gray-200 text-xs font-mono text-red-700 overflow-x-auto max-h-48">
                <summary className="cursor-pointer font-bold mb-1 text-gray-700">
                  تفاصيل المطور (وضع التطوير فقط)
                </summary>
                <p className="font-semibold">{this.state.error.message}</p>
                <pre className="mt-2 text-[10px] whitespace-pre-wrap">
                  {this.state.error.stack}
                </pre>
              </details>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#512080] text-white font-bold hover:bg-[#43176d] active:scale-95 transition-all shadow-md shadow-[#512080]/15"
              >
                <RefreshCw className="w-4 h-4" />
                <span>إعادة المحاولة</span>
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 active:scale-95 transition-all"
              >
                <Home className="w-4 h-4" />
                <span>الرئيسية</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

