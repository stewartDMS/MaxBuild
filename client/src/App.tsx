import './App.css'

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Welcome to MaxBuild</h1>
        <p className="tagline">AI-Powered Tender Automation System</p>
      </header>
      <main className="app-main">
        <section className="intro">
          <h2>Streamline Your Tendering Process</h2>
          <p>
            MaxBuild uses advanced AI to automatically extract Bill of Quantities (BOQ) 
            from tender documents, saving you time and reducing errors.
          </p>
        </section>
        <section className="features">
          <h3>Key Features</h3>
          <ul>
            <li>📄 Automatic PDF processing and text extraction</li>
            <li>🤖 AI-powered BOQ generation using GPT-4</li>
            <li>📊 Structured, validated output for seamless integration</li>
            <li>💾 Secure database storage with PostgreSQL</li>
          </ul>
        </section>
      </main>
      <footer className="app-footer">
        <p>Built with React, TypeScript, and Vite</p>
      </footer>
    </div>
  )
}

export default App
