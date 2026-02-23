import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[CodeCollab ErrorBoundary]', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: '#0a0a14', padding: '40px',
        textAlign: 'center',
      }}>
        {/* Error icon */}
        <div style={{
          width: '64px', height: '64px', borderRadius: '18px', marginBottom: '20px',
          background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '30px', boxShadow: '0 0 40px rgba(244,63,94,0.15)',
        }}>⚠️</div>

        <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#f43f5e', marginBottom: '10px' }}>
          Something went wrong
        </h2>
        <p style={{ color: 'rgba(226,232,240,0.5)', fontSize: '14px', maxWidth: '360px', lineHeight: 1.6, marginBottom: '28px' }}>
          {this.state.error?.message || 'An unexpected error occurred in this panel.'}
        </p>

        <button
          onClick={() => this.setState({ hasError: false, error: null })}
          style={{
            padding: '10px 24px', borderRadius: '10px', border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
            color: '#fff', fontWeight: '700', fontSize: '14px',
            boxShadow: '0 0 20px rgba(168,85,247,0.4)',
          }}
        >
          Try Again
        </button>
      </div>
    )
  }
}
