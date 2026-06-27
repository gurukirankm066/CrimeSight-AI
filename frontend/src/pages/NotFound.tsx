import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 pt-16">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-primary">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-on-surface">Page not found</h2>
        <p className="mt-2 text-sm text-on-surface-variant">
          The intelligence channel you requested doesn&apos;t exist.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-bold uppercase tracking-wider text-on-primary"
          >
            Return to Intelligence
          </Link>
        </div>
      </div>
    </div>
  );
}
