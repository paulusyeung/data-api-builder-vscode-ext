# Proposal: Create Universal DAB Scaffolder Web GUI

## Summary
Implement a new VS Code extension "Universal DAB Scaffolder" that provides a Web GUI to generate `dab-config.json` for both PostgreSQL and MSSQL. This replaces the need for separate CLI wrappers and offers a unified visual experience.

## Motivation
- **User Request**: User wants a "Web GUI" to easier select tables and database types (PG/MSSQL) and generate config.
- **Current State**: Existing extensions (`init`, `add`) are MSSQL-only and CLI-wrapper based. `visualize` is read-only.
- **Goal**: A modern, React-based Webview that streamlines the scaffolding process.

## Design Overview
See `design.md` for architectural details.
- New Extension: `universal-data-api-builder`
- Frontend: React + VS Code Webview UI Toolkit
- Backend: Node.js Extension Host with `pg` and `mssql` drivers.

## Risks
- **Complexity**: Managing state between Webview and Extension Host.
- **Dependencies**: Adding `pg` and building a React bundle.
