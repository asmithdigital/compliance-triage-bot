import { DEMO_DATA } from '../lib/demoData'

const RISK_FLAGS = [
  { key: 'competitor', label: 'Does this mention a competitor?' },
  { key: 'superlatives', label: 'Does it use words like best, biggest, first, or only?' },
  { key: 'children', label: 'Is it aimed at or showing children?' },
  { key: 'prize', label: 'Is there a prize or competition?' },
  { key: 'newProduct', label: 'Is this a new product or a big change to an existing one?' },
  { key: 'regulator', label: 'Does it mention a regulator?' },
  { key: 'safetyStats', label: 'Does it include safety stats?' },
  { key: 'environmental', label: 'Does it make environmental or sustainability claims?' },
  { key: 'preTicked', label: 'Are any boxes pre-ticked for the user?' },
  { key: 'urgency', label: 'Does it create urgency or scarcity? (e.g. \'limited time\', \'expires soon\')' },
  { key: 'cancelFlow', label: 'Is there a cancel or unsubscribe flow?' },
  { key: 'hiddenFees', label: 'Are there fees that appear later in the process?' },
  { key: 'personalInfo', label: 'Does it collect personal information or ask for consent?' },
  { key: 'sponsored', label: 'Is this sponsored or influencer content?' },
]

export default function TriageForm({ form, setForm, apiKey, setApiKey, onRun, loading }) {
  function update(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function toggleFlag(key) {
    setForm(f => ({
      ...f,
      riskFlags: { ...f.riskFlags, [key]: !f.riskFlags[key] },
    }))
  }

  function loadDemo() {
    setForm(DEMO_DATA)
  }

  const canRun = form.title.trim() && form.content.trim()

  return (
    <form onSubmit={e => { e.preventDefault(); if (canRun) onRun() }}>

      {/* 1. Title */}
      <div className="form-group">
        <label className="form-label" htmlFor="title">What are you working on?</label>
        <span className="form-help">Give it a name, e.g. 'Quote flow redesign Q3' or 'Renewal reminder email'</span>
        <input
          id="title"
          type="text"
          className="form-input"
          value={form.title}
          onChange={e => update('title', e.target.value)}
          placeholder="e.g. Quote flow redesign Q3"
        />
      </div>

      {/* 2. Content type */}
      <div className="form-group">
        <label className="form-label" htmlFor="contentType">What type of content is this?</label>
        <span className="form-help">Pick the closest match</span>
        <select
          id="contentType"
          className="form-select"
          value={form.contentType}
          onChange={e => update('contentType', e.target.value)}
        >
          <option value="">— Select type —</option>
          <option value="Screen flow">Screen flow</option>
          <option value="Email">Email</option>
          <option value="Form">Form</option>
          <option value="Notification">Notification</option>
          <option value="Error message">Error message</option>
          <option value="Ad or promotion">Ad or promotion</option>
        </select>
      </div>

      {/* 3. Audience */}
      <div className="form-group">
        <label className="form-label" htmlFor="audience">Who's going to see this?</label>
        <span className="form-help">Who is the audience?</span>
        <select
          id="audience"
          className="form-select"
          value={form.audience}
          onChange={e => update('audience', e.target.value)}
        >
          <option value="">— Select audience —</option>
          <option value="Everyone">Everyone</option>
          <option value="Members only">Members only</option>
          <option value="A specific group">A specific group</option>
        </select>
      </div>

      {/* 4. Product */}
      <div className="form-group">
        <label className="form-label" htmlFor="product">Which RAA product?</label>
        <span className="form-help">e.g. Home Insurance, Car Insurance, Roadside Assist</span>
        <input
          id="product"
          type="text"
          className="form-input"
          value={form.product}
          onChange={e => update('product', e.target.value)}
          placeholder="e.g. RAA Comprehensive Car Insurance"
        />
      </div>

      {/* 5. Claims */}
      <div className="form-group">
        <label className="form-label" htmlFor="claims">Are you promising anything? What's the proof?</label>
        <span className="form-help">e.g. 'Save up to $500' — based on our pricing comparison from March. Leave blank if no claims.</span>
        <textarea
          id="claims"
          className="form-textarea"
          value={form.claims}
          onChange={e => update('claims', e.target.value)}
          placeholder="List any claims and the evidence behind them..."
        />
      </div>

      {/* 6. Risk flags */}
      <div className="form-group">
        <label className="form-label">Anything risky?</label>
        <div className="toggle-row">
          <div className="toggle-switch" role="group" aria-label="Risk detection mode">
            <span
              className={`toggle-option ${form.riskMode === 'auto' ? 'active' : ''}`}
              onClick={() => update('riskMode', 'auto')}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && update('riskMode', 'auto')}
            >
              Auto-detect
            </span>
            <span
              className={`toggle-option ${form.riskMode === 'manual' ? 'active' : ''}`}
              onClick={() => update('riskMode', 'manual')}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && update('riskMode', 'manual')}
            >
              I'll flag them myself
            </span>
          </div>
        </div>

        {form.riskMode === 'manual' && (
          <div className="risk-flags">
            {RISK_FLAGS.map(({ key, label }) => (
              <div key={key} className="risk-flag-item" onClick={() => toggleFlag(key)}>
                <input
                  type="checkbox"
                  id={`flag-${key}`}
                  checked={!!form.riskFlags[key]}
                  onChange={() => toggleFlag(key)}
                  onClick={e => e.stopPropagation()}
                />
                <label htmlFor={`flag-${key}`} onClick={e => e.preventDefault()}>{label}</label>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 7. UX context */}
      <div className="form-group">
        <label className="form-label" htmlFor="uxContext">Anything the customer wouldn't notice?</label>
        <span className="form-help">e.g. boxes already ticked, prices that change between steps, consent bundled with something else</span>
        <textarea
          id="uxContext"
          className="form-textarea"
          value={form.uxContext}
          onChange={e => update('uxContext', e.target.value)}
          placeholder="Describe any hidden mechanics or non-obvious UX patterns..."
        />
      </div>

      {/* 8. Content */}
      <div className="form-group">
        <label className="form-label" htmlFor="content">What exactly will the customer see?</label>
        <span className="form-help">Paste the words, buttons, and messages as they appear on screen</span>
        <textarea
          id="content"
          className="form-textarea large"
          value={form.content}
          onChange={e => update('content', e.target.value)}
          placeholder="Paste your content here..."
        />
      </div>

      {/* API key */}
      <div className="form-group">
        <label className="form-label" htmlFor="apiKey">Anthropic API key <span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>(optional)</span></label>
        <span className="form-help">Leave blank to see a demo report. Your key is never stored.</span>
        <input
          id="apiKey"
          type="password"
          className="form-input"
          value={apiKey}
          onChange={e => setApiKey(e.target.value)}
          placeholder="sk-ant-..."
          autoComplete="off"
        />
      </div>

      <div className="form-actions">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={!canRun || loading}
        >
          {loading ? (
            <>
              <span className="spinner" />
              Analysing…
            </>
          ) : (
            <>⚖️ Run triage</>
          )}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={loadDemo}
          disabled={loading}
          style={{ alignSelf: 'flex-start' }}
        >
          Load example
        </button>
      </div>
    </form>
  )
}
