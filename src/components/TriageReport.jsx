import { useState } from 'react'

const VERDICT_CONFIG = {
  pass: {
    icon: '✅',
    className: 'pass',
    title: 'Looks good to go',
  },
  fix: {
    icon: '⚠️',
    className: 'fix',
    title: 'Fix before publish',
  },
  escalate: {
    icon: '🛡️',
    className: 'escalate',
    title: 'Stop — escalate to legal',
  },
}

const ACTION_TAG_CONFIG = {
  fix_yourself: { label: 'You need to fix this', className: 'action-fix' },
  legal_decision: { label: 'Legal needs to decide', className: 'action-legal' },
  info: { label: 'Good to know', className: 'action-info' },
}

const GROUPS = [
  {
    key: 'fix_yourself',
    label: 'Things you can fix yourself',
    className: 'group-fix',
  },
  {
    key: 'legal_decision',
    label: 'Things legal needs to decide',
    className: 'group-legal',
  },
  {
    key: 'info',
    label: 'Good to know',
    className: 'group-info',
  },
]

const SEVERITY_MAP = {
  blocker: 'blocker',
  'fix-before-publish': 'warning',
  warning: 'warning',
  info: 'info',
}

const SEVERITY_LABELS = {
  blocker: 'Blocker',
  warning: 'Fix first',
  info: 'Heads up',
}

function ExpandSection({ label, children }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="expand-section">
      <button
        type="button"
        className={`expand-toggle ${open ? 'open' : ''}`}
        onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
        aria-expanded={open}
      >
        <span className="expand-toggle-label">{label}</span>
        <span className="expand-chevron" aria-hidden="true">›</span>
      </button>
      <div className={`expand-content ${open ? 'open' : ''}`} aria-hidden={!open}>
        <div className="expand-content-inner">
          {children}
        </div>
      </div>
    </div>
  )
}

function IssueCard({ issue }) {
  const [expanded, setExpanded] = useState(false)
  const severity = SEVERITY_MAP[issue.severity] ?? 'info'
  const actionConfig = ACTION_TAG_CONFIG[issue.actionTag] ?? ACTION_TAG_CONFIG.info

  const hasExpandedContent = issue.suggestedFix || issue.whyItMatters || issue.verbatimQuote || issue.legalReferences?.length > 0

  return (
    <div className={`issue-card ${severity} ${expanded ? 'is-expanded' : ''}`}>
      {/* Collapsed header — always visible, click to expand */}
      <div
        className="issue-card-header"
        onClick={() => setExpanded(e => !e)}
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setExpanded(o => !o)}
      >
        <div className="issue-card-header-row">
          <span className={`severity-badge ${severity}`}>{SEVERITY_LABELS[severity]}</span>
          <h3 className="issue-headline">{issue.headline}</h3>
          {hasExpandedContent && (
            <span className={`card-chevron ${expanded ? 'open' : ''}`} aria-hidden="true">›</span>
          )}
        </div>
        <p className="issue-plain-explanation">{issue.plainExplanation}</p>
      </div>

      {/* Expanded body */}
      {hasExpandedContent && (
        <div className={`expand-content ${expanded ? 'open' : ''}`} aria-hidden={!expanded}>
          <div className="expand-content-inner">
            <div className="issue-expanded-body">
              {/* Action tag + fix */}
              <div className="issue-expanded-top">
                <span className={`action-tag ${actionConfig.className}`}>{actionConfig.label}</span>
                {issue.suggestedFix && (
                  <div className="issue-fix-inline">
                    <span className="issue-fix-prefix">Fix:</span> {issue.suggestedFix}
                  </div>
                )}
              </div>

              {/* Layer 2 + 3 */}
              {(issue.whyItMatters || issue.verbatimQuote || issue.legalReferences?.length > 0) && (
                <div className="issue-layers">
                  {(issue.whyItMatters || issue.verbatimQuote) && (
                    <ExpandSection label="Why this matters">
                      <div className="layer2-content">
                        {issue.whyItMatters && (
                          <p className="layer2-text">{issue.whyItMatters}</p>
                        )}
                        {issue.verbatimQuote && (
                          <div className="issue-quote-block">
                            <div className="issue-quote-label">Exact wording that triggered this</div>
                            <blockquote className="issue-quote">{issue.verbatimQuote}</blockquote>
                          </div>
                        )}
                      </div>
                    </ExpandSection>
                  )}

                  {issue.legalReferences?.length > 0 && (
                    <ExpandSection label="Legal detail">
                      <div className="layer3-content">
                        {issue.legalReferences.map((ref, i) => (
                          <div key={i} className="legal-ref">
                            <div className="legal-ref-top">
                              <span className="legal-code">{ref.code}</span>
                              {ref.plainTranslation && (
                                <span className="legal-plain"> — {ref.plainTranslation}</span>
                              )}
                            </div>
                            {ref.detail && (
                              <p className="legal-detail">{ref.detail}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </ExpandSection>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function buildSummaryLine(issues) {
  const fixYourself = issues.filter(i => i.actionTag === 'fix_yourself').length
  const legalNeeded = issues.filter(i => i.actionTag === 'legal_decision').length
  const infoOnly = issues.filter(i => i.actionTag === 'info').length

  const parts = []
  if (legalNeeded > 0) parts.push(`${legalNeeded} need${legalNeeded === 1 ? 's' : ''} a legal decision`)
  if (fixYourself > 0) parts.push(`${fixYourself} you can fix yourself`)
  if (infoOnly > 0) parts.push(`${infoOnly} just a heads up`)

  if (parts.length === 0) return 'No issues found.'
  return `${issues.length} issue${issues.length !== 1 ? 's' : ''} found — ${parts.join(', ')}.`
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

  const grouped = {
    fix_yourself: issues.filter(i => i.actionTag === 'fix_yourself'),
    legal_decision: issues.filter(i => i.actionTag === 'legal_decision'),
    info: issues.filter(i => i.actionTag === 'info'),
  }

  const summaryLine = issues.length > 0
    ? buildSummaryLine(issues)
    : (report.summary ?? 'No significant issues found.')

  const hasActionLists = issues.length > 0

  return (
    <>
      {/* Verdict banner */}
      <div className={`verdict-banner ${verdict.className}`}>
        <div className="verdict-icon" aria-hidden="true">{verdict.icon}</div>
        <div className="verdict-body">
          <h3 className="verdict-title">{verdict.title}</h3>
          <p className="verdict-line">{summaryLine}</p>

          {hasActionLists && (
            <div className="verdict-action-lists">
              {grouped.legal_decision.length > 0 && (
                <div className="action-list action-list-legal">
                  <div className="action-list-heading">Things legal needs to decide</div>
                  <ul>
                    {grouped.legal_decision.map((issue, i) => (
                      <li key={i}>{issue.headline}</li>
                    ))}
                  </ul>
                </div>
              )}
              {grouped.fix_yourself.length > 0 && (
                <div className="action-list action-list-fix">
                  <div className="action-list-heading">Things you can fix yourself</div>
                  <ul>
                    {grouped.fix_yourself.map((issue, i) => (
                      <li key={i}>{issue.headline}</li>
                    ))}
                  </ul>
                </div>
              )}
              {grouped.info.length > 0 && (
                <div className="action-list action-list-info">
                  <div className="action-list-heading">Good to know</div>
                  <ul>
                    {grouped.info.map((issue, i) => (
                      <li key={i}>{issue.headline}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Grouped issues */}
      <div className="issues-body">
        {issues.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--color-text-muted)', fontSize: 14 }}>
            No issues found.
          </div>
        )}

        {GROUPS.filter(g => grouped[g.key]?.length > 0).map(group => (
          <div key={group.key} className={`issue-group ${group.className}`}>
            <div className="issue-group-heading">
              <span className="issue-group-label">{group.label}</span>
              <span className="issue-group-count">{grouped[group.key].length}</span>
            </div>
            <div className="issue-group-cards">
              {grouped[group.key].map((issue, i) => (
                <IssueCard key={i} issue={issue} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
