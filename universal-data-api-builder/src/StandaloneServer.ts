import express, { Request, Response } from 'express';
import cors from 'cors';
import * as bodyParser from 'body-parser';
import * as path from 'path';
import * as fs from 'fs';
import { PostgresService } from './services/PostgresService';
import { MssqlService } from './services/MssqlService';
import { ConfigService } from './services/ConfigService';
import { exec } from 'child_process';

const app = express();
const port = 5000;

app.use(cors());
app.use(bodyParser.json());

// Services
const pgService = new PostgresService();
const mssqlService = new MssqlService();

// State Persistence
const stateFile = path.join(process.cwd(), '.dab-scaffolder-state.json');
function loadState() {
    if (fs.existsSync(stateFile)) {
        return JSON.parse(fs.readFileSync(stateFile, 'utf8'));
    }
    return { dbType: 'mssql', connectionString: '', targetFolder: process.cwd() };
}
function saveState(state: any) {
    const currentState = loadState();
    const newState = { ...currentState, ...state };
    fs.writeFileSync(stateFile, JSON.stringify(newState, null, 2));
}

// Serve Frontend
// Assuming the build output is in out/webview-ui/webview-ui
const webviewPath = path.join(__dirname, 'webview-ui');
app.use(express.static(webviewPath));

// API Endpoint mimicking VS Code Message Passing
app.post('/api/message', async (req: Request, res: Response) => {
    const message = req.body;
    console.log(`Received command: ${message.command}`);

    try {
        switch (message.command) {
            case 'ready': {
                const state = loadState();
                res.json({
                    command: 'init',
                    dbType: state.dbType,
                    connectionString: state.connectionString,
                    targetFolder: state.targetFolder
                });
                break;
            }
            case 'connect': {
                saveState({ dbType: message.dbType, connectionString: message.connectionString });
                let tables: any[] = [];
                if (message.dbType === 'postgres') {
                    await pgService.connect(message.connectionString);
                    tables = await pgService.getTablesAndViews();
                } else if (message.dbType === 'mssql') {
                    await mssqlService.connect(message.connectionString);
                    tables = await mssqlService.getTablesAndViews();
                }
                res.json({ command: 'tablesLoaded', tables });
                break;
            }
            case 'generateConfig': {
                saveState({ targetFolder: message.targetFolder });
                const configService = new ConfigService(message.targetFolder);
                const dbType = loadState().dbType;
                const connectionString = loadState().connectionString;

                const outputPath = await configService.generateConfig(
                    dbType === 'postgres' ? 'postgresql' : 'mssql',
                    connectionString,
                    message.selectedTables,
                    message.filename
                );

                console.log(`Generated config at: ${outputPath}`);
                res.json({ command: 'generated', path: outputPath });
                break;
            }
            case 'pickFolder': {
                // Use PowerShell to trigger a native Windows folder picker
                const psCommand = "Add-Type -AssemblyName System.Windows.Forms; $f = New-Object System.Windows.Forms.FolderBrowserDialog; if ($f.ShowDialog() -eq 'OK') { $f.SelectedPath }";
                exec(`powershell -Command "${psCommand}"`, (error, stdout) => {
                    const pickedPath = stdout.trim();
                    if (pickedPath) {
                        res.json({ command: 'folderPicked', path: pickedPath });
                    } else {
                        res.json({ command: 'error', error: 'Folder selection canceled' });
                    }
                });
                break;
            }
            default:
                res.status(400).json({ error: 'Unknown command' });
        }
    } catch (error: any) {
        console.error(`Error handling ${message.command}:`, error.message);
        res.json({ command: 'error', error: error.message });
    }
});

// Catch-all to serve index.html for SPA (must be the last route)
app.use((req: Request, res: Response) => {
    // Handle potential nested index.html if Vite builds it into a subfolder
    const potentialPaths = [
        path.join(webviewPath, 'index.html'),
        path.join(webviewPath, 'webview-ui', 'index.html')
    ];
    const indexPath = potentialPaths.find(p => fs.existsSync(p)) || potentialPaths[0];
    res.sendFile(indexPath);
});

app.listen(port, () => {
    const url = `http://localhost:${port}`;
    console.log(`Standalone DAB Scaffolder running at ${url}`);

    // Auto-open browser on Windows
    exec(`start ${url}`);
});
