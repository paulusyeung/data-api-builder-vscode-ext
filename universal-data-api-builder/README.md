# Universal Data API Builder Scaffolder

This VS Code extension provides a **Web GUI** to scaffold `dab-config.json` files for [Data API Builder](https://github.com/Azure/data-api-builder). It supports both **PostgreSQL** and **Microsoft SQL Server**.

## Features

- **Universal Support**: One tool for both Postgres and MSSQL.
- **Visual Interface**: React-based Webview to connect to databases and select tables.
- **Config Generation**: Automatically generates a valid `dab-config.json` in your workspace.

## Prerequisites

- **Node.js**: v18 or higher.
- **VS Code**: v1.96.0 or higher.
- **Data API Builder CLI**: **Required**. You must have the `dab` CLI installed globally.
    ```bash
    dotnet tool install -g Microsoft.DataApiBuilder
    ```

## Development Setup

The extension is split into two parts: the **Extension Host** (Node.js) and the **Webview UI** (React/Vite). You need to build both.

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Build the Frontend (Webview)**:
    This compiles the React app into `out/webview-ui`.
    ```bash
    npm run build:webview
    ```

3.  **Compile the Backend (Extension)**:
    This compiles the TypeScript extension code into `out`.
    ```bash
    npm run compile
    ```

> **Tip**: You can run `npm run watch` to automatically recompile the backend when files change. For the frontend, you need to re-run `npm run build:webview` after changes.

## Running the Extension

1.  Open the `universal-data-api-builder` folder in VS Code.
2.  Press **F5** to start debugging. This will open a new "Extension Development Host" window.
3.  **Important**: In the new debug window, verify that a workspace folder is open (use File > Open Folder... to select the location where you want to save the generated `dab-config.json` file). The extension requires an open folder to save the generated `dab-config.json` file.
4.  Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`).
5.  Run the command: **`DAB: Universal Scaffolder`**.

## Usage Guide

1.  **Connect**:
    -   Select your Database Type (**PostgreSQL** or **MSSQL**).
    -   Enter a valid Connection String.
        -   *Postgres Example*: `postgres://user:password@localhost:5432/mydb`
        -   *MSSQL Example*: `Server=localhost;Database=mydb;User Id=sa;Password=yourStrong(!)Password;TrustServerCertificate=true;`
    -   Click **Connect**.

2.  **Select Entities**:
    -   Wait for the table list to load.
    -   Use the checkboxes to select which tables/views you want to expose.
    -   Click **Generate Config**.

3.  **Review**:
    -   The extension will generate `dab-config.json` in your workspace root.
    -   It will automatically open the file for you to review.
