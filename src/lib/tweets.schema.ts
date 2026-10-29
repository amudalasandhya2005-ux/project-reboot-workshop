import { z } from "zod";

export const TWEET_STYLES = ["conversational", "promotional", "witty", "informative"] as const;
export type BrandTweetStyle = (typeof TWEET_STYLES)[number];

export const briefSchema = z.object({
  brand_name: z.string().trim().min(1).max(120),
  industry: z.string().trim().min(1).max(120),
  campaign_objective: z.string().trim().min(1).max(500),
  products_services: z.string().trim().min(1).max(1000),
  preferred_tone: z.string().trim().max(120).optional(),
});
export type BrandBriefInput = z.input<typeof briefSchema>;

export const resultSchema = z
  .object({
    brand_name: z.string(),
    voice_summary: z.array(z.string()).min(3).max(4),
    tweets: z
      .array(z.object({ text: z.string().min(1).max(280), style: z.enum(TWEET_STYLES) }))
      .length(10),
  })
  .refine(
    (r) => TWEET_STYLES.every((s) => r.tweets.filter((t) => t.style === s).length >= 2),
    "Tweets must include at least two examples of each style.",
  );
export type BrandTweetResult = z.infer<typeof resultSchema>;
