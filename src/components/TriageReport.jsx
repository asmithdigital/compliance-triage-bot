import { useState } from 'react'

const VERDICT_CONFIG = {
  pass: {
    icon: '✅',
    className: 'pass',
    title: 'Pass — looks good',
    summary: 'No significant compliance issues detected. This content appears suitable for publication, pending final legal review.',
  },
  fix: {
    icon: '⚠️',
    className: 'fix',
    title: 'Fix before publish',
    summary: 'Issues found that must be addressed before this content goes live. Review each item below and resolve before submitting to legal.',
  },
  escalate: {
    icon: '🚨',
    className: 'escalate',
    title: 'Mandatory escalation',
    summary: 'Serious compliance risks detected. Do not publish without legal sign-off. Escalate immediately.',
  },
}

function IssueCard({ issue }) {
  const [open, setOpen] = useState(false)

  const severityMap = {
    blocker: 'blocker',
    'fix-before-publish': 'warning',
    warning: 'warning',
    info: 'info',
  }
  const severity = severityMap[issue.severity] ?? 'info'

  const badgeLabels = {
    blocker: 'Blocker',
    warning: 'Fix before publish',
    info: 'Info',
  }

  return (
    <div className={`issue-card ${severity}`}>
      <div className="issue-header" onClick={() => setOpen(o => !o)}>
        <span className={`severity-badge ${severity}`}>{badgeLabels[severity]}</span>
        <span className="issue-title">{issue.title}</span>
        <span className={`issue-chevron ${open ? 'open' : ''}`}>▾</span>
      </div>

      {open && (
        <div className="issue-body">
          {issue.description && (
            <div className="issue-body-section">
              <div className="issue-body-label">What's the issue</div>
              <div className="issue-body-text">{issue.description}</div>
            </div>
          )}

          {issue.regulations?.length > 0 && (
            <div className="issue-body-section">
              <div className="issue-body-label">Relevant regulations</div>
              <div className="regulation-tags">
                {issue.regulations.map(r => (
                  <span key={r} className="reg-tag">{r}</span>
                ))}
              </div>
            </div>
          )}

          {issue.quote && (
            <div className="issue-body-section">
              <div className="issue-body-label">Verbatim from submission</div>
              <div className="issue-quote">"{issue.quote}"</div>
            </div>
          )}

          {issue.fix && (
            <div className="issue-body-section">
              <div className="issue-body-label">Suggested fix</div>
              <div className="issue-fix">{issue.fix}</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function TriageReport({ report, loading }) {
  if (loading) {
    return (
      <div className="report-empty">
        <div className="report-empty-icon">⏳</div>
        <p>Analysing content against Australian regulations…</p>
        <p style={{ fontSize: 12, marginTop: 4 }}>This may take a few seconds</p>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="report-empty">
        <div className="report-empty-icon">📋</div>
        <p>Fill in the form and click <strong>Run triage</strong> to check your content.</p>
        <p style={{ fontSize: 12, marginTop: 4 }}>Or click <strong>Load example</strong> to see a demo report.</p>
      </div>
    )
  }

  if (report.error) {
    return (
      <div className="report-empty">
        <div className="report-empty-icon">❌</div>
        <p style={{ color: 'var(--color-red)' }}><strong>Error:</strong> {report.error}</p>
      </div>
    )
  }

  const verdict = VERDICT_CONFIG[report.verdict] ?? VERDICT_CONFIG.fix
  const issues = report.issues ?? []
  const blockers = issues.filter(i => i.severity === 'blocker')
  const warnings = issues.filter(i => i.severity === 'fix-before-publish' || i.severity === 'warning')
  const infos = issues.filter(i => i.severity === 'info')

  return (
    <>
      <div className={`verdict-banner ${verdict.className}`}>
        <div className="verdict-icon">{verdict.icon}</div>
        <div className="verdict-text">
          <h3>{verdict.title}</h3>
          <p>{report.summary ?? verdict.summary}</p>
        </div>
      </div>

      {issues.length > 0 && (
        <div className="issue-stats">
          {blockers.length > 0 && (
            <span className="stat-chip blocker">🔴 {blockers.length} blocker{blockers.length !== 1 ? 's' : ''}</span>
          )}
          {warnings.length > 0 && (
            <span className="stat-chip warning">🟡 {warnings.length} fix before publish</span>
          )}
          {infos.length > 0 && (
            <span className="stat-chip info">🔵 {infos.length} info</span>
          )}
        </div>
      )}

      <div className="issues-list">
        {issues.map((issue, i) => (
          <IssueCard key={i} issue={issue} />
        ))}
        {issues.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--color-text-muted)', fontSize: 14 }}>
            No issues found.
          </div>
        )}
      </div>
    </>
  )
}
