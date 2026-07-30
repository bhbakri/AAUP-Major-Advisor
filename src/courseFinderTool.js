import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  registerAppResource,
  registerAppTool,
  RESOURCE_MIME_TYPE
} from "@modelcontextprotocol/ext-apps/server";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COURSE_FINDER_URI =
  "ui://widget/course-finder-v4.html";

const COURSE_FINDER_HTML = readFileSync(
  path.join(
    __dirname,
    "../public/CourseFinder.html"
  ),
  "utf8"
);

function registerCourseFinderResource(server) {
  registerAppResource(
    server,
    "course-finder-widget",
    COURSE_FINDER_URI,
    {
      description:
        "Interactive AAUP Shared Course Finder.",

      _meta: {
        ui: {
          prefersBorder: true,

          csp: {
            connectDomains: [
              "https://test-aau2.onrender.com"
            ]
          }
        }
      }
    },

    async () => ({
      contents: [
        {
          uri: COURSE_FINDER_URI,
          mimeType: RESOURCE_MIME_TYPE,
          text: COURSE_FINDER_HTML
        }
      ]
    })
  );
}

function registerCourseFinderTool(server) {
  registerAppTool(
    server,
    "show_course_finder",
    {
      title: "Open Shared Course Finder",

      description:
        "Open the AAUP Shared Course Finder for selecting completed courses, creating or joining groups, viewing groups, and comparing shared required courses.",

      inputSchema: {},

      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false
      },

      _meta: {
        ui: {
          resourceUri: COURSE_FINDER_URI
        }
      }
    },

    async () => ({
      content: [
        {
          type: "text",
          text:
            "The AAUP Shared Course Finder is ready."
        }
      ]
    })
  );
}

export function registerCourseFinder(server) {
  registerCourseFinderResource(server);
  registerCourseFinderTool(server);
}