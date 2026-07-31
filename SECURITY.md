# Security Policy

## Reporting a Security Issue

Please report suspected security vulnerabilities privately to Arab American University before making them public.

Contact:

**Email:** [bakrihbassem@gmail.com]

Include:

* A description of the issue
* The affected endpoint or feature
* Steps needed to reproduce it
* The possible security impact
* Screenshots or logs that do not contain sensitive student information

Do not include passwords, access tokens, student records, identification documents, or other unnecessary personal information.

## Responsible Disclosure

Please allow AAUP reasonable time to investigate and correct a reported vulnerability before publicly disclosing it.

Do not:

* Access or modify student or university records
* Disrupt the service
* Use automated testing that creates excessive traffic
* Attempt to bypass access controls
* Download information that is not necessary to demonstrate the issue
* Perform testing against other AAUP systems without written authorization

## Supported Version

Security updates are applied to the latest production version of the AAUP Major Advisor.

| Version          | Supported |
| ---------------- | --------- |
| 1.x              | Yes       |
| Earlier versions | No        |

## Scope

This policy applies to the AAUP Major Advisor application and its public endpoints, including:

* `/mcp`
* `/healthz`
* `/readyz`
* `/.well-known/openai-apps-challenge`

It does not authorize testing of unrelated AAUP websites, networks, accounts, databases, or infrastructure.

## Sensitive Information

The Advisor does not require passwords, student portal credentials, payment details, identification numbers, medical records, or official documents.

Any accidentally received sensitive information should not be retained or redistributed.
