"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="p-4 rounded-lg bg-destructive/10 text-destructive">
            <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
            <p className="text-sm">Please try refreshing the page</p>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
