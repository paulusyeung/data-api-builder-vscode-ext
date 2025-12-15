# Design: Universal DAB Scaffolder Web GUI

## Architecture

### 1. Extension Host (Backend)
- **Role**: Validates connections, queries database schema, reads/writes `dab-config.json` to disk.
- **Services**:
    - `PostgresService`: Uses `pg` library to query `information_schema`.
    - `MssqlService`: Uses `mssql` library (reused from `poco` extension).
    - `ConfigService`: Manages `dab-config.json` parsing and serialization.

### 2. Webview (Frontend)
- **Role**: Renders the UI for user interaction.
- **Tech Stack**: React, VS Code Webview UI Toolkit.
- **Communication**: Request/Response pattern via `vscode.postMessage` handling messages like `CONNECT`, `FETCH_TABLES`, `GENERATE_CONFIG`.

### 3. Data Flow
1.  User opens command `DAB: Universal Scaffolder`.
2.  Webview requests current config state.
3.  User selects DB Type & enters connection string -> `CONNECT` msg.
4.  Backend connects & returns table list -> `TABLES_UPDATED` msg.
5.  User selects tables ->Backend generates in-memory config preview.
6.  User clicks "Save" -> Backend writes `dab-config.json`.

## Technical Decisions
- **Isolation**: New extension folder `universal-data-api-builder` to avoid breaking existing `poco`/`mobile`/`omnibus` extensions.
- **Drivers**: Direct use of node drivers (`pg`, `mssql`) instead of shelling out to `dab` CLI for inspection. `dab` CLI is only used for runtime if needed (out of scope for scaffolder).
