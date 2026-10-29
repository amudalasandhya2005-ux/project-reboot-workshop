import { createFileRoute } from "@tanstack/react-router";
import { BrandStudio } from "@/components/BrandStudio";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Brand Tweet Generator" },
      {
        name: "description",
        content: "Turn a brand brief into a concise voice summary and ten campaign-ready tweets with AI-powered analysis.",
      },
      { property: "og:title", content: "Brand Tweet Generator" },
      {
        property: "og:description",
        content: "Turn a brand brief into a concise voice summary and ten campaign-ready tweets.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BrandStudio,
});
