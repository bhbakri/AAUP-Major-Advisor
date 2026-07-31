import {
  McpServer,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  APP_NAME,
  APP_VERSION,
} from "./version.js";
import {
  registerMajorMatchForm,
  registerShowFormTool,
} from "./majorMatchForm.js";
import {
  registerReportTool,
} from "./majorMatchTools.js";

const SERVER_INSTRUCTIONS =
  "Help students explore AAUP bachelor programs for academic year 2026/2027. " +
  "When a student generally asks for help choosing a major or checking eligibility and has not selected an interaction method, first ask whether they prefer to fill out a form or answer through chat and receive recommendations as text. " +
  "Do not open the form automatically unless the student explicitly chooses the form or asks for a form, dropdown, or visual interface. " +
  "If the student chooses chat, collect the required information conversationally and call create_major_match_report once enough information is available. The text recommendations still work without opening the form. " +
  "Determine the response language from the language the student is using. Use Arabic for Arabic conversations and English for English conversations. An explicit language choice overrides automatic language selection. Always pass language as ar or en to create_major_match_report. " +
  "If the student chooses the form, call show_major_match_form. The form has an English and Arabic language toggle. " +
  "For Tawjihi, collect the branch and overall average. Ask for the core-subject average only if the student may need an alternative Dentistry, Pharmacy, or Scientific-stream Engineering route. " +
  "For Bagrut, collect the percentage and Scientific or Literary classification when known. " +
  "For IB, IGCSE, GCSE, GCE, SAT, AP, CLEP, Saudi, or another foreign certificate, ask for the official AAUP or Palestinian Ministry equivalent percentage when available and explain that final eligibility requires official review. " +
  "Do not claim that a preliminary match guarantees admission. " +
  "Do not call multiple tools at the same time.";

export function createMajorAdvisorServer() {
  const server = new McpServer(
    {
      name: APP_NAME,
      version: APP_VERSION,
    },
    {
      instructions:
        SERVER_INSTRUCTIONS,
    }
  );

  registerMajorMatchForm(server);
  registerShowFormTool(server);
  registerReportTool(server);

  return server;
}