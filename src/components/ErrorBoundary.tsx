import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, background: "#fee2e2", color: "#991b1b", margin: 20, borderRadius: 8, border: "1px solid #ef4444" }}>
          <h2 style={{ fontSize: 20, fontWeight: "bold", marginBottom: 10 }}>Bir hata oluştu (React Crash)</h2>
          <pre style={{ whiteSpace: "pre-wrap", background: "#fef2f2", padding: 10, borderRadius: 4, fontFamily: "monospace" }}>
            {this.state.error?.toString()}
          </pre>
          <details style={{ marginTop: 10 }}>
            <summary style={{ cursor: "pointer", fontWeight: "bold" }}>Stack Trace (Genişlet)</summary>
            <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, marginTop: 10 }}>
              {this.state.errorInfo?.componentStack}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}
