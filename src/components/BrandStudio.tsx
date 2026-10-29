import { useState, type FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { generateBrandTweets } from '@/lib/tweets.functions';
import type { BrandBriefInput, BrandTweetResult, BrandTweetStyle } from '@/lib/tweets.schema';
import { ArrowRight, Check, Copy, RefreshCw, Sparkles } from 'lucide-react';

type BriefErrors = Partial<Record<keyof BrandBriefInput, string>>;

const initialBrief: BrandBriefInput = {
  brand_name: '',
  industry: '',
  campaign_objective: '',
  products_services: '',
  preferred_tone: '',
};

const examples: Record<'Zomato' | 'Nike', BrandBriefInput> = {
  Zomato: {
    brand_name: 'Zomato',
    industry: 'Food delivery',
    campaign_objective: 'Build excitement for late-night delivery and remind people that good food is only a few taps away.',
    products_services: 'Restaurant discovery and on-demand food delivery, with a wide selection of local favourites.',
    preferred_tone: 'Playful, quick-witted, and delightfully relatable',
  },
  Nike: {
    brand_name: 'Nike',
    industry: 'Sportswear and athletic equipment',
    campaign_objective: 'Inspire everyday runners to show up for their next run and explore the new Pegasus collection.',
    products_services: 'Performance running shoes, apparel, and gear designed for athletes at every level.',
    preferred_tone: 'Confident, motivating, and direct',
  },
};

const styleLabels: Record<BrandTweetStyle, string> = {
  conversational: 'Conversational',
  promotional: 'Promotional',
  witty: 'Witty',
  informative: 'Informative',
};

function validateBrief(brief: BrandBriefInput): BriefErrors {
  const errors: BriefErrors = {};
  const fields: Array<[keyof BrandBriefInput, string, number]> = [
    ['brand_name', 'Brand name', 120],
    ['industry', 'Industry', 120],
    ['campaign_objective', 'Campaign objective', 500],
    ['products_services', 'Products or services', 1000],
  ];
  for (const [key, label, limit] of fields) {
    const value = brief[key]?.trim() ?? '';
    if (!value) errors[key] = `${label} is required.`;
    else if (value.length > limit) errors[key] = `Keep this to ${limit} characters or fewer.`;
  }
  if ((brief.preferred_tone?.length ?? 0) > 120) {
    errors.preferred_tone = 'Keep this to 120 characters or fewer.';
  }
  return errors;
}

export function BrandStudio() {
  const [brief, setBrief] = useState<BrandBriefInput>(initialBrief);
  const [errors, setErrors] = useState<BriefErrors>({});
  const [result, setResult] = useState<BrandTweetResult | null>(null);
  const [lastBrief, setLastBrief] = useState<BrandBriefInput | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const health = { isLoading: false, isError: false };
  const generateFn = useServerFn(generateBrandTweets);
  const generate = useMutation({
    mutationFn: (vars: { data: BrandBriefInput }) => generateFn(vars),
    onSuccess: (data: BrandTweetResult) => setResult(data),
  });

  const changeField = (key: keyof BrandBriefInput, value: string) => {
    setBrief((current) => ({ ...current, [key]: value }));
    if (errors[key]) setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const submitBrief = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateBrief(brief);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    const payload = {
      brand_name: brief.brand_name.trim(),
      industry: brief.industry.trim(),
      campaign_objective: brief.campaign_objective.trim(),
      products_services: brief.products_services.trim(),
      ...(brief.preferred_tone?.trim() ? { preferred_tone: brief.preferred_tone.trim() } : {}),
    };
    setLastBrief(payload);
    generate.mutate({ data: payload });
  };

  const regenerateTweets = () => {
    if (lastBrief) generate.mutate({ data: lastBrief });
  };

  const fillExample = (name: 'Zomato' | 'Nike') => {
    setBrief(examples[name]);
    setErrors({});
  };

  const copyTweet = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      window.setTimeout(() => setCopiedIndex((current) => current === index ? null : current), 1700);
    } catch {
      setCopiedIndex(null);
    }
  };

  const errorMessage = generate.error instanceof Error
    ? generate.error.message
    : 'Something went wrong while generating your tweets. Try again in a moment.';
  const tweets = result?.tweets.slice(0, 10) ?? [];

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand-lockup" href="/" aria-label="Brand voice home" data-testid="link-home">
          <span className="brand-mark" aria-hidden="true">b.</span>
          <span className="brand-name">brand voice</span>
        </a>
        <div className="topbar-note" data-testid="status-api">
          <span className={`health-dot${health.isError ? ' offline' : ''}`} aria-hidden="true" />
          {health.isLoading ? 'Checking studio' : health.isError ? 'Studio offline' : 'Studio ready'}
        </div>
      </header>

      <div className="page-wrap">
        <section className="intro" aria-labelledby="page-title">
          <div>
            <div className="eyebrow">A sharper voice, in ten posts</div>
            <h1 id="page-title">Your brand, in its <span>own words.</span></h1>
            <p className="intro-copy">
              Give us the brief. Get a quick read on your brand voice and ten posts that sound like they belong to you.
            </p>
          </div>
          <div className="intro-side">
            <strong>BRIEF IN. VOICE OUT.</strong>
            No blank-page warm-up. Just thoughtful copy, ready for a final human pass.
          </div>
        </section>

        <div className="workspace">
          <section className="panel brief-panel" aria-labelledby="brief-heading">
            <div className="panel-head">
              <div>
                <h2 id="brief-heading">The brand brief</h2>
                <p>A little context makes a much better first draft.</p>
              </div>
              <span className="step-tag">01 / BRIEF</span>
            </div>

            <form onSubmit={submitBrief} noValidate>
              <div className="field">
                <div className="field-row">
                  <label htmlFor="brand-name">Brand name <span className="required-mark" aria-hidden="true">*</span></label>
                  <span className="field-hint">UP TO 120</span>
                </div>
                <input id="brand-name" className="control" data-testid="input-brand-name" value={brief.brand_name} maxLength={120} placeholder="e.g. Goodside Studio" onChange={(event) => changeField('brand_name', event.target.value)} aria-invalid={Boolean(errors.brand_name)} aria-describedby={errors.brand_name ? 'error-brand-name' : undefined} />
                {errors.brand_name && <p className="form-error" id="error-brand-name" data-testid="error-brand-name">{errors.brand_name}</p>}
              </div>

              <div className="field">
                <div className="field-row">
                  <label htmlFor="industry">Industry <span className="required-mark" aria-hidden="true">*</span></label>
                </div>
                <input id="industry" className="control" data-testid="input-industry" value={brief.industry} maxLength={120} placeholder="e.g. Independent skincare" onChange={(event) => changeField('industry', event.target.value)} aria-invalid={Boolean(errors.industry)} aria-describedby={errors.industry ? 'error-industry' : undefined} />
                {errors.industry && <p className="form-error" id="error-industry" data-testid="error-industry">{errors.industry}</p>}
              </div>

              <div className="field">
                <div className="field-row">
                  <label htmlFor="objective">Campaign objective <span className="required-mark" aria-hidden="true">*</span></label>
                  <span className="field-hint">UP TO 500</span>
                </div>
                <textarea id="objective" className="control objective" data-testid="input-campaign-objective" value={brief.campaign_objective} maxLength={500} placeholder="What should these posts help you do?" onChange={(event) => changeField('campaign_objective', event.target.value)} aria-invalid={Boolean(errors.campaign_objective)} aria-describedby={errors.campaign_objective ? 'error-campaign-objective' : undefined} />
                {errors.campaign_objective && <p className="form-error" id="error-campaign-objective" data-testid="error-campaign-objective">{errors.campaign_objective}</p>}
              </div>

              <div className="field">
                <div className="field-row">
                  <label htmlFor="products">Products or services <span className="required-mark" aria-hidden="true">*</span></label>
                  <span className="field-hint">UP TO 1,000</span>
                </div>
                <textarea id="products" className="control" data-testid="input-products-services" value={brief.products_services} maxLength={1000} placeholder="What are you putting into the world?" onChange={(event) => changeField('products_services', event.target.value)} aria-invalid={Boolean(errors.products_services)} aria-describedby={errors.products_services ? 'error-products-services' : undefined} />
                {errors.products_services && <p className="form-error" id="error-products-services" data-testid="error-products-services">{errors.products_services}</p>}
              </div>

              <div className="field">
                <div className="field-row">
                  <label htmlFor="tone">Preferred tone <span className="field-hint">(OPTIONAL)</span></label>
                  <span className="field-hint">UP TO 120</span>
                </div>
                <input id="tone" className="control" data-testid="input-preferred-tone" value={brief.preferred_tone ?? ''} maxLength={120} placeholder="e.g. Warm, irreverent, never salesy" onChange={(event) => changeField('preferred_tone', event.target.value)} aria-invalid={Boolean(errors.preferred_tone)} aria-describedby={errors.preferred_tone ? 'error-preferred-tone' : undefined} />
                {errors.preferred_tone && <p className="form-error" id="error-preferred-tone" data-testid="error-preferred-tone">{errors.preferred_tone}</p>}
              </div>

              <div className="quick-fills" aria-label="Quick-fill example briefs">
                <span className="quick-label">Try a brief</span>
                <button type="button" className="quick-button" data-testid="button-quick-fill-zomato" onClick={() => fillExample('Zomato')}>Zomato</button>
                <button type="button" className="quick-button" data-testid="button-quick-fill-nike" onClick={() => fillExample('Nike')}>Nike</button>
              </div>
              <button className="primary-button" type="submit" data-testid="button-generate" disabled={generate.isPending}>
                {generate.isPending ? <span className="loading-dash" aria-hidden="true" /> : <Sparkles className="button-icon" aria-hidden="true" />}
                {generate.isPending ? 'Finding the voice…' : result ? 'Generate a fresh set' : 'Generate 10 tweets'}
                {!generate.isPending && <ArrowRight className="button-icon" aria-hidden="true" />}
              </button>
              <p className="form-footnote">TEN POSTS. ONE DISTINCTLY YOU VOICE.</p>
            </form>
          </section>

          <section className="panel results-panel results-column" aria-labelledby="results-heading" aria-live="polite">
            <div className="results-heading">
              <div>
                <h2 id="results-heading">{result ? `${result.brand_name}’s voice, found.` : 'Your voice, made visible.'}</h2>
                <p>{result ? 'A quick voice read, followed by ten ready-to-review posts.' : 'Your voice notes and ten post-ready drafts will land here.'}</p>
              </div>
              <div className="result-count" data-testid="text-result-count"><strong>{result ? tweets.length : '10'}</strong> POSTS</div>
            </div>

            {generate.isPending ? (
              <div className="skeleton-stack" role="status" aria-label="Generating ten tweets" data-testid="status-generating">
                <div className="skeleton-line" /><div className="skeleton-line" /><div className="skeleton-line" /><div className="skeleton-line" />
              </div>
            ) : generate.isError && !result ? (
              <div className="error-state" role="alert" data-testid="status-generation-error">
                <strong>We couldn’t finish that brief.</strong>
                <p>{errorMessage}</p>
              </div>
            ) : result ? (
              <>
                <div className="summary-box">
                  <div className="summary-top"><Sparkles className="summary-spark" aria-hidden="true" /> Voice notes</div>
                  <ul className="summary-list" data-testid="list-voice-summary">
                    {result.voice_summary.slice(0, 4).map((point, index) => (
                      <li key={`${index}-${point}`} data-testid={`text-voice-summary-${index}`}>{point}</li>
                    ))}
                  </ul>
                </div>
                {generate.isError && (
                  <div className="error-state" role="alert" data-testid="status-generation-error">
                    <strong>That refresh didn’t go through.</strong>
                    <p>{errorMessage}</p>
                  </div>
                )}
                <div className="tweet-list" data-testid="list-tweets">
                  {tweets.map((tweet, index) => (
                    <article className="tweet-card" key={`${index}-${tweet.text}`} data-testid={`card-tweet-${index + 1}`} style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}>
                      <span className="tweet-number" aria-label={`Tweet ${index + 1}`}>{String(index + 1).padStart(2, '0')}</span>
                      <div className="tweet-body">
                        <div className="tweet-meta">
                          <span className="tweet-brand" data-testid={`text-tweet-brand-${index + 1}`}>@{result.brand_name.replace(/\s+/g, '')}</span>
                          <span className={`style-pill ${tweet.style}`} data-testid={`text-tweet-style-${index + 1}`}>{styleLabels[tweet.style]}</span>
                        </div>
                        <p className="tweet-text" data-testid={`text-tweet-${index + 1}`}>{tweet.text}</p>
                      </div>
                      <button type="button" className={`copy-button${copiedIndex === index ? ' copied' : ''}`} data-testid={`button-copy-tweet-${index + 1}`} aria-label={`Copy tweet ${index + 1}`} onClick={() => void copyTweet(tweet.text, index)}>
                        {copiedIndex === index ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
                        {copiedIndex === index ? 'Copied' : 'Copy Tweet'}
                      </button>
                    </article>
                  ))}
                </div>
                <div className="regen-row">
                  <button className="regen-button" type="button" data-testid="button-regenerate-tweets" onClick={regenerateTweets} disabled={generate.isPending || !lastBrief}>
                    <RefreshCw aria-hidden="true" /> Regenerate Tweets
                  </button>
                </div>
              </>
            ) : (
              <div className="empty-state" data-testid="empty-results">
                <div className="empty-art" aria-hidden="true">
                  <div className="paper-sheet" /><div className="orbit-dot" /><div className="orbit-line" />
                </div>
                <h3>A voice worth recognizing.</h3>
                <p>Share what the brand does and what this campaign needs to say. We’ll turn it into a voice snapshot and ten useful first drafts.</p>
                <span className="empty-note">YOUR NEXT GOOD POST STARTS HERE</span>
              </div>
            )}
          </section>
        </div>

        <footer className="footer-note">
          <span>BRAND VOICE STUDIO</span>
          <span>Good copy starts with good context.</span>
        </footer>
      </div>
    </main>
  );
}


