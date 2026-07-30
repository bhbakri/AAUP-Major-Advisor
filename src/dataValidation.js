import { z } from "zod";

const CAMPUSES = [
  "Jenin",
  "Ramallah",
];

const BRANCHES = [
  "Scientific",
  "Industrial",
  "Information Technology",
  "Agricultural",
  "Literary",
  "Sharia",
];

const DAY_IN_MS =
  24 * 60 * 60 * 1000;

const MAX_VERIFICATION_GAP_DAYS = 90;

const nonEmptyText = z
  .string()
  .trim()
  .min(1);

const percentage = z
  .number()
  .min(0)
  .max(100);

const nullablePercentage =
  percentage.nullable();

const academicYearSchema = z
  .string()
  .regex(
    /^\d{4}-\d{4}$/,
    "Use an academic year such as 2026-2027."
  )
  .refine((value) => {
    const [start, end] =
      value.split("-").map(Number);

    return end === start + 1;
  }, "The academic year must cover consecutive years.");

const isoDateSchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}$/,
    "Use an ISO date such as 2026-07-23."
  )
  .refine((value) => {
    const date = new Date(
      `${value}T00:00:00Z`
    );

    return (
      !Number.isNaN(date.getTime()) &&
      date
        .toISOString()
        .slice(0, 10) === value
    );
  }, "The date is invalid.");

const officialUrlSchema = z
  .string()
  .url()
  .refine((value) => {
    const url = new URL(value);

    return (
      url.protocol === "https:" &&
      (
        url.hostname === "aaup.edu" ||
        url.hostname.endsWith(
          ".aaup.edu"
        )
      )
    );
  }, "Official sources must use HTTPS on an aaup.edu domain.");

const officialSourcesSchema = z
  .record(
    nonEmptyText,
    officialUrlSchema
  )
  .refine(
    (sources) =>
      Object.keys(sources).length > 0,
    "At least one official AAUP source is required."
  );

const branchMinimumsSchema = z
  .record(
    nonEmptyText,
    percentage
  )
  .nullable();

const majorSchema = z
  .object({
    id: nonEmptyText,

    programArabic:
      nonEmptyText,

    programEnglish:
      nonEmptyText,

    degreeLevel:
      nonEmptyText,

    collegeArabic:
      nonEmptyText,

    collegeEnglish:
      nonEmptyText,

    campus: z.enum(
      CAMPUSES
    ),

    academicYear:
      academicYearSchema,

    eligibleBranches: z
      .array(nonEmptyText)
      .min(1),

    eligibleBranchesMode:
      z.enum([
        "listed",
        "all",
      ]),

    minimumAverageTawjihi:
      nullablePercentage,

    minimumAverageTawjihiByBranch:
      branchMinimumsSchema,

    alternativeTawjihiRequirement:
      z.unknown().nullable(),

    minimumAverageBagrut:
      nullablePercentage,

    tuitionPerHourNIS: z
      .number()
      .nonnegative(),

    tuitionAfterScholarship:
      z.boolean(),

    keywords: z
      .array(nonEmptyText)
      .min(1),

    otherAdmissionRequirements:
      z.array(nonEmptyText),

    specialNotes:
      z.array(nonEmptyText),

    admissionStatus:
      nonEmptyText,

    lastVerifiedOn:
      isoDateSchema,

    officialSources:
      officialSourcesSchema,
  })
  .passthrough()
  .superRefine(
    (major, context) => {
      if (
        major
          .eligibleBranchesMode ===
        "listed"
      ) {
        for (
          const branch of
          major.eligibleBranches
        ) {
          if (
            !BRANCHES.includes(
              branch
            )
          ) {
            context.addIssue({
              code: "custom",
              path: [
                "eligibleBranches",
              ],
              message:
                `Unsupported branch: ${branch}`,
            });
          }
        }
      }

      const branchMinimums =
        major
          .minimumAverageTawjihiByBranch;

      if (branchMinimums) {
        for (
          const branch of
          Object.keys(
            branchMinimums
          )
        ) {
          if (
            !BRANCHES.includes(
              branch
            )
          ) {
            context.addIssue({
              code: "custom",
              path: [
                "minimumAverageTawjihiByBranch",
                branch,
              ],
              message:
                `Unsupported branch: ${branch}`,
            });
          }

          if (
            major
              .eligibleBranchesMode ===
              "listed" &&
            !major
              .eligibleBranches
              .includes(branch)
          ) {
            context.addIssue({
              code: "custom",
              path: [
                "minimumAverageTawjihiByBranch",
                branch,
              ],
              message:
                "A branch minimum must also appear in eligibleBranches.",
            });
          }
        }
      }

      const hasMinimum =
        major
          .minimumAverageTawjihi !==
          null ||
        (
          branchMinimums !== null &&
          Object.keys(
            branchMinimums
          ).length > 0
        );

      if (!hasMinimum) {
        context.addIssue({
          code: "custom",
          path: [
            "minimumAverageTawjihi",
          ],
          message:
            "A general or branch-specific Tawjihi minimum is required.",
        });
      }
    }
  );

const admissionSystemsSchema = z
  .object({
    academicYear:
      academicYearSchema,

    lastVerifiedOn:
      isoDateSchema,

    officialSources:
      officialSourcesSchema,

    systems: z.record(
      nonEmptyText,
      z.unknown()
    ),

    importantCautions: z
      .array(nonEmptyText)
      .min(1),

    applicationCycle:
      z.object({
        term:
          nonEmptyText,

        applicationsOpen:
          isoDateSchema,

        applicationsClose:
          isoDateSchema,

        classesBegin:
          isoDateSchema,

        admissionCardFeeNIS:
          z
            .number()
            .nonnegative(),

        admissionCardRefundable:
          z.boolean(),
      }),
  })
  .passthrough()
  .superRefine(
    (data, context) => {
      const cycle =
        data.applicationCycle;

      const applicationsOpen =
        new Date(
          `${cycle.applicationsOpen}T00:00:00Z`
        );

      const applicationsClose =
        new Date(
          `${cycle.applicationsClose}T00:00:00Z`
        );

      const classesBegin =
        new Date(
          `${cycle.classesBegin}T00:00:00Z`
        );

      if (
        applicationsOpen >
        applicationsClose
      ) {
        context.addIssue({
          code: "custom",
          path: [
            "applicationCycle",
            "applicationsClose",
          ],
          message:
            "Applications cannot close before they open.",
        });
      }

      if (
        applicationsClose >
        classesBegin
      ) {
        context.addIssue({
          code: "custom",
          path: [
            "applicationCycle",
            "classesBegin",
          ],
          message:
            "Classes cannot begin before applications close.",
        });
      }
    }
  );

function formatPath(path) {
  return path.length
    ? path.join(".")
    : "data";
}

function collectIssues(
  result,
  prefix
) {
  if (result.success) {
    return [];
  }

  return result.error.issues.map(
    (issue) =>
      `${prefix}.${formatPath(
        issue.path
      )}: ${issue.message}`
  );
}

export function validateAdmissionsData(
  rawMajors,
  rawAdmissionSystems
) {
  const majorsResult = z
    .array(majorSchema)
    .min(1)
    .safeParse(rawMajors);

  const systemsResult =
    admissionSystemsSchema.safeParse(
      rawAdmissionSystems
    );

  const issues = [
    ...collectIssues(
      majorsResult,
      "majors"
    ),

    ...collectIssues(
      systemsResult,
      "admissionSystems"
    ),
  ];

  if (
    majorsResult.success &&
    systemsResult.success
  ) {
    const majors =
      majorsResult.data;

    const admissionSystems =
      systemsResult.data;

    const programIds =
      new Set();

    const datasetVerificationDate =
      new Date(
        `${admissionSystems.lastVerifiedOn}T00:00:00Z`
      );

    majors.forEach(
      (major, index) => {
        if (
          programIds.has(
            major.id
          )
        ) {
          issues.push(
            `majors.${index}.id: Duplicate program ID ${major.id}.`
          );
        }

        programIds.add(
          major.id
        );

        if (
          major.academicYear !==
          admissionSystems
            .academicYear
        ) {
          issues.push(
            `majors.${index}.academicYear: ` +
            `${major.id} uses ${major.academicYear}, ` +
            `but admissionSystems uses ` +
            `${admissionSystems.academicYear}.`
          );
        }

        const programDate =
          new Date(
            `${major.lastVerifiedOn}T00:00:00Z`
          );

        const ageDifference =
          (
            datasetVerificationDate -
            programDate
          ) / DAY_IN_MS;

        if (
          ageDifference < 0
        ) {
          issues.push(
            `majors.${index}.lastVerifiedOn: ` +
            `${major.id} was verified after the dataset-level date.`
          );
        }

        if (
          ageDifference >
          MAX_VERIFICATION_GAP_DAYS
        ) {
          issues.push(
            `majors.${index}.lastVerifiedOn: ` +
            `${major.id} is more than ` +
            `${MAX_VERIFICATION_GAP_DAYS} days older than the dataset-level date.`
          );
        }
      }
    );

    if (
      issues.length === 0
    ) {
      return {
        majors,
        admissionSystems,
      };
    }
  }

  throw new Error(
    "AAUP admissions data validation failed:\n- " +
    issues.join("\n- ")
  );
}