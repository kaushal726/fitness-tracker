import { Component, type ErrorInfo, type ReactNode } from "react";
import styles from "./ErrorBoundary.module.css";

interface State {
  error: Error | null;
}

/**
 * The last guard: a screen that failed to draw shows what went wrong and a way back, instead of a blank page. The
 * data is safe on the phone either way. The error text is there so it can be passed on.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("The app could not draw this screen", error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <main className={styles.screen} role="alert">
        <h1 className={styles.title}>Something went wrong</h1>
        <p className={styles.text}>Your data is safe on this phone. Reload to try again.</p>
        <button type="button" className={styles.reload} onClick={() => window.location.reload()}>Reload</button>
        <pre className={styles.detail}>{`${error.name}: ${error.message}\n${error.stack ?? ""}`.slice(0, 1200)}</pre>
      </main>
    );
  }
}
