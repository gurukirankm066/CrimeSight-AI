import * as React from "react";
import { QueryErrorResetBoundary } from "@tanstack/react-query";

type Props = { children: React.ReactNode };
type State = { error: Error | null };

class InnerBoundary extends React.Component<Props & { reset: () => void }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("CrimeSight ErrorBoundary caught:", error, info);
  }

  handleRetry = () => {
    this.props.reset();
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
          <div className="max-w-md text-center">
            <h1 className="text-xl font-semibold tracking-tight text-on-surface">
              System anomaly detected
            </h1>
            <p className="mt-2 text-sm text-on-surface-variant">
              The intelligence stream couldn&apos;t load. Retry or return to command.
            </p>
            <pre className="mt-4 max-h-32 overflow-auto rounded-md border border-white/10 bg-surface-container/60 p-3 text-left text-[11px] text-on-surface-variant">
              {this.state.error.message}
            </pre>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <button
                onClick={this.handleRetry}
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-bold uppercase tracking-wider text-on-primary"
              >
                Retry
              </button>
              <a
                href="/"
                className="inline-flex items-center justify-center rounded-md border border-white/10 bg-transparent px-4 py-2 text-sm font-medium text-on-surface"
              >
                Command
              </a>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export function ErrorBoundary({ children }: Props) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => <InnerBoundary reset={reset}>{children}</InnerBoundary>}
    </QueryErrorResetBoundary>
  );
}
