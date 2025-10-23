import { z } from "zod";

import type {
  DesignReviewBreadcrumb,
  DesignReviewDocumentResult,
  DesignReviewImprovement,
  DesignReviewResult,
  DesignReviewScore,
  DesignReviewSection,
} from "@/app/lib/design-review";

const SAFE_INTEGER_MAX = Number.MAX_SAFE_INTEGER;

const NUMERIC_ID_PATTERN = /^\d+$/u;

const createNumericIdSchema = (label: string) =>
  z.preprocess(
    (input) => {
      if (typeof input === "string") {
        const trimmed = input.trim();

        if (!trimmed) {
          return undefined;
        }

        if (NUMERIC_ID_PATTERN.test(trimmed)) {
          return Number.parseInt(trimmed, 10);
        }

        return input;
      }

      return input;
    },
    z
      .number({
        required_error: `${label} is required`,
        invalid_type_error: `${label} must be a positive integer`,
      })
      .int(`${label} must be a positive integer`)
      .positive(`${label} must be a positive integer`)
      .max(SAFE_INTEGER_MAX, `${label} must be within the safe integer range`),
  );

const createNonEmptyStringSchema = (label: string) =>
  z
    .string({
      required_error: `${label} is required`,
      invalid_type_error: `${label} must be a string`,
    })
    .trim()
    .min(1, `${label} is required`);

const backlogRequestSchema = z.object({
  projectId: createNumericIdSchema("Backlog project ID"),
  designDocumentId: createNumericIdSchema("Design document ID"),
  requirementsDocumentId: createNumericIdSchema("Requirements document ID"),
  apiKey: createNonEmptyStringSchema("Backlog API key"),
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
