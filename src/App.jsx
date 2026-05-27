import { useState } from 'react'
import TriageForm from './components/TriageForm'
import TriageReport from './components/TriageReport'
import { runTriage } from './lib/triage'

const INITIAL_FORM = {
  title: '',
  contentType: '',
  audience: '',
  product: '',
  claims: '',
  riskMode: 'auto',
  riskFlags: {},
  uxContext: '',
  content: '',
}

export default function App() {
  const [form, setForm] = useState(INITIAL_FORM)
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleRunTriage() {
    setLoading(true)
    setReport(null)
    try {
      const result = await runTriage(form)
      setReport(result)
    } catch (err) {
      setReport({ error: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <header className="app-header">
        <div className="header-icon">⚖️</div>
        <div className="header-text">
          <h1>RAA Compliance Triage Bot</h1>
          <p>Check your content against Australian regulations before sending to legal</p>
        </div>
      </header>

      <main className="app-main">
        <div className="panel panel-form">
          <div className="panel-header">
            <h2>Content details</h2>
            <span className="panel-header-meta">* Required to run triage</span>
          </div>
          <div className="panel-body">
            <TriageForm
              form={form}
              setForm={setForm}
              onRun={handleRunTriage}
              loading={loading}
            />
          </div>
        </div>

        <div className="panel panel-report">
          <div className="panel-header">
            <h2>Triage report</h2>
            {report && !report.error && (
              <span className="panel-header-meta">
                {report.issues?.length ?? 0} issue{report.issues?.length !== 1 ? 's' : ''} found
              </span>
            )}
          </div>
          <div className="panel-report-scroll">
            <TriageReport report={report} loading={loading} />
          </div>
        </div>
      </main>

      <footer className="app-footer">
        Not legal advice. Final approval requires sign-off by an admitted Australian legal practitioner.
      </footer>
    </>
  )
}
