import test from "node:test";
import assert from "node:assert/strict";

import { validateAdmissionsData } from "../src/dataValidation.js";
import { createReport } from "../src/report.js";

import {
  detectBranch,
  detectCertificateSystem,
  loadAdmissionSystems,
  loadMajors,
  parseBoolean,
  parseNumber,
} from "../src/utils.js";

/*
 * Use a fixed date during the active
 * 2026 admissions cycle.
 *
 * This prevents the tests from
 * changing based on today's date.
 */
const ACTIVE_ADMISSIONS_DATE =
  new Date("2026-07-30T00:00:00Z");

function createActiveReport(args) {
  return createReport(
    args,
    ACTIVE_ADMISSIONS_DATE
  );
}

function findFirstEligibleProgram(report) {
  const match = report.match(
    /Preliminarily Eligible Programs:\s*\n1\. ([^\n]+)/
  );

  assert.ok(
    match,
    "The report should contain at least one eligible program."
  );

  return match[1];
}

/*
 * Data loading and validation
 */

test(
  "loads the AAUP admissions dataset",
  () => {
    const majors = loadMajors();
    const admissionSystems =
      loadAdmissionSystems();

    assert.ok(
      Array.isArray(majors)
    );

    assert.ok(
      majors.length > 0
    );

    assert.equal(
      admissionSystems.academicYear,
      "2026-2027"
    );

    assert.equal(
      admissionSystems.lastVerifiedOn,
      "2026-07-23"
    );
  }
);

test(
  "all program IDs are unique",
  () => {
    const majors = loadMajors();

    const ids = majors.map(
      (major) => major.id
    );

    assert.equal(
      new Set(ids).size,
      ids.length
    );
  }
);

test(
  "data validation rejects duplicate program IDs",
  () => {
    const majors =
      structuredClone(
        loadMajors()
      );

    const admissionSystems =
      structuredClone(
        loadAdmissionSystems()
      );

    majors[1].id =
      majors[0].id;

    assert.throws(
      () =>
        validateAdmissionsData(
          majors,
          admissionSystems
        ),
      /Duplicate program ID/
    );
  }
);

/*
 * Input normalization
 */

test(
  "parses English and Arabic numbers",
  () => {
    assert.equal(
      parseNumber("84.5%"),
      84.5
    );

    assert.equal(
      parseNumber("٨٤٫٥٪"),
      84.5
    );

    assert.equal(
      parseNumber("۹۰"),
      90
    );

    assert.equal(
      parseNumber("not a number"),
      null
    );
  }
);

test(
  "parses English and Arabic boolean values",
  () => {
    assert.equal(
      parseBoolean("yes"),
      true
    );

    assert.equal(
      parseBoolean("نعم"),
      true
    );

    assert.equal(
      parseBoolean("no"),
      false
    );

    assert.equal(
      parseBoolean("لا"),
      false
    );

    assert.equal(
      parseBoolean("unknown"),
      null
    );
  }
);

test(
  "recognizes certificate systems",
  () => {
    assert.equal(
      detectCertificateSystem(
        "Tawjihi"
      ),
      "Tawjihi"
    );

    assert.equal(
      detectCertificateSystem(
        "الثانوية العامة"
      ),
      "Tawjihi"
    );

    assert.equal(
      detectCertificateSystem(
        "International Baccalaureate"
      ),
      "IB"
    );

    assert.equal(
      detectCertificateSystem(
        "British system"
      ),
      "IGCSE_GCSE_GCE"
    );
  }
);

test(
  "recognizes certificate branches",
  () => {
    assert.equal(
      detectBranch(
        "Scientific stream"
      ),
      "Scientific"
    );

    assert.equal(
      detectBranch("علمي"),
      "Scientific"
    );

    assert.equal(
      detectBranch("أدبي"),
      "Literary"
    );

    assert.equal(
      detectBranch(
        "Information Technology"
      ),
      "Information Technology"
    );
  }
);

/*
 * English report behavior
 */

test(
  "creates an English eligibility report",
  () => {
    const report =
      createActiveReport({
        certificateSystem:
          "Tawjihi",

        certificateBranch:
          "Scientific",

        average: 95,

        campusPreference:
          "Either",

        language: "en",

        maxResults: 3,
      });

    assert.match(
      report,
      /AAUP Student Major Match Report/
    );

    assert.match(
      report,
      /Preliminarily Eligible Programs/
    );

    assert.match(
      report,
      /Admissions data last verified: July 23, 2026/
    );

    assert.match(
      report,
      /Application cycle/
    );

    assert.doesNotMatch(
      report,
      /admissions information requires an update/
    );
  }
);

test(
  "does not describe unpersonalized results as top matches",
  () => {
    const report =
      createActiveReport({
        certificateSystem:
          "Tawjihi",

        certificateBranch:
          "Scientific",

        average: 95,

        campusPreference:
          "Either",

        language: "en",
      });

    assert.match(
      report,
      /Preliminarily Eligible Programs/
    );

    assert.doesNotMatch(
      report,
      /Top Preliminarily Eligible Matches/
    );

    assert.match(
      report,
      /listed alphabetically rather than presented as best matches/
    );
  }
);

test(
  "budget does not secretly change unpersonalized ranking",
  () => {
    const normalReport =
      createActiveReport({
        certificateSystem:
          "Tawjihi",

        certificateBranch:
          "Scientific",

        average: 95,

        campusPreference:
          "Either",

        language: "en",
      });

    const lowBudgetReport =
      createActiveReport({
        certificateSystem:
          "Tawjihi",

        certificateBranch:
          "Scientific",

        average: 95,

        campusPreference:
          "Either",

        budget: 1,

        language: "en",
      });

    assert.equal(
      findFirstEligibleProgram(
        normalReport
      ),

      findFirstEligibleProgram(
        lowBudgetReport
      )
    );
  }
);

test(
  "uses interests for personalized ranking",
  () => {
    const report =
      createActiveReport({
        certificateSystem:
          "Tawjihi",

        certificateBranch:
          "Scientific",

        average: 95,

        campusPreference:
          "Either",

        interests:
          "cybersecurity and information security",

        careerGoals:
          "work as a cybersecurity engineer",

        language: "en",
      });

    assert.match(
      report,
      /Top Preliminarily Eligible Matches/
    );

    assert.match(
      report,
      /Program order uses the stated interests and career goals/
    );

    const match = report.match(
      /Top Preliminarily Eligible Matches:\s*\n1\. ([^\n]+)/
    );

    assert.ok(
      match,
      "The personalized report should contain a first match."
    );

    assert.match(
      match[1],
      /Cybersecurity/i
    );
  }
);

/*
 * Arabic report behavior
 */

test(
  "creates an Arabic eligibility report",
  () => {
    const report =
      createActiveReport({
        certificateSystem:
          "Tawjihi",

        certificateBranch:
          "علمي",

        average: "٩٥",

        campusPreference:
          "أي حرم جامعي",

        language: "ar",

        maxResults: 3,
      });

    assert.match(
      report,
      /تقرير اختيار التخصص في الجامعة العربية الأمريكية/
    );

    assert.match(
      report,
      /التخصصات التي يستوفي الطالب شروطها الأولية/
    );

    assert.match(
      report,
      /آخر تحقق من بيانات القبول/
    );

    assert.match(
      report,
      /هذا التقرير لا يضمن القبول/
    );
  }
);

/*
 * Error and review behavior
 */

test(
  "rejects an unreadable average",
  () => {
    const report =
      createActiveReport({
        certificateSystem:
          "Tawjihi",

        certificateBranch:
          "Scientific",

        average:
          "not available",

        language: "en",
      });

    assert.match(
      report,
      /I could not read the student's average/
    );
  }
);

test(
  "rejects an average outside 0 to 100",
  () => {
    const report =
      createActiveReport({
        certificateSystem:
          "Tawjihi",

        certificateBranch:
          "Scientific",

        average: 105,

        language: "en",
      });

    assert.match(
      report,
      /The average must be between 0 and 100/
    );
  }
);

test(
  "foreign certificates require official review",
  () => {
    const report =
      createActiveReport({
        certificateSystem:
          "IB",

        certificateBranch:
          "Scientific",

        average: 90,

        equivalencyConfirmed:
          true,

        campusPreference:
          "Either",

        language: "en",
      });

    assert.match(
      report,
      /Matches Requiring Official Certificate or Classification Review/
    );

    assert.match(
      report,
      /Official review required/
    );

    assert.match(
    report,
    /The certificate must first be converted to an official equivalent percentage and reviewed by admissions/
    );
  }
);

test(
  "pauses matching after the application cycle ends",
  () => {
    const expiredDate =
      new Date(
        "2026-10-01T00:00:00Z"
      );

    const report =
      createReport(
        {
          certificateSystem:
            "Tawjihi",

          certificateBranch:
            "Scientific",

          average: 95,

          language: "en",
        },
        expiredDate
      );

    assert.match(
      report,
      /AAUP admissions information requires an update/
    );

    assert.match(
      report,
      /the recorded application cycle has ended/
    );

    assert.doesNotMatch(
      report,
      /Preliminarily Eligible Programs:/
    );
  }
);