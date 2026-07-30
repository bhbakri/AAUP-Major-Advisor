import { createServer } from "node:http";

import express from "express";

import {
  StreamableHTTPServerTransport,
} from "@modelcontextprotocol/sdk/server/streamableHttp.js";

import {
  createMajorAdvisorServer,
} from "./src/aaupServer.js";

const PORT = Number(process.env.PORT ?? 8787);
const MCP_PATH = "/mcp";

const MCP_METHODS = new Set([
  "POST",
  "GET",
  "DELETE",
]);

const app = express();

/*
  Handle CORS preflight requests
  for the Major Advisor MCP endpoint.
*/
app.use((req, res, next) => {
  if (
    req.method === "OPTIONS" &&
    req.path === MCP_PATH
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
        "AAUP Major Advisor MCP server is running.",
        "",
        `MCP endpoint: ${MCP_PATH}`,
      ].join("\n")
    );
});

/*
  Handle Major Advisor MCP requests.
*/
async function handleMcpRequest(req, res) {
  res.setHeader(
    "Access-Control-Allow-Origin",
    "*"
  );

  res.setHeader(
    "Access-Control-Expose-Headers",
    "Mcp-Session-Id"
  );

  const mcpServer =
    createMajorAdvisorServer();

  const transport =
    new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

  res.on("close", () => {
    transport.close();
    mcpServer.close();
  });

  await mcpServer.connect(transport);

  await transport.handleRequest(
    req,
    res
  );
}

/*
  Major Advisor MCP endpoint.
*/
app.all(
  MCP_PATH,

  async (req, res) => {
    const method = req.method ?? "";

    if (!MCP_METHODS.has(method)) {
      res.setHeader(
        "Allow",
        "POST, GET, DELETE, OPTIONS"
      );

      res
        .status(405)
        .send("Method Not Allowed");

      return;
    }

    try {
      await handleMcpRequest(
        req,
        res
      );
    } catch (error) {
      console.error(
        "Error handling Major Advisor MCP request:",
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
      `AAUP Major Advisor server listening on port ${PORT}`
    );

    console.log(
      `Major Advisor MCP: http://localhost:${PORT}${MCP_PATH}`
    );
  }
);