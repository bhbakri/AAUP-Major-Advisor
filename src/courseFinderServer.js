import {
  McpServer
} from "@modelcontextprotocol/sdk/server/mcp.js";

import {
  registerCourseFinder
} from "./courseFinderTool.js";

import {
  registerSharedCourseDataTool
} from "./sharedCourseDataTool.js";

export function createCourseFinderServer() {
  const server =
    new McpServer(
      {
        name:
          "aaup-course-finder",

        version:
          "1.0.0"
      },

      {
        instructions:
          "Use show_course_finder when the user wants to open or use the Shared Course Finder. " +

          "Use get_all_shared_course_data when the user asks about students, student IDs, accounts, administrators, completed courses, credit hours, groups, memberships, majors, or course requirements. " +

          "Do not use this app for Tawjihi major eligibility or major-match reports."
      }
    );

  registerCourseFinder(server);

  registerSharedCourseDataTool(
    server
  );

  return server;
}