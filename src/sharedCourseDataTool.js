import { z } from "zod";

import {
  getAllSharedCourseData
} from "./sharedCourses.js";

const courseSchema =
  z.object({
    code: z.string(),
    name: z.string(),
    credits: z.number(),
    year: z.number(),

    semester:
      z.union([
        z.number(),
        z.string()
      ])
  });

const accountSchema =
  z.object({
    id: z.string(),
    name: z.string(),
    studentId: z.string(),
    email: z.string(),
    major: z.string(),
    role: z.string(),
    isAdmin: z.boolean(),

    creditHoursCompleted:
      z.number(),

    completedCourses:
      z.array(z.string()),

    groupIds:
      z.array(z.string())
  });

const groupMemberSchema =
  z.object({
    id: z.string(),
    name: z.string(),
    studentId: z.string(),

    remainingCourseCount:
      z.number()
  });

const mostNeededCourseSchema =
  courseSchema.extend({
    studentCount:
      z.number()
  });

const groupSchema =
  z.object({
    id: z.string(),
    name: z.string(),
    major: z.string(),
    creatorUserId: z.string(),
    creatorName: z.string(),
    locked: z.boolean(),
    memberCount: z.number(),

    members:
      z.array(
        groupMemberSchema
      ),

    sharedCourses:
      z.array(
        courseSchema
      ),

    mostNeededCourses:
      z.array(
        mostNeededCourseSchema
      )
  });

export function registerSharedCourseDataTool(
  server
) {
  server.registerTool(
    "get_all_shared_course_data",

    {
      title:
        "Get All Shared Course Data",

      description:
        "Use this when the user asks about students, student IDs, accounts, administrators, majors, courses, completed courses, credit hours, groups, locked groups, group creators, memberships, shared courses, or overall Shared Course Finder statistics. Returns a current read-only snapshot of all non-secret application data.",

      inputSchema: {},

      outputSchema: {
        generatedAt:
          z.string(),

        summary:
          z.object({
            accountCount:
              z.number(),

            studentCount:
              z.number(),

            adminCount:
              z.number(),

            majorCount:
              z.number(),

            courseCount:
              z.number(),

            groupCount:
              z.number()
          }),

        accounts:
          z.array(
            accountSchema
          ),

        majors:
          z.array(
            z.object({
              name: z.string(),

              courses:
                z.array(
                  courseSchema
                )
            })
          ),

        groups:
          z.array(
            groupSchema
          )
      },

      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false
      }
    },

    async () => {
      const snapshot =
        getAllSharedCourseData();

      return {
        structuredContent:
          snapshot,

        content: [
          {
            type: "text",

            text:
              `Loaded ${snapshot.summary.studentCount} students, ` +
              `${snapshot.summary.adminCount} administrators, ` +
              `${snapshot.summary.courseCount} courses, and ` +
              `${snapshot.summary.groupCount} groups.`
          }
        ]
      };
    }
  );
}