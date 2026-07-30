import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

import express from "express";

import {
  StreamableHTTPServerTransport
} from "@modelcontextprotocol/sdk/server/streamableHttp.js";

import {
  createMajorAdvisorServer
} from "./src/aaupServer.js";

import {
  createCourseFinderServer
} from "./src/courseFinderServer.js";

import {
  registerSharedCourseRoutes
} from "./src/sharedCourses.js";

const PORT =
  Number(process.env.PORT ?? 8787);

const MAJOR_ADVISOR_MCP_PATH =
  "/mcp/major-advisor";

const COURSE_FINDER_MCP_PATH =
  "/mcp/course-finder";

const MCP_METHODS =
  new Set([
    "POST",
    "GET",
    "DELETE"
  ]);

/*
  Match each MCP URL to the server
  that should be created for it.
*/
const MCP_SERVER_FACTORIES =
  new Map([
    [
      MAJOR_ADVISOR_MCP_PATH,
      createMajorAdvisorServer
    ],

    [
      COURSE_FINDER_MCP_PATH,
      createCourseFinderServer
    ]
  ]);

const __filename =
  fileURLToPath(import.meta.url);

const __dirname =
  path.dirname(__filename);

const app = express();

/*
  Handle CORS preflight requests
  for both MCP endpoints.
*/
app.use((req, res, next) => {
  const isMcpPath =
    MCP_SERVER_FACTORIES.has(
      req.path
    );

  if (
    req.method === "OPTIONS" &&
    isMcpPath
  ) {
    res.setHeader(
      "Access-Control-Allow-Origin",
      "*"
    );

    res.setHeader(
      "Access-Control-Allow-Methods",
      "POST, GET, DELETE, OPTIONS"
    );

    res.setHeader(
      "Access-Control-Allow-Headers",
      "content-type, mcp-session-id"
    );

    res.setHeader(
      "Access-Control-Expose-Headers",
      "Mcp-Session-Id"
    );

    res.status(204).end();
    return;
  }

  next();
});

/*
  Basic server status page.
*/
app.get("/", (req, res) => {
  res
    .status(200)
    .type("text/plain")
    .send(
      [
        "AAUP MCP server is running.",
        "",
        `Major Advisor: ${MAJOR_ADVISOR_MCP_PATH}`,
        `Course Finder: ${COURSE_FINDER_MCP_PATH}`,
        "Course Finder Website: /CourseFinder.html"
      ].join("\n")
    );
});

/*
  Serve files inside the public folder.

  public/CourseFinder.html becomes:
  /CourseFinder.html
*/
app.use(
  express.static(
    path.join(
      __dirname,
      "public"
    )
  )
);

/*
  Allow the Course Finder widget
  to communicate with the Render API.
*/
app.use(
  "/api/shared-courses",

  (req, res, next) => {
    res.setHeader(
      "Access-Control-Allow-Origin",
      "*"
    );

    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );

    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );

    if (req.method === "OPTIONS") {
      res.status(204).end();
      return;
    }

    next();
  }
);

/*
  Parse JSON only for regular API routes.

  Do not use express.json() globally because
  the MCP transport handles its own body.
*/
app.use(
  "/api",
  express.json()
);

/*
  Register the Shared Course Finder API.

  These routes are used by the HTML widget,
  not by the MCP transport itself.
*/
registerSharedCourseRoutes(app);

/*
  Handle a request for one selected
  MCP server.
*/
async function handleMcpRequest(
  req,
  res,
  createSelectedServer
) {
  res.setHeader(
    "Access-Control-Allow-Origin",
    "*"
  );

  res.setHeader(
    "Access-Control-Expose-Headers",
    "Mcp-Session-Id"
  );

  const mcpServer =
    createSelectedServer();

  const transport =
    new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true
    });

  res.on("close", () => {
    transport.close();
    mcpServer.close();
  });

  await mcpServer.connect(
    transport
  );

  await transport.handleRequest(
    req,
    res
  );
}

/*
  Register each MCP endpoint separately.

  Each endpoint creates a different MCP server
  and exposes a different set of tools.
*/
for (
  const [
    mcpPath,
    createSelectedServer
  ]
  of MCP_SERVER_FACTORIES
) {
  app.all(
    mcpPath,

    async (req, res) => {
      const method =
        req.method ?? "";

      if (!MCP_METHODS.has(method)) {
        res.setHeader(
          "Allow",
          "POST, GET, DELETE, OPTIONS"
        );

        res
          .status(405)
          .send(
            "Method Not Allowed"
          );

        return;
      }

      try {
        await handleMcpRequest(
          req,
          res,
          createSelectedServer
        );
      } catch (error) {
        console.error(
          `Error handling MCP request at ${mcpPath}:`,
          error
        );

        if (!res.headersSent) {
          res
            .status(500)
            .send(
              "Internal server error"
            );
        }
      }
    }
  );
}

/*
  Return 404 for unmatched routes.
*/
app.use((req, res) => {
  res
    .status(404)
    .send("Not Found");
});

const httpServer =
  createServer(app);

httpServer.listen(
  PORT,
  "0.0.0.0",

  () => {
    console.log(
      `AAUP MCP server listening on port ${PORT}`
    );

    console.log(
      `Course Finder website: ` +
      `http://localhost:${PORT}/CourseFinder.html`
    );

    console.log(
      `Major Advisor MCP: ` +
      `http://localhost:${PORT}${MAJOR_ADVISOR_MCP_PATH}`
    );

    console.log(
      `Course Finder MCP: ` +
      `http://localhost:${PORT}${COURSE_FINDER_MCP_PATH}`
    );
  }
);