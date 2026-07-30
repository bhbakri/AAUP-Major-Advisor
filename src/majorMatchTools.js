import { z } from "zod";

import { createReport } from "./report.js";
import { CERTIFICATE_SYSTEMS } from "./utils.js";
import {
  resolveToolLanguage,
} from "./majorMatchLanguage.js";

const languageSchema = z
  .enum(["en", "ar"])
  .optional();

const percentageInputSchema = z.union([
  z.number().min(0).max(100),
  z.string().trim().min(1).max(20),
]);

const optionalPercentageInputSchema = z
  .union([
    z.number().min(0).max(100),
    z.string().trim().max(20),
  ])
  .optional();

const optionalShortTextSchema = z
  .string()
  .trim()
  .max(100)
  .optional();

const optionalLongTextSchema = z
  .string()
  .trim()
  .max(500)
  .optional();

export function registerReportTool(server) {
  server.registerTool(
    "create_major_match_report",
    {
      title: "Ask AAUP Major Advisor",
      description:
        "Creates English or Arabic preliminary AAUP major recommendations from the full 2026/2027 bachelor-program dataset.",
      inputSchema: {
        language: languageSchema.describe(
          "Report language. Infer ar for Arabic conversations and en for English unless the student explicitly chooses another language."
        ),
        certificateSystem: z
          .enum(CERTIFICATE_SYSTEMS)
          .optional()
          .describe("Certificate system"),
        certificateBranch:
          optionalShortTextSchema.describe(
            "Tawjihi branch or Scientific/Literary classification"
          ),
        certificateType:
          optionalShortTextSchema.describe(
            "Backward-compatible field that may contain the old Tawjihi branch or a certificate-system name"
          ),
        average: percentageInputSchema.describe(
          "Student percentage from 0 to 100"
        ),
        coreSubjectAverage:
          optionalPercentageInputSchema.describe(
            "Optional core-subject average for alternative Tawjihi admission routes"
          ),
        equivalencyConfirmed: z
          .boolean()
          .optional()
          .describe(
            "Whether a foreign-certificate equivalent percentage is officially confirmed"
          ),
        campusPreference:
          optionalShortTextSchema.describe(
            "Jenin, Ramallah, or Either"
          ),
        interests:
          optionalLongTextSchema.describe(
            "Student interests and preferred subject areas"
          ),
        careerGoals:
          optionalLongTextSchema.describe(
            "Student career goals"
          ),
        budget: z
          .union([
            z.number().nonnegative(),
            z.string().trim().max(50),
          ])
          .optional()
          .describe(
            "Maximum preferred tuition per credit hour"
          ),
        maxResults: z
          .union([
            z.number().int().min(1).max(10),
            z.string().trim().max(10),
          ])
          .optional()
          .describe(
            "Maximum number of results per section, from 1 to 10"
          ),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
      },
      _meta: {
        ui: {
          visibility: ["app", "model"],
        },
        "openai/widgetAccessible": true,
        "openai/toolInvocation/invoking":
          "Consulting the advisor...",
        "openai/toolInvocation/invoked":
          "Advisor recommendations ready.",
      },
    },
    async (args) => {
      const language =
        resolveToolLanguage(args);

      try {
        const report = createReport(args);

        return {
          structuredContent: {
            report,
            language,
          },
          content: [
            {
              type: "text",
              text: report,
            },
          ],
        };
      } catch (error) {
        console.error(
          "Major report generation failed:",
          error instanceof Error
            ? error.message
            : "Unknown error"
        );

        const message =
          language === "ar"
            ? "تعذر على المستشار إعداد التوصيات حالياً. يرجى المحاولة مرة أخرى لاحقاً."
            : "The advisor could not create recommendations right now. Please try again later.";

        return {
          isError: true,
          structuredContent: {
            report: "",
            language,
          },
          content: [
            {
              type: "text",
              text: message,
            },
          ],
        };
      }
    }
  );
}