import { useState, type FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { toast } from 'sonner';
import { generateBrandTweets } from '@/lib/tweets.functions';
import type { BrandBriefInput, BrandTweetResult, BrandTweetStyle } from '@/lib/tweets.schema';
import { ArrowRight, Check, ClipboardList, Copy, Pencil, RefreshCw, Sparkles, X } from 'lucide-react';

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

const TWEET_LIMIT = 280;

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

function Counter({ value, max }: { value: string; max: number }) {
  const n = value.length;
  return <span className={`counter${n > max * 0.9 ? ' near' : ''}`} aria-live="off">{n.toLocaleString()} / {max.toLocaleString()}</span>;
}

function EmptyIllustration() {
  return (
    <svg viewBox="0 0 150 110" fill="none" aria-hidden="true">
      <rect x="22" y="14" width="86" height="82" rx="10" fill="hsl(var(--bv-paper))" stroke="hsl(var(--bv-line-strong))" />
      <rect x="34" y="30" width="44" height="6" rx="3" fill="hsl(var(--bv-navy))" />
      <rect x="34" y="44" width="60" height="4" rx="2" fill="hsl(var(--bv-line))" />
      <rect x="34" y="54" width="52" height="4" rx="2" fill="hsl(var(--bv-line))" />
      <rect x="34" y="64" width="38" height="4" rx="2" fill="hsl(var(--bv-coral) / .6)" />
      <rect x="34" y="78" width="22" height="8" rx="4" fill="hsl(var(--bv-blue-soft))" />
      <circle cx="116" cy="28" r="16" fill="hsl(var(--bv-coral))" />
      <path d="M116 20l2.2 5.8L124 28l-5.8 2.2L116 36l-2.2-5.8L108 28l5.8-2.2z" fill="hsl(var(--bv-paper))" />
      <path d="M100 90c14-2 26-12 30-26" stroke="hsl(var(--bv-blue))" strokeDasharray="3 4" strokeLinecap="round" />
    </svg>
  );
}

export function BrandStudio() {
  const [brief, setBrief] = useState<BrandBriefInput>(initialBrief);
  const [errors, setErrors] = useState<BriefErrors>({});
  const [result, setResult] = useState<BrandTweetResult | null>(null);
  const [lastBrief, setLastBrief] = useState<BrandBriefInput | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState('');
  const health = { isLoading: false, isError: false };
  const generateFn = useServerFn(generateBrandTweets);
  const generate = useMutation({
    mutationFn: (vars: { data: BrandBriefInput }) => generateFn(vars),
    onSuccess: (data: BrandTweetResult) => {
      setResult(data);
      setEditingIndex(null);
      toast.success('Ten fresh posts are ready.');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Generation failed. Try again.');
    },
  });

  const changeField = (key: keyof BrandBriefInput, value: string) => {
    setBrief((current) => ({ ...current, [key]: value }));
    if (errors[key]) setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const submitBrief = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (generate.isPending) return;
    const nextErrors = validateBrief(brief);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast.error('A few brief fields need attention.');
      return;
    }
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
    if (lastBrief && !generate.isPending) generate.mutate({ data: lastBrief });
  };

  const fillExample = (name: 'Zomato' | 'Nike') => {
    setBrief(examples[name]);
    setErrors({});
  };

  const writeClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
  };

  const copyTweet = async (text: string, index: number) => {
    try {
      await writeClipboard(text);
      setCopiedIndex(index);
      toast.success(`Post ${index + 1} copied to clipboard.`);
      window.setTimeout(() => setCopiedIndex((current) => current === index ? null : current), 1700);
    } catch {
      setCopiedIndex(null);
      toast.error('Couldn’t copy. Your browser blocked clipboard access.');
    }
  };

  const tweets = result?.tweets.slice(0, 10) ?? [];

  const copyAll = async () => {
    try {
      await writeClipboard(tweets.map((t, i) => `${i + 1}. ${t.text}`).join('\n\n'));
      toast.success('All 10 posts copied.');
    } catch {
      toast.error('Couldn’t copy. Your browser blocked clipboard access.');
    }
  };

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setDraft(tweets[index].text);
  };

  const saveEdit = () => {
    if (editingIndex === null || !result) return;
    const text = draft.trim();
    if (!text) return;
    setResult({ ...result, tweets: result.tweets.map((t, i) => (i === editingIndex ? { ...t, text } : t)) });
    setEditingIndex(null);
    toast.success(`Post ${editingIndex + 1} updated.`);
  };

  const errorMessage = generate.error instanceof Error
    ? generate.error.message
    : 'Something went wrong while generating your tweets. Try again in a moment.';
  const handle = result ? `@${result.brand_name.replace(/\s+/g, '')}` : '';

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <a className="brand-lockup" href="/" aria-label="Brand voice home" data-testid="link-home">
            <span className="brand-mark" aria-hidden="true">b.</span>
            <span className="brand-name">brand voice</span>
          </a>
          <div className="topbar-note" data-testid="status-api" aria-label="Studio status">
            <span className={`health-dot${health.isError ? ' offline' : ''}`} aria-hidden="true" />
            <span className="status-text">{health.isLoading ? 'Checking studio' : health.isError ? 'Studio offline' : 'Studio ready'}</span>
          </div>
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
          <aside className="intro-side">
            <span className="quote-glyph" aria-hidden="true">“</span>
            <strong>BRIEF IN. VOICE OUT.</strong>
            No blank-page warm-up. Just thoughtful copy, ready for a final human pass.
          </aside>
        </section>

        <div className="workspace">
          <section className="panel brief-panel" aria-labelledby="brief-heading">
            <div className="panel-head">
              <div>
                <h2 id="brief-heading">The brand brief</h2>
                <p>A little context makes a much better first draft.</p>
              </div>
              <span className="step-tag">01 / Brief</span>
            </div>

            <form onSubmit={submitBrief} noValidate>
              <div className="field">
                <div className="field-row">
                  <label htmlFor="brand-name">Brand name<span className="required-mark" aria-hidden="true">*</span></label>
                  <Counter value={brief.brand_name} max={120} />
                </div>
                <input id="brand-name" className="control" data-testid="input-brand-name" value={brief.brand_name} maxLength={120} placeholder="e.g. Goodside Studio" onChange={(event) => changeField('brand_name', event.target.value)} aria-invalid={Boolean(errors.brand_name)} aria-describedby={errors.brand_name ? 'error-brand-name' : undefined} />
                {errors.brand_name && <p className="form-error" id="error-brand-name" data-testid="error-brand-name">{errors.brand_name}</p>}
              </div>

              <div className="field">
                <div className="field-row">
                  <label htmlFor="industry">Industry<span className="required-mark" aria-hidden="true">*</span></label>
                  <Counter value={brief.industry} max={120} />
                </div>
                <input id="industry" className="control" data-testid="input-industry" value={brief.industry} maxLength={120} placeholder="e.g. Independent skincare" onChange={(event) => changeField('industry', event.target.value)} aria-invalid={Boolean(errors.industry)} aria-describedby={errors.industry ? 'error-industry' : undefined} />
                {errors.industry && <p className="form-error" id="error-industry" data-testid="error-industry">{errors.industry}</p>}
              </div>

              <div className="field">
                <div className="field-row">
                  <label htmlFor="objective">Campaign objective<span className="required-mark" aria-hidden="true">*</span></label>
                  <Counter value={brief.campaign_objective} max={500} />
                </div>
                <p className="field-desc" id="desc-objective">The one thing these posts should achieve.</p>
                <textarea id="objective" className="control objective" data-testid="input-campaign-objective" value={brief.campaign_objective} maxLength={500} placeholder="What should these posts help you do?" onChange={(event) => changeField('campaign_objective', event.target.value)} aria-invalid={Boolean(errors.campaign_objective)} aria-describedby={errors.campaign_objective ? 'error-campaign-objective' : 'desc-objective'} />
                {errors.campaign_objective && <p className="form-error" id="error-campaign-objective" data-testid="error-campaign-objective">{errors.campaign_objective}</p>}
              </div>

              <div className="field">
                <div className="field-row">
                  <label htmlFor="products">Products or services<span className="required-mark" aria-hidden="true">*</span></label>
                  <Counter value={brief.products_services} max={1000} />
                </div>
                <p className="field-desc" id="desc-products">What you offer and what makes it different.</p>
                <textarea id="products" className="control" data-testid="input-products-services" value={brief.products_services} maxLength={1000} placeholder="What are you putting into the world?" onChange={(event) => changeField('products_services', event.target.value)} aria-invalid={Boolean(errors.products_services)} aria-describedby={errors.products_services ? 'error-products-services' : 'desc-products'} />
                {errors.products_services && <p className="form-error" id="error-products-services" data-testid="error-products-services">{errors.products_services}</p>}
              </div>

              <div className="field">
                <div className="field-row">
                  <label htmlFor="tone">Preferred tone <span className="field-hint">(OPTIONAL)</span></label>
                  <Counter value={brief.preferred_tone ?? ''} max={120} />
                </div>
                <p className="field-desc" id="desc-tone">Three or four words that describe how you sound.</p>
                <input id="tone" className="control" data-testid="input-preferred-tone" value={brief.preferred_tone ?? ''} maxLength={120} placeholder="e.g. Warm, irreverent, never salesy" onChange={(event) => changeField('preferred_tone', event.target.value)} aria-invalid={Boolean(errors.preferred_tone)} aria-describedby={errors.preferred_tone ? 'error-preferred-tone' : 'desc-tone'} />
                {errors.preferred_tone && <p className="form-error" id="error-preferred-tone" data-testid="error-preferred-tone">{errors.preferred_tone}</p>}
              </div>

              <div className="quick-fills" aria-label="Quick-fill example briefs">
                <span className="quick-label">Try a brief</span>
                <button type="button" className="quick-button" data-testid="button-quick-fill-zomato" onClick={() => fillExample('Zomato')}>Zomato</button>
                <button type="button" className="quick-button" data-testid="button-quick-fill-nike" onClick={() => fillExample('Nike')}>Nike</button>
              </div>
              <button className="primary-button" type="submit" data-testid="button-generate" disabled={generate.isPending} aria-busy={generate.isPending}>
                {generate.isPending ? <span className="spinner" aria-hidden="true" /> : <Sparkles className="button-icon" aria-hidden="true" />}
                {generate.isPending ? 'Finding the voice…' : result ? 'Generate a fresh set' : 'Generate 10 tweets'}
                {!generate.isPending && <ArrowRight className="button-icon arrow" aria-hidden="true" />}
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
              <div className="result-count" data-testid="text-result-count">02 / <strong>{result ? tweets.length : '10'}</strong> Posts</div>
            </div>

            {generate.isPending ? (
              <div className="skeleton-stack" role="status" aria-label="Generating ten tweets" data-testid="status-generating">
                <div className="skeleton-status"><span className="spinner" aria-hidden="true" /> Reading the brief, shaping the voice…</div>
                <div className="skeleton-block" style={{ height: 120 }} />
                {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton-block" style={{ height: 92 }} />)}
              </div>
            ) : generate.isError && !result ? (
              <div className="error-state" role="alert" data-testid="status-generation-error">
                <strong>We couldn’t finish that brief.</strong>
                <p>{errorMessage}</p>
              </div>
            ) : result ? (
              <>
                <div className="summary-box">
                  <div className="summary-top"><Sparkles className="summary-spark" aria-hidden="true" /> Voice profile</div>
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
                <div className="posts-bar">
                  <span className="posts-title">Generated posts</span>
                  <button type="button" className="ghost-button" data-testid="button-copy-all" onClick={() => void copyAll()}>
                    <ClipboardList aria-hidden="true" /> Copy all
                  </button>
                </div>
                <div className="tweet-list" data-testid="list-tweets">
                  {tweets.map((tweet, index) => {
                    const editing = editingIndex === index;
                    const len = editing ? draft.length : tweet.text.length;
                    return (
                      <article className="tweet-card" key={`${index}-${tweet.text}`} data-testid={`card-tweet-${index + 1}`} style={{ animationDelay: `${Math.min(index, 9) * 45}ms` }}>
                        <span className="tweet-number" aria-label={`Tweet ${index + 1}`}>{String(index + 1).padStart(2, '0')}</span>
                        <div className="tweet-body">
                          <div className="tweet-meta">
                            <span className="tweet-brand" data-testid={`text-tweet-brand-${index + 1}`}>{handle}</span>
                            <span className="platform-label">· X / Twitter</span>
                            <span className={`style-pill ${tweet.style}`} data-testid={`text-tweet-style-${index + 1}`}>{styleLabels[tweet.style]}</span>
                          </div>
                          {editing ? (
                            <textarea className="control tweet-edit" aria-label={`Edit post ${index + 1}`} value={draft} autoFocus onChange={(e) => setDraft(e.target.value)} data-testid={`input-edit-tweet-${index + 1}`} />
                          ) : (
                            <p className="tweet-text" data-testid={`text-tweet-${index + 1}`}>{tweet.text}</p>
                          )}
                          <div className="tweet-foot">
                            <span className={`char-count${len > TWEET_LIMIT ? ' over' : ''}`}>{len} / {TWEET_LIMIT}</span>
                            <div className="tweet-actions">
                              {editing ? (
                                <>
                                  <button type="button" className="ghost-button" onClick={() => setEditingIndex(null)}><X aria-hidden="true" /> Cancel</button>
                                  <button type="button" className="copy-button" onClick={saveEdit} disabled={!draft.trim()} data-testid={`button-save-tweet-${index + 1}`}><Check aria-hidden="true" /> Save</button>
                                </>
                              ) : (
                                <>
                                  <button type="button" className="ghost-button" aria-label={`Edit tweet ${index + 1}`} onClick={() => startEdit(index)} data-testid={`button-edit-tweet-${index + 1}`}><Pencil aria-hidden="true" /> Edit</button>
                                  <button type="button" className={`copy-button${copiedIndex === index ? ' copied' : ''}`} data-testid={`button-copy-tweet-${index + 1}`} aria-label={`Copy tweet ${index + 1}`} onClick={() => void copyTweet(tweet.text, index)}>
                                    {copiedIndex === index ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
                                    {copiedIndex === index ? 'Copied' : 'Copy Tweet'}
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
                <div className="regen-row">
                  <button className="regen-button" type="button" data-testid="button-regenerate-tweets" onClick={regenerateTweets} disabled={generate.isPending || !lastBrief}>
                    <RefreshCw aria-hidden="true" /> Regenerate Tweets
                  </button>
                </div>
              </>
            ) : (
              <div className="empty-state" data-testid="empty-results">
                <div className="empty-art"><EmptyIllustration /></div>
                <h3>A voice worth recognizing.</h3>
                <p>Share what the brand does and what this campaign needs to say. We’ll turn it into a voice snapshot and ten useful first drafts.</p>
                <div className="preview-wrap" aria-hidden="true">
                  <div className="preview-label"><span>Layout preview</span><span>Voice profile + 10 posts</span></div>
                  <div className="preview-voice" />
                  {['01', '02', '03'].map((n) => (
                    <div className="preview-post" key={n}><b>{n}</b><i /><i /></div>
                  ))}
                </div>
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
