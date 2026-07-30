import { readFileSync } from "node:fs";

import {
  registerAppResource,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";

import {
  BRANCH_OPTIONS_BY_SYSTEM,
  CERTIFICATE_SYSTEM_OPTIONS,
} from "./utils.js";
import { FORM_TRANSLATIONS } from "./majorMatchLanguage.js";

export const FORM_URI =
  "ui://aaup/major-match-form-v6.html";

const FORM_TEMPLATE_URL = new URL(
  "./ui/majorMatchForm.html",
  import.meta.url
);

let formTemplateCache = null;

function loadFormTemplate() {
  if (formTemplateCache === null) {
    formTemplateCache = readFileSync(
      FORM_TEMPLATE_URL,
      "utf-8"
    );
  }

  return formTemplateCache;
}

function serializeForInlineScript(value) {
  return JSON.stringify(value)
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("&", "\\u0026")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");
}

export function createFormHtml() {
  return loadFormTemplate()
    .replace(
      "__CERTIFICATE_OPTIONS__",
      serializeForInlineScript(
        CERTIFICATE_SYSTEM_OPTIONS
      )
    )
    .replace(
      "__BRANCH_OPTIONS__",
      serializeForInlineScript(
        BRANCH_OPTIONS_BY_SYSTEM
      )
    )
    .replace(
      "__FORM_TRANSLATIONS__",
      serializeForInlineScript(
        FORM_TRANSLATIONS
      )
    )
    .trim();
}

export function registerMajorMatchForm(server) {
  registerAppResource(
    server,
    "AAUP Major Match Form",
    FORM_URI,
    {
      description:
        "Bilingual AAUP major-matching form for the 2026/2027 admission cycle.",
    },
    async () => ({
      contents: [
        {
          uri: FORM_URI,
          mimeType: RESOURCE_MIME_TYPE,
          text: createFormHtml(),
          _meta: {
            ui: {
              prefersBorder: true,
              csp: {
                connectDomains: [],
                resourceDomains: [],
              },
            },
          },
        },
      ],
    })
  );
}

export function registerShowFormTool(server) {
  server.registerTool(
    "show_major_match_form",
    {
      title: "Show AAUP Major Match Form",
      description:
        "Opens the bilingual AAUP major-matching form. Use this only after the student chooses the form or explicitly asks for a form, dropdown, or visual interface.",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
      },
      _meta: {
        ui: {
          resourceUri: FORM_URI,
          visibility: ["model", "app"],
        },
        "openai/outputTemplate": FORM_URI,
        "openai/toolInvocation/invoking":
          "Opening form...",
        "openai/toolInvocation/invoked":
          "Form opened.",
      },
    },
    async () => ({
      structuredContent: {},
      content: [
        {
          type: "text",
          text:
            "Use the bilingual form below to ask the advisor for initial AAUP major recommendations.",
        },
      ],
    })
  );
}