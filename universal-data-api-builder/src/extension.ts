import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { PostgresService } from './services/PostgresService';
import { MssqlService } from './services/MssqlService';
import { ConfigService } from './services/ConfigService';

export function activate(context: vscode.ExtensionContext) {
    const disposable = vscode.commands.registerCommand('dabExtension.universalScaffold', () => {
        UniversalScaffolderPanel.createOrShow(context.extensionUri, context);
    });

    context.subscriptions.push(disposable);
}

class UniversalScaffolderPanel {
    public static currentPanel: UniversalScaffolderPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];

    private _pgService = new PostgresService();
    private _mssqlService = new MssqlService();

    private _currentDbType: string = '';
    private _currentConnStr: string = '';

    public static createOrShow(extensionUri: vscode.Uri, context: vscode.ExtensionContext) {
        if (UniversalScaffolderPanel.currentPanel) {
            UniversalScaffolderPanel.currentPanel._panel.reveal(vscode.ViewColumn.One);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'universalScaffolder',
            'Universal DAB Scaffolder',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'out', 'webview-ui')]
            }
        );

        UniversalScaffolderPanel.currentPanel = new UniversalScaffolderPanel(panel, extensionUri, context);
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, context: vscode.ExtensionContext) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        this._panel.webview.html = this._getHtmlForWebview(this._panel.webview);

        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Load saved state
        const savedDbType = context.globalState.get<string>('dab.dbType') || 'mssql';
        const savedConnStr = context.globalState.get<string>('dab.connectionString') || '';

        // wait for webview to be ready (naive approach, better to have a 'ready' message from UI)
        // But for simplicity, we can just send it. The UI might miss it if not ready.
        // Better pattern: UI sends 'ready', Extension replies with 'init'.

        this._panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.command) {
                    case 'ready':
                        this._panel.webview.postMessage({
                            command: 'init',
                            dbType: savedDbType,
                            connectionString: savedConnStr
                        });
                        break;
                    case 'connect':
                        // Save state
                        await context.globalState.update('dab.dbType', message.dbType);
                        await context.globalState.update('dab.connectionString', message.connectionString);
                        await this._handleConnect(message);
                        break;
                    case 'generateConfig':
                        await this._handleGenerate(message);
                        break;
                }
            },
            null,
            this._disposables
        );
    }

    private async _handleConnect(message: any) {
        try {
            this._currentDbType = message.dbType;
            this._currentConnStr = message.connectionString;

            let tables: any[] = [];
            if (message.dbType === 'postgres') {
                await this._pgService.connect(message.connectionString);
                tables = await this._pgService.getTablesAndViews();
            } else if (message.dbType === 'mssql') {
                await this._mssqlService.connect(message.connectionString);
                tables = await this._mssqlService.getTablesAndViews();
            }

            this._panel.webview.postMessage({ command: 'tablesLoaded', tables });
        } catch (error: any) {
            vscode.window.showErrorMessage(`Connection failed: ${error.message}`);
            this._panel.webview.postMessage({ command: 'error', error: error.message });
        }
    }

    private async _handleGenerate(message: any) {
        try {
            const folders = vscode.workspace.workspaceFolders;
            if (!folders) {
                throw new Error('No workspace open');
            }

            const configService = new ConfigService(folders[0].uri.fsPath);

            const outputPath = await configService.generateConfig(
                this._currentDbType === 'postgres' ? 'postgresql' : 'mssql',
                this._currentConnStr,
                message.selectedTables,
                message.filename
            );

            vscode.window.showInformationMessage(`DAB Config generated at ${outputPath}`);

            // Open the file
            const doc = await vscode.workspace.openTextDocument(outputPath);
            vscode.window.showTextDocument(doc);

        } catch (error: any) {
            vscode.window.showErrorMessage(`Generation failed: ${error.message}`);
        }
    }

    public dispose() {
        UniversalScaffolderPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
        this._pgService.disconnect();
        this._mssqlService.disconnect();
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'out', 'webview-ui', 'index.js'));
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'out', 'webview-ui', 'index.css'));

        return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="${styleUri}" rel="stylesheet">
      <title>Universal DAB Scaffolder</title>
    </head>
    <body>
      <div id="root"></div>
      <script type="module" src="${scriptUri}"></script>
    </body>
    </html>`;
    }
}
