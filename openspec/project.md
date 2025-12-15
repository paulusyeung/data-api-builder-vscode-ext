# Project Context

## Purpose
This project is a monorepo collection of Visual Studio Code extensions designed to support **Microsoft Data API Builder (DAB)**. It provides tools for initializing, configuring, and managing DAB projects directly within VS Code. The suite includes extensions for adding entities (tables, views, stored procedures), generating MCP servers, and other utility functions. A C# helper library (`DataApiBuilder.Rest`) is also included to support backend operations.

## Tech Stack
- **Primary Languages**: 
  - **TypeScript** (Visual Studio Code Extensions)
  - **C#** (.NET 6.0) (Helper Libraries)
- **Runtime**: Node.js (v20.x compatible)
- **Frameworks**: 
  - Visual Studio Code Extension API
  - .NET Sdk
- **Build Tools**: 
  - `webpack` (Bundling)
  - `vsce` (Extension Packaging)
  - `tsc` (TypeScript Compiler)
  - `package.bat` (Custom build orchestration script)

## Project Conventions

### Code Style
- **Linting**: ESLint with `@typescript-eslint`.
- **Formatting**: Adheres to standard TypeScript/JavaScript conventions.
- **Language Features**: Uses modern TypeScript features and ES modules.
- **C#**: Follows .NET 6.0 standards with implicit usings and nullable reference types enabled.

### Architecture Patterns
- **Monorepo**: The repository is structured as a monorepo where each subdirectory (e.g., `add-data-api-builder`, `mcp-data-api-builder`) represents a distinct VS Code extension or library.
- **Orchestration**: A `package.bat` script at the root manages the build and packaging process for all extensions.
- **Shared Libraries**: `classlib-dab-rest` serves as a shared .NET library.

### Testing Strategy
- **Framework**: `vscode-test` and `mocha` for extension testing.
- **Scope**: Integration tests for VS Code commands and unit tests for logic.
- **Commands**: `npm test` triggers the test suite.

### Git Workflow
- **Branching**: `master` is the primary branch (inferred from repository URLs).
- **Versioning**: Each extension manages its own version (e.g., `0.1.0`, `0.0.1`).

## Domain Context
- **Data API Builder**: The extensions are deeply integrated with Microsoft Data API Builder, dealing with its configuration files (`dab-config.json`) and concepts (Entities, Restrictions, Relationships).
- **Databases**: Supports MS SQL Server (`mssql` dependency present) and likely other DAB-supported databases (PostgreSQL, MySQL, Cosmos DB).
- **MCP**: Contains an implementation for "Model Context Protocol" (`mcp-data-api-builder`), suggesting AI-agent integration capabilities.

## Important Constraints
- **VS Code Version**: Engines require `vscode` version `^1.95.0`.
- **Platform**: The build script `package.bat` is Windows API (`cmd`) specific.

## External Dependencies
- **npm modules**: `mssql` (Database interaction), `webpack` (Build).
- **.NET**: Requires .NET SDK for building the C# components.
