// src/components/ErrorBoundary.jsx — React 에러 바운더리
import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          backgroundColor: "var(--color-bg, #f8fafc)",
          fontFamily: "var(--font-family, 'Pretendard Variable', sans-serif)",
        }}>
          <div style={{
            maxWidth: 400,
            width: "100%",
            textAlign: "center",
            padding: 32,
            borderRadius: 16,
            backgroundColor: "var(--color-bg-card, #fff)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
          }}>
            <div style={{ fontSize: "3rem", marginBottom: 16 }}>😵</div>
            <h1 style={{
              fontSize: "1.25rem",
              fontWeight: 700,
              color: "var(--color-text-primary, #1e293b)",
              marginBottom: 8,
            }}>
              앗, 문제가 발생했어요
            </h1>
            <p style={{
              fontSize: "0.9rem",
              color: "var(--color-text-secondary, #64748b)",
              marginBottom: 24,
              lineHeight: 1.5,
            }}>
              화면을 다시 불러오면 대부분 해결됩니다.<br />
              계속 발생하면 관리자에게 문의해 주세요.
            </p>

            {/* 에러 메시지 (접이식) */}
            {this.state.error && (
              <details style={{
                textAlign: "left",
                marginBottom: 20,
                padding: "8px 12px",
                borderRadius: 8,
                backgroundColor: "var(--color-bg-secondary, #f1f5f9)",
                fontSize: "0.75rem",
                color: "var(--color-text-tertiary, #94a3b8)",
              }}>
                <summary style={{ cursor: "pointer", fontWeight: 600 }}>
                  오류 상세
                </summary>
                <pre style={{
                  marginTop: 8,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-all",
                  fontFamily: "monospace",
                }}>
                  {this.state.error.message || String(this.state.error)}
                  {this.state.errorInfo?.componentStack && (
                    "\n\nComponent Stack:" + this.state.errorInfo.componentStack
                  )}
                </pre>
              </details>
            )}

            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              <button
                onClick={this.handleReload}
                className="btn btn--primary"
                style={{ flex: 1 }}
              >
                🔄 새로고침
              </button>
              <button
                onClick={() => { sessionStorage.clear(); window.location.reload(); }}
                className="btn btn--secondary"
                style={{ flex: 1 }}
              >
                👤 계정 전환
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
