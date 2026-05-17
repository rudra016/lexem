import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Inter, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/components/session-provider";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument-serif",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://www.lexem.site";

const TITLE = "Lexem — Git for AI Prompts | Version Control, Evals & Deploy";
const DESCRIPTION =
  "Lexem is the version control and testing platform for AI prompts. Commit, diff, branch, rollback, run evals, and deploy LLM prompts safely with eval-gated promotions, regression detection, and a TypeScript/Python SDK.";

const KEYWORDS = [
  "lexem",
  "prompt version control",
  "prompt management",
  "prompt engineering platform",
  "AI prompt versioning",
  "LLM prompt management",
  "prompt registry",
  "prompt CMS",
  "prompt evals",
  "prompt evaluation",
  "LLM evals",
  "LLM evaluation framework",
  "prompt testing",
  "prompt regression testing",
  "prompt diff",
  "prompt rollback",
  "prompt branching",
  "git for prompts",
  "git for AI prompts",
  "prompt deployment",
  "prompt CI/CD",
  "prompt observability",
  "AI prompt SDK",
  "LangSmith alternative",
  "PromptLayer alternative",
  "Helicone alternative",
  "LLMOps",
  "AI infrastructure",
  "AI ops",
  "MLOps",
  "AI engineering tools",
  "GPT-4o prompts",
  "Claude prompts",
  "Gemini prompts",
  "OpenAI prompt management",
  "Anthropic prompt management",
  "prompt monitoring",
  "prompt analytics",
  "prompt cost optimization",
  "LLM cost tracking",
  "prompt collaboration",
  "prompt library",
  "system prompt management",
  "prompt template",
  "prompt variables",
  "prompt changelog",
  "AI safety",
  "AI quality assurance",
  "LLM-as-judge",
  "model evaluation",
  "AI testing platform",
  "prompt deployment platform",
];

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s — Lexem",
  },
  description: DESCRIPTION,
  applicationName: "Lexem",
  generator: "Next.js",
  keywords: KEYWORDS,
  authors: [{ name: "Lexem", url: SITE_URL }],
  creator: "Lexem",
  publisher: "Lexem",
  referrer: "origin-when-cross-origin",
  category: "technology",
  classification: "Developer Tools, AI Infrastructure, LLMOps",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  verification: {
    google: "asInysg43aczvqBQT4Ik6wBWJwnNkT2dacyqqbpeA3k",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
      { url: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    siteName: "Lexem",
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    locale: "en_US",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Lexem — Git for AI prompts. Version control, evals, and safe deploys.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og-image.png"],
    creator: "@lexemhq",
    site: "@lexemhq",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Lexem",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/logo-no-bg.png`,
        width: 512,
        height: 512,
      },
      sameAs: [
        "https://github.com/rudra016",
        "https://twitter.com/sudo_rudra",
        "https://www.linkedin.com/in/rudra-kumar-897264227/",
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "Lexem",
      description: DESCRIPTION,
      publisher: { "@id": `${SITE_URL}/#organization` },
      inLanguage: "en-US",
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE_URL}/#software`,
      name: "Lexem",
      applicationCategory: "DeveloperApplication",
      applicationSubCategory: "LLMOps, Prompt Engineering, AI Infrastructure",
      operatingSystem: "Web, Windows, macOS, Linux",
      description: DESCRIPTION,
      url: SITE_URL,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      featureList: [
        "Prompt version control",
        "Diff and rollback",
        "Branching and merging",
        "Eval suites and scoring",
        "Eval-gated deploys",
        "Multi-model evaluation",
        "Regression detection",
        "TypeScript and Python SDKs",
        "GitHub Actions integration",
        "Webhook and Slack alerts",
      ],
      creator: { "@id": `${SITE_URL}/#organization` },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${instrumentSerif.variable} ${inter.variable} ${jetbrains.variable}`}>
      <head>
        <Script
          id="ld-json"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
