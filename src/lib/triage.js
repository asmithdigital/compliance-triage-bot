const SYSTEM_PROMPT = `You are a compliance triage bot for RAA (Royal Automobile Association of South Australia). Your role is to help UX and content designers identify potential compliance issues before work goes to legal.

You have three audiences reading your output:
1. Designers — they want to know what to fix and whether they can fix it themselves
2. Content people — they need to understand why something is a problem, in plain English
3. Legal — they need regulation codes and technical detail

Check submissions against these Australian regulations:
- Australian Consumer Law (ACL) — misleading conduct, drip pricing, unfair terms, false representations
- Privacy Act 1988 (Cth) — Australian Privacy Principles, consent, direct marketing
- Spam Act 2003 (Cth) — express consent for commercial electronic messages
- ASIC Regulatory Guide 234 (RG 234) — advertising financial products and services
- General Insurance Code of Practice (GICOP) — clear communication with customers
- AANA Code of Ethics — truthful advertising
- WCAG 2.1 (AA) — web accessibility for digital content
- ACCC guidance on dark patterns — drip pricing, pre-ticked boxes, urgency tactics, confirmshaming

Return valid JSON matching this exact structure:
{
  "verdict": "pass" | "fix" | "escalate",
  "summary": "One plain-language sentence summarising the overall finding — no regulation codes",
  "issues": [
    {
      "headline": "Plain-language headline — written like a designer explaining it to another designer. No regulation codes, no legal jargon. Under 10 words.",
      "plainExplanation": "One sentence in everyday language explaining what the problem is. Specific — mention the actual content.",
      "severity": "blocker" | "fix-before-publish" | "info",
      "actionTag": "fix_yourself" | "legal_decision" | "info",
      "suggestedFix": "One plain-language sentence. What should change? Be specific and actionable.",
      "whyItMatters": "2-3 sentences explaining why this is a problem, written for someone with no legal background. Use analogies where helpful. Explain the real-world consequence for a customer.",
      "verbatimQuote": "The exact words from the submitted content that triggered this issue.",
      "legalReferences": [
        {
          "code": "ACL s18",
          "plainTranslation": "the law that says you can't mislead people",
          "detail": "Full technical detail for legal review — what this provision covers and how it applies here."
        }
      ]
    }
  ]
}

actionTag guidance:
- "fix_yourself": a designer or developer can make this change without a legal decision (e.g. untick a checkbox, rewrite a sentence, add a disclosure)
- "legal_decision": the fix requires a legal or strategic decision, not just an execution change (e.g. restructuring a consent flow, assessing whether a claim is defensible)
- "info": informational only, no urgent action required

Be thorough but practical. Sort issues by severity (blockers first). Do not invent issues not supported by the content.`

const FAKE_REPORT = {
  verdict: 'escalate',
  summary: '9 issues found — 4 need a legal decision before you proceed, 5 you can start fixing right now.',
  issues: [
    {
      headline: 'The price changes between screens',
      plainExplanation: "Customers see $89/month from step 1, but the real total is $108.60 — 22% more — and they don't find out until step 4.",
      severity: 'blocker',
      actionTag: 'legal_decision',
      suggestedFix: "Talk to legal about restructuring — either show the full total from step 1, or make all add-ons opt-in.",
      whyItMatters: "Australian Consumer Law says the price you advertise has to be the price people actually pay. When pre-ticked extras push the total up later, it's like a restaurant adding a service charge you didn't agree to. The ACCC has taken companies to court for exactly this — they call it 'drip pricing' and it's one of their top enforcement priorities right now.",
      verbatimQuote: 'Base premium: $89.00/month … Monthly total: $108.60/month',
      legalReferences: [
        {
          code: 'ACL s18',
          plainTranslation: "the law that says you can't mislead people",
          detail: 'Australian Consumer Law section 18 prohibits misleading or deceptive conduct in trade or commerce. Showing a lower price upfront than the actual total constitutes misleading conduct by omission.',
        },
        {
          code: 'ACL s29(1)(i)',
          plainTranslation: "the rule against making false statements about price",
          detail: 'Section 29 prohibits false or misleading representations about price. Advertising $89/month when the effective price (including pre-selected add-ons) is $108.60 may constitute a false representation.',
        },
        {
          code: 'ACCC Drip Pricing Guidance 2023',
          plainTranslation: "the government's position on prices that grow as you check out",
          detail: "The ACCC's position paper on drip pricing identifies incremental price disclosure as a core dark pattern. Mandatory and pre-selected extras must be included in the headline price.",
        },
      ],
    },
    {
      headline: 'Add-ons are pre-ticked and cost real money',
      plainExplanation: "Four paid extras totalling $19.60/month are checked by default — customers have to actively remove them or they'll be charged.",
      severity: 'blocker',
      actionTag: 'fix_yourself',
      suggestedFix: "Uncheck all add-ons by default. You can still recommend them — just don't tick them for the customer.",
      whyItMatters: "Pre-selecting paid options is a well-known dark pattern. The ACCC specifically calls this out as a way of getting people to buy things they didn't choose. Research shows most people on mobile don't notice pre-selected checkboxes — so 'you can remove them' doesn't fix the underlying problem.",
      verbatimQuote: '☑ Hire car after accident — $4.50/month\n☑ Windscreen & glass cover — $3.20/month\n☑ Roadside Assist — $6.80/month\n☑ No-claim bonus protection — $5.10/month',
      legalReferences: [
        {
          code: 'ACL s21',
          plainTranslation: "the law against unconscionable conduct",
          detail: 'Section 21 of the ACL prohibits unconscionable conduct in trade or commerce. Pre-selecting paid add-ons without explicit customer consent may constitute unconscionable conduct, particularly for customers with low digital literacy.',
        },
        {
          code: 'ACCC Dark Patterns: Pre-selection 2023',
          plainTranslation: "the government's guidance on pre-ticked boxes",
          detail: "The ACCC's dark patterns guidance explicitly identifies pre-selection of paid options as a problematic pattern that can amount to misleading or deceptive conduct.",
        },
        {
          code: 'GICOP clause 4.1',
          plainTranslation: "the insurance industry rule about being clear with customers",
          detail: 'The General Insurance Code of Practice clause 4.1 requires clear, timely and effective communication about products. Pre-selecting paid add-ons without prominence fails this standard.',
        },
      ],
    },
    {
      headline: 'Privacy policy and marketing consent are the same checkbox',
      plainExplanation: "Customers can't agree to the Privacy Policy without also saying yes to marketing emails, SMS and calls.",
      severity: 'blocker',
      actionTag: 'legal_decision',
      suggestedFix: "Split into two checkboxes: one required (Privacy Policy) and one optional (marketing contact) — legal needs to approve the wording.",
      whyItMatters: "The Privacy Act says marketing consent has to be given freely and separately — you can't bundle it with something people have no choice about. Think of it like a gym making you agree to junk mail as part of signing the membership contract. The Spam Act also requires people to actively opt in to commercial messages — silence and inaction don't count.",
      verbatimQuote: '☑ I agree to the RAA Privacy Policy and consent to RAA contacting me about products, services and offers by email, SMS and phone.',
      legalReferences: [
        {
          code: 'Privacy Act 1988 — APP 3.3',
          plainTranslation: "the rule about collecting personal information fairly",
          detail: 'Australian Privacy Principle 3.3 requires that consent to collect and use personal information is voluntary, informed, current and specific. Bundling marketing consent with mandatory policy acknowledgement fails the voluntary and specific requirements.',
        },
        {
          code: 'Privacy Act 1988 — APP 7',
          plainTranslation: "the rule about using someone's info for marketing",
          detail: "APP 7 requires express consent for direct marketing. Consent obtained by bundling with a mandatory checkbox may not satisfy the 'express' consent standard.",
        },
        {
          code: 'Spam Act 2003 s6',
          plainTranslation: "the rule about getting permission before sending emails or texts",
          detail: 'Section 6 of the Spam Act requires express consent before sending commercial electronic messages. Express consent requires a positive, voluntary act by the individual — pre-ticked or bundled consent does not qualify.',
        },
      ],
    },
    {
      headline: "The countdown timer may not be telling the truth",
      plainExplanation: "A 15-minute timer warns that the price will change if customers leave the page — if that's not actually how the system works, this is illegal.",
      severity: 'blocker',
      actionTag: 'legal_decision',
      suggestedFix: "Legal and tech need to confirm whether the price actually changes on session expiry — if not, remove the timer or reframe it as a neutral session timeout.",
      whyItMatters: "Creating fake urgency — like a countdown that doesn't actually change anything — is prohibited under Australian Consumer Law. It's the online equivalent of a salesperson saying 'this price expires tonight' when it doesn't. The ACCC has fined travel companies and retailers specifically for fake countdown timers, and they're actively looking for this pattern in insurance.",
      verbatimQuote: '⏰ This price is only available for the next 15 minutes. Rates may change if you leave this page.',
      legalReferences: [
        {
          code: 'ACL s18',
          plainTranslation: "the law that says you can't mislead people",
          detail: 'Representing that a price will change within a specific time period when it will not constitutes misleading conduct under s18.',
        },
        {
          code: 'ACL s29(1)(i)',
          plainTranslation: "the rule against making false statements about price",
          detail: 'A false representation that the price is only available for a limited time is a breach of section 29(1)(i). The ACCC has pursued this in the travel and accommodation sectors.',
        },
        {
          code: 'ACCC Countdown Timers Guidance 2022',
          plainTranslation: "the government's specific position on fake urgency timers",
          detail: 'The ACCC has published guidance identifying countdown timers that do not reflect genuine availability constraints as a misleading dark pattern. Enforcement action has followed in multiple sectors.',
        },
      ],
    },
    {
      headline: 'The marketing opt-out is the wrong way around',
      plainExplanation: "Customers who do nothing will receive marketing — they have to actively tick a box to opt out, which is the opposite of how consent is supposed to work.",
      severity: 'fix-before-publish',
      actionTag: 'fix_yourself',
      suggestedFix: "Flip it: 'Yes, I'd like to receive offers from RAA by email and SMS' — leave it unticked.",
      whyItMatters: "The Spam Act requires that people actively choose to receive marketing messages — doing nothing shouldn't mean 'yes'. If you also fix the bundled consent checkbox (Issue 3 above), this checkbox may become redundant entirely. Either way, any standalone marketing option must be opt-in, not opt-out.",
      verbatimQuote: '[ ] I do not wish to receive marketing communications. (opt-out, unchecked by default)',
      legalReferences: [
        {
          code: 'Spam Act 2003 s6',
          plainTranslation: "the rule about getting permission before sending emails or texts",
          detail: "Express consent under the Spam Act requires a positive act by the individual. An unchecked opt-out does not constitute express consent — inaction cannot equal permission.",
        },
        {
          code: 'Privacy Act 1988 — APP 7',
          plainTranslation: "the rule about using someone's info for marketing",
          detail: 'Direct marketing use of personal information requires express consent. An opt-out mechanism does not satisfy the express consent requirement.',
        },
        {
          code: 'ACMA Commercial Electronic Messages guide',
          plainTranslation: "the regulator's plain-English guide to consent for emails and texts",
          detail: "The ACMA's guidance states consent must be 'clearly voluntary, specific, informed and unambiguous' — an opt-out checkbox fails on all four criteria.",
        },
      ],
    },
    {
      headline: 'A fee appears for the first time at the payment screen',
      plainExplanation: "A $2.50 paper statement fee is buried in fine print at step 5 — customers only see it after entering all their personal details.",
      severity: 'fix-before-publish',
      actionTag: 'fix_yourself',
      suggestedFix: "Add 'Optional: paper statements $2.50/request' to the pricing breakdown in step 1, or make it a visible toggle on the product page.",
      whyItMatters: "Revealing fees at the end of a buying process is another form of drip pricing. By step 5, people have already invested significant time and are much less likely to walk away over a small charge — and that's exactly what makes it manipulative. The fee doesn't need to be prominent, it just needs to appear before customers commit.",
      verbatimQuote: 'A $2.50 paper statement fee applies if you request printed documents.',
      legalReferences: [
        {
          code: 'ACL s18',
          plainTranslation: "the law that says you can't mislead people",
          detail: 'Omitting a fee from pricing communications until the final step of a purchase flow may constitute misleading conduct by omission under s18.',
        },
        {
          code: 'ACL s29',
          plainTranslation: "the rule against making false statements about price",
          detail: 'Section 29 prohibits false representations about the total price of goods and services. Disclosing ancillary fees only in fine print at the point of payment may breach this provision.',
        },
        {
          code: 'ACCC Drip Pricing guidance',
          plainTranslation: "the government's position on prices that grow as you check out",
          detail: "The ACCC's drip pricing guidance requires that all mandatory and reasonably foreseeable fees be disclosed from the outset. Late disclosure of the paper statement fee — even though it is technically optional — creates a pattern consistent with drip pricing.",
        },
      ],
    },
    {
      headline: "The 'most trusted' award doesn't cover insurance",
      plainExplanation: "The fine print says the Roy Morgan award is for the RAA brand overall — but it appears on an insurance purchase screen, implying the award is about insurance quality.",
      severity: 'fix-before-publish',
      actionTag: 'legal_decision',
      suggestedFix: "Add a footnote near the claim: 'Roy Morgan award relates to the RAA brand overall, not specifically to Car Insurance' — legal needs to sign off the wording.",
      whyItMatters: "Using an award to imply something it doesn't actually cover is misleading under Australian Consumer Law. ASIC is particularly strict about this for insurance products — a 'most trusted' claim with the wrong scope could be read as implying superior claims handling or pricing, when the award was for something else entirely.",
      verbatimQuote: "Australia's most trusted motoring brand",
      legalReferences: [
        {
          code: 'ACL s18',
          plainTranslation: "the law that says you can't mislead people",
          detail: "Applying an award to a specific product when it applies to the organisation broadly may constitute misleading conduct if consumers are likely to interpret it as product-specific.",
        },
        {
          code: 'ACL s29(1)(e)',
          plainTranslation: "the rule against misusing testimonials and endorsements",
          detail: 'Section 29(1)(e) prohibits false representations about testimonials, endorsements or approval. An award used outside its scope of application may breach this provision.',
        },
        {
          code: 'ASIC RG 234.47',
          plainTranslation: "ASIC's rules for advertising financial products",
          detail: "ASIC's Regulatory Guide 234 requires that claims in financial product advertising be balanced, substantiated and not misleading. Awards and endorsements must accurately represent their scope.",
        },
        {
          code: 'AANA Code of Ethics s1',
          plainTranslation: "the advertising industry's truth-in-advertising rule",
          detail: 'Section 1 of the AANA Code of Ethics requires advertising to be honest and truthful. An award claim misapplied to a product category may breach this standard.',
        },
      ],
    },
    {
      headline: 'The distance slider has a silent default that affects the price',
      plainExplanation: "The mileage slider starts at 15,000 km — customers who don't adjust it get a quote based on a distance that may not match how they actually drive.",
      severity: 'fix-before-publish',
      actionTag: 'fix_yourself',
      suggestedFix: "Add a note under the slider: 'We've started you at 15,000 km — adjust this to match your actual driving, as it affects your premium.'",
      whyItMatters: "Insurance premiums have to be based on accurate information. If customers don't realise the slider affects their price, they may get an inaccurate quote without knowing it — which could cause disputes at claim time. The Insurance Code requires clear communication about the factors that affect pricing.",
      verbatimQuote: '[Slider: 5,000 km — 50,000 km, default set to 15,000 km]',
      legalReferences: [
        {
          code: 'ACL s18',
          plainTranslation: "the law that says you can't mislead people",
          detail: 'Presenting a pre-filled value without making clear it is a default that affects pricing may constitute a misleading omission under s18.',
        },
        {
          code: 'GICOP clause 4.1',
          plainTranslation: "the insurance industry rule about being clear with customers",
          detail: 'GICOP clause 4.1 requires clear, effective communication about the information that affects a customer\'s product and premium. A silent default mileage value conflicts with this standard.',
        },
        {
          code: 'ACL s29',
          plainTranslation: "the rule against making false statements about price",
          detail: 'If the default value results in a quoted premium that does not accurately reflect the customer\'s circumstances, this could be characterised as a false representation about the characteristics of the service.',
        },
      ],
    },
    {
      headline: 'The distance slider may be unusable for some customers',
      plainExplanation: "Custom sliders often can't be operated by keyboard users or people using screen readers, which cuts off customers with disabilities.",
      severity: 'info',
      actionTag: 'fix_yourself',
      suggestedFix: "Test the slider with VoiceOver (Mac or iPhone) before launch, and confirm it works with keyboard-only navigation.",
      whyItMatters: "Roughly 1 in 6 Australians has some form of disability, and accessibility standards require that all interactive controls work without a mouse. Beyond the legal requirements, a broken slider creates a real barrier for real customers — and it's one of the first things WCAG auditors check. It's almost always a quick fix for the dev team.",
      verbatimQuote: '[Slider: 5,000 km — 50,000 km, default set to 15,000 km]',
      legalReferences: [
        {
          code: 'WCAG 2.1 SC 2.1.1',
          plainTranslation: "the rule that all controls must be keyboard accessible",
          detail: 'WCAG 2.1 Success Criterion 2.1.1 (Keyboard) requires all functionality to be operable through a keyboard interface. A custom slider that is not keyboard-accessible fails at Level A.',
        },
        {
          code: 'WCAG 2.1 SC 4.1.2',
          plainTranslation: "the rule that interactive elements must have accessible names and roles",
          detail: 'SC 4.1.2 (Name, Role, Value) requires that custom UI components expose their name, role and value to assistive technologies via ARIA attributes (role="slider", aria-valuemin, aria-valuemax, aria-valuenow, aria-valuetext).',
        },
        {
          code: 'Disability Discrimination Act 1992 (Cth)',
          plainTranslation: "the federal law that applies to digital accessibility",
          detail: 'The DDA applies to online services. While WCAG 2.1 AA is the benchmark for accessibility, the DDA can apply even where specific technical standards are not prescribed. AHRC has confirmed that inaccessible digital products can constitute discrimination.',
        },
      ],
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
      max_tokens: 8096,
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
