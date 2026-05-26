const SYSTEM_PROMPT = `You are a compliance triage bot for RAA (Royal Automobile Association of South Australia). Your role is to help UX and content designers identify potential compliance issues in their work before it is sent to legal for review.

Check submissions against these Australian regulations and codes:
- Australian Consumer Law (ACL) — misleading or deceptive conduct, unfair contract terms, unsolicited selling
- Privacy Act 1988 (Cth) — collection, use and disclosure of personal information, consent requirements, Australian Privacy Principles
- Spam Act 2003 (Cth) — consent for commercial electronic messages, unsubscribe mechanisms
- ASIC Regulatory Guide 234 (RG 234) — advertising financial products and services, balanced presentation, prominence of warnings
- General Insurance Code of Practice (GICOP) — clear and timely communication, claims handling, vulnerable customers
- AANA Code of Ethics — truthful advertising, community standards, responsible depictions
- WCAG 2.1 (AA) — web content accessibility guidelines for digital content
- ACCC guidance on dark patterns — drip pricing, hidden fees, pre-ticked boxes, confirmshaming, misdirection, roach motels

For each issue found, provide:
1. A short title (under 10 words)
2. Severity: "blocker" (legal show-stopper), "fix-before-publish" (significant risk), or "info" (minor/good practice)
3. A plain-language description of the issue
4. The specific regulation(s) breached or engaged
5. A verbatim quote from the submitted content (the exact words that trigger the issue)
6. A concrete suggested fix

Return your response as valid JSON matching this exact structure:
{
  "verdict": "pass" | "fix" | "escalate",
  "summary": "One sentence summary of the overall finding",
  "issues": [
    {
      "title": "Short issue title",
      "severity": "blocker" | "fix-before-publish" | "info",
      "description": "Plain-language explanation of why this is a problem",
      "regulations": ["ACL s18", "ACCC Dark Patterns 2023"],
      "quote": "Verbatim text from submission",
      "fix": "Specific, actionable suggestion"
    }
  ]
}

Be thorough but practical. Prioritise issues by severity. Do not invent issues that aren't supported by the submitted content.`

const FAKE_REPORT = {
  verdict: 'escalate',
  summary: '8 issues found including drip pricing, bundled consent, and pre-ticked add-ons — escalate to legal before proceeding.',
  issues: [
    {
      title: 'Drip pricing — full cost hidden until step 5',
      severity: 'blocker',
      description: 'The base premium of $89/month is prominently displayed from step 1, but the true total of $108.60/month (including pre-selected add-ons) is only revealed at step 4 during the review stage. This is a textbook example of drip pricing, which the ACCC considers a form of misleading conduct under the ACL. Customers form a price expectation based on incomplete information, then face a 22% higher final price.',
      regulations: ['ACL s18 (misleading or deceptive conduct)', 'ACL s29 (false representations about price)', 'ACCC Unfair Business Practices — Drip Pricing 2023'],
      quote: 'Base premium: $89/month … Monthly total: $108.60/month',
      fix: 'Display the full monthly total inclusive of all pre-selected add-ons from step 1 onward. If add-ons are to be shown separately, make them opt-in (unticked) and exclude them from any headline price.',
    },
    {
      title: 'Pre-ticked add-ons without clear disclosure',
      severity: 'blocker',
      description: 'Four paid add-ons totalling $19.60/month are pre-selected by default in step 3. Pre-selection of paid extras is a dark pattern explicitly called out in ACCC guidance as a mechanism that can constitute unfair dealing. Customers who do not notice or do not understand the add-on charges are effectively purchasing products they did not actively choose.',
      regulations: ['ACL s21 (unconscionable conduct)', 'ACCC Dark Patterns: Pre-selection 2023', 'GICOP clause 4.1 (clear communication)'],
      quote: '☑ Hire car after accident — $4.50/month\n☑ Windscreen & glass cover — $3.20/month\n☑ Roadside Assist — $6.80/month\n☑ No-claim bonus protection — $5.10/month',
      fix: 'Change all add-ons to opt-in (unticked). If RAA wishes to recommend add-ons, present them as suggestions with clear individual pricing, but require a positive action to select each one.',
    },
    {
      title: 'Bundled privacy and marketing consent',
      severity: 'blocker',
      description: 'Step 5 bundles agreement to the Privacy Policy with consent to receive marketing communications in a single checkbox. Under the Privacy Act, consent for marketing purposes must be freely given, specific, informed, and unambiguous — bundling it with mandatory policy acknowledgement fails this test. The ACMA also requires separate, express consent for commercial electronic messages under the Spam Act.',
      regulations: ['Privacy Act 1988 — APP 3.3 (solicited personal information)', 'Privacy Act 1988 — APP 7 (direct marketing)', 'Spam Act 2003 s6 (express consent)', 'ACMA Spam Act guidance 2022'],
      quote: '☑ I agree to the RAA Privacy Policy and consent to RAA contacting me about products, services and offers by email, SMS and phone.',
      fix: 'Separate into two distinct checkboxes: (1) mandatory acknowledgement of the Privacy Policy (unticked), and (2) separate opt-in for marketing communications. The marketing consent checkbox must default to unticked and must be entirely optional to complete the purchase.',
    },
    {
      title: 'Urgency claim may be artificial scarcity',
      severity: 'blocker',
      description: 'The 15-minute countdown timer on the review screen with a warning that "rates may change if you leave this page" creates a sense of artificial urgency. If this timer is not tied to a genuine system constraint (e.g. real-time rating volatility), it constitutes a false representation about the availability or price of services under the ACL. The ACCC has acted against companies using fabricated countdown timers.',
      regulations: ['ACL s29(1)(i) (false representation about price)', 'ACL s18 (misleading conduct)', 'ACCC: Countdown Timers and Urgency Tactics 2022'],
      quote: '⏰ This price is only available for the next 15 minutes. Rates may change if you leave this page.',
      fix: 'Remove or redesign the countdown timer. If a genuine session expiry exists for technical reasons, reframe it neutrally: "Your session will expire after 15 minutes of inactivity. You may need to re-enter your details." Do not imply that the price itself will change unless this is factually accurate and insurance-rated.',
    },
    {
      title: 'Marketing opt-out framed as opt-in (confirmshaming)',
      severity: 'fix-before-publish',
      description: "The marketing opt-out checkbox (\"I do not wish to receive marketing communications\") is unchecked by default, effectively making it an opt-in by inaction. Combined with the positively-worded bundled consent above it, customers must actively resist marketing contact rather than actively choosing it. This arrangement contradicts the Spam Act's express consent requirement for email and SMS.",
      regulations: ['Spam Act 2003 s6', 'Privacy Act 1988 — APP 7', 'ACMA Commercial Electronic Messages guide'],
      quote: '[ ] I do not wish to receive marketing communications. (opt-out, unchecked by default)',
      fix: 'Replace with a positive opt-in: "[ ] I would like to receive offers and updates from RAA by email and SMS." Default unchecked. Remove this checkbox once the bundled consent in the main checkbox is separated (see Issue 3).',
    },
    {
      title: 'Late disclosure of paper statement fee',
      severity: 'fix-before-publish',
      description: 'A $2.50 paper statement fee is disclosed only in the fine print at step 5, after the customer has committed to the purchase flow. This fee was not included in any earlier price communication. Burying fees in fine print at the point of payment is a form of drip pricing and may constitute a misleading omission about the total cost of the product.',
      regulations: ['ACL s18 (misleading by omission)', 'ACL s29 (false representation about price)', 'ACCC Drip Pricing guidance'],
      quote: 'A $2.50 paper statement fee applies if you request printed documents.',
      fix: 'Either include this fee in the total price calculation from step 1 (if it applies by default) or disclose it clearly and early in the flow as an optional cost. It must not appear for the first time at the payment screen.',
    },
    {
      title: 'Roy Morgan award attribution may be misleading',
      severity: 'fix-before-publish',
      description: "The claim ‘Australia’s most trusted motoring brand’ is attributed to Roy Morgan 2023, but the fine print clarifies this applies to the RAA brand overall, not specifically to Car Insurance. Applying a whole-of-brand trust award to a specific insurance product in a purchasing context may mislead consumers into believing the award relates to insurance quality or claims handling.",
      regulations: ['ACL s18 (misleading or deceptive conduct)', 'ACL s29(1)(e) (false representation about testimonials)', 'ASIC RG 234.47 (balanced representation)', 'AANA Code of Ethics s1 (truthful advertising)'],
      quote: "Australia’s most trusted motoring brand",
      fix: "Either remove the claim from the insurance purchase flow or add proximate disclosure: ‘RAA named Australia’s most trusted motoring brand (Roy Morgan, 2023) — this award relates to RAA’s overall brand.’ Ideally source or find a specific insurance-related endorsement if one exists.",
    },
    {
      title: 'Mileage slider default may skew premium',
      severity: 'fix-before-publish',
      description: 'The annual mileage slider defaults to 15,000 km. If customers do not adjust this value, their quoted premium will be based on an assumption that may not reflect their actual usage. If the default is set high (which increases risk and premium), this could lead to customers paying more than necessary. If set low, it could result in inaccurate risk rating. Either way, defaulting without disclosure raises ACL concerns.',
      regulations: ['ACL s18 (misleading omission)', 'GICOP clause 4.1 (clear communication)', 'ACL s29 (false representations about characteristics)'],
      quote: '[Slider: 5,000 km — 50,000 km, default set to 15,000 km]',
      fix: "Either require the user to actively select a mileage band (no default), or display a visible note: \"We've pre-filled 15,000 km — adjust this to match your actual annual driving distance, as it affects your premium.\"",
    },
    {
      title: 'Mileage slider accessibility — WCAG 2.1 AA',
      severity: 'info',
      description: 'Custom sliders are frequently inaccessible to keyboard and screen reader users. WCAG 2.1 AA requires form controls to be operable via keyboard (Success Criterion 2.1.1), have accessible names (SC 4.1.2), and provide sufficient contrast and visual focus indicators (SC 1.4.11, 2.4.7). A non-native slider component must be tested with VoiceOver (iOS/macOS) and TalkBack (Android).',
      regulations: ['WCAG 2.1 SC 2.1.1 (Keyboard)', 'WCAG 2.1 SC 4.1.2 (Name, Role, Value)', 'WCAG 2.1 SC 2.4.7 (Focus Visible)', 'Disability Discrimination Act 1992 (Cth)'],
      quote: '[Slider: 5,000 km — 50,000 km, default set to 15,000 km]',
      fix: 'Test the slider with a screen reader before launch. Ensure it has an accessible role="slider" with aria-valuemin, aria-valuemax, aria-valuenow, and aria-valuetext. Provide a visible keyboard focus ring. Consider offering a fallback text input for the mileage value.',
    },
  ],
}

export async function runTriage(form, apiKey) {
  if (!apiKey || !apiKey.trim().startsWith('sk-ant-')) {
    await new Promise(r => setTimeout(r, 1800))
    return FAKE_REPORT
  }

  const userMessage = buildUserMessage(form)

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey.trim(),
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.error?.message ?? `API error ${response.status}`)
  }

  const data = await response.json()
  const text = data.content?.[0]?.text ?? ''

  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Could not parse response from API.')

  return JSON.parse(jsonMatch[0])
}

function buildUserMessage(form) {
  const parts = []
  parts.push(`Project: ${form.title}`)
  if (form.contentType) parts.push(`Content type: ${form.contentType}`)
  if (form.audience) parts.push(`Audience: ${form.audience}`)
  if (form.product) parts.push(`Product: ${form.product}`)

  if (form.claims?.trim()) {
    parts.push(`\nClaims and substantiation:\n${form.claims}`)
  }

  if (form.riskMode === 'manual') {
    const flagged = Object.entries(form.riskFlags)
      .filter(([, v]) => v)
      .map(([k]) => k)
    if (flagged.length > 0) {
      parts.push(`\nManually flagged risks: ${flagged.join(', ')}`)
    }
  } else {
    parts.push(`\nRisk detection: auto-detect all risks`)
  }

  if (form.uxContext?.trim()) {
    parts.push(`\nUX context / hidden mechanics:\n${form.uxContext}`)
  }

  if (form.content?.trim()) {
    parts.push(`\nContent to analyse:\n---\n${form.content}\n---`)
  }

  return parts.join('\n')
}
