import { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.log("App crashed:", error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="app-shell">
        <div className="panel">
          <p className="section-heading">Something went wrong</p>
          <p className="no-data-msg">The app hit an unexpected error. Your tracked flights are safe.</p>
          <button className="track-button" onClick={() => window.location.reload()}>Reload</button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;