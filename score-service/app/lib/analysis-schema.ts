import { z } from "zod";

import type {
  DesignReviewBreadcrumb,
  DesignReviewDocumentResult,
  DesignReviewImprovement,
  DesignReviewResult,
  DesignReviewScore,
  DesignReviewSection,
} from "@/app/lib/design-review";

const createIdentifierSchema = (label: string) =>
  z.preprocess(
    (input) => {
      if (typeof input === "string") {
        const trimmed = input.trim();

        if (!trimmed) {
          return undefined;
        }

        return trimmed;
      }

      if (typeof input === "number" && Number.isFinite(input)) {
        return String(input);
      }

      return input;
    },
    z
      .string({
        required_error: `${label} is required`,
        invalid_type_error: `${label} must be a string`,
      })
      .min(1, `${label} is required`),
  );

const createNonEmptyStringSchema = (label: string) =>
  z
    .string({
      required_error: `${label} is required`,
      invalid_type_error: `${label} must be a string`,
    })
    .trim()
    .min(1, `${label} is required`);

const createBacklogBaseUrlSchema = () =>
  z
    .string({
      required_error: "Backlog base URL is required",
      invalid_type_error: "Backlog base URL must be a string",
    })
    .trim()
    .min(1, "Backlog base URL is required")
    .transform((value, ctx) => {
      let parsed: URL;

      try {
        parsed = new URL(value);
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Backlog base URL must be a valid URL",
        });
        return z.NEVER;
      }

      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Backlog base URL must use http or https",
        });
        return z.NEVER;
      }

      if (
        (parsed.pathname && parsed.pathname !== "/") ||
        parsed.search ||
        parsed.hash
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Backlog base URL must not include a path, query, or fragment",
        });
        return z.NEVER;
      }

      return parsed.origin;
    });

const backlogRequestSchema = z
  .object({
    baseUrl: createBacklogBaseUrlSchema(),
    projectId: createIdentifierSchema("Backlog project ID"),
    designDocumentId: createIdentifierSchema("Design document ID").optional(),
    requirementsDocumentId: createIdentifierSchema(
      "Requirements document ID",
    ).optional(),
    apiKey: createNonEmptyStringSchema("Backlog API key"),
  })
  .superRefine(({ designDocumentId, requirementsDocumentId }, ctx) => {
    if (!designDocumentId && !requirementsDocumentId) {
      const message =
        "Either Design document ID or Requirements document ID is required";

      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["designDocumentId"],
        message,
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["requirementsDocumentId"],
        message,
      });
    }
  });

const openAiRequestSchema = z.object({
  apiKey: createNonEmptyStringSchema("OpenAI API key"),
});

export const analysisRequestSchema = z.object({
  backlog: backlogRequestSchema,
  openAi: openAiRequestSchema,
});

export type AnalysisRequest = z.infer<typeof analysisRequestSchema>;

const designReviewScoreSchema: z.ZodType<DesignReviewScore> = z.object({
  value: z.number(),
  max: z.number(),
});

const designReviewBreadcrumbSchema: z.ZodType<DesignReviewBreadcrumb> = z.object({
  label: z.string(),
  href: z.string().optional(),
});

const designReviewSectionSchema: z.ZodType<DesignReviewSection> = z.object({
  id: z.string(),
  title: z.string(),
  score: designReviewScoreSchema,
  summary: z.string(),
  highlights: z.array(z.string()),
});

const designReviewImprovementSchema: z.ZodType<DesignReviewImprovement> = z.object({
  title: z.string(),
  description: z.string(),
});

const designReviewDocumentSchema: z.ZodType<DesignReviewDocumentResult> = z.lazy(() =>
  z.object({
    id: z.string(),
    documentTitle: z.string(),
    breadcrumbs: z.array(designReviewBreadcrumbSchema),
    totalScore: designReviewScoreSchema,
    overallEvaluation: z.object({
      ratingLabel: z.string(),
      summary: z.string(),
    }),
    sectionEvaluations: z.array(designReviewSectionSchema),
    improvementSuggestions: z.array(designReviewImprovementSchema),
    childDocuments: z.array(designReviewDocumentSchema),
  }),
);

export const analysisResponseSchema: z.ZodType<DesignReviewResult> = z.object({
  rootDocument: designReviewDocumentSchema,
});

export type AnalysisResponse = z.infer<typeof analysisResponseSchema>;
