import * as fs from 'fs';
import * as path from 'path';
import * as cp from 'child_process';
import * as util from 'util';

const exec = util.promisify(cp.exec);

export class ConfigService {
    constructor(private workspaceRoot: string) { }

    async generateConfig(
        dbType: string,
        connectionString: string,
        tables: Array<{ schema: string; name: string; type: string }>,
        filename: string = 'dab-config.json'
    ): Promise<string> {
        const configFile = filename;
        const configPath = path.join(this.workspaceRoot, configFile);

        // 1. Check if DAB CLI is installed
        try {
            await this._runCommand('dab --version');
        } catch (e) {
            throw new Error('DAB CLI is not installed or not in PATH. Please run "dotnet tool install -g Microsoft.DataApiBuilder".');
        }

        // 2. Initialize if file does not exist
        if (!fs.existsSync(configPath)) {
            // dab init --database-type <type> --connection-string <string> --config <file>
            // Note: dab init wants 'mssql' or 'postgresql', which matches our valid types usually but let's map carefully.
            // Our internal dbType: 'mssql' | 'postgres' (from UI)
            // DAB CLI types: 'mssql', 'postgresql', 'cosmosdb_js', 'mysql'
            const cliDbType = dbType === 'postgres' ? 'postgresql' : 'mssql';

            await this._runCommand(`dab init --database-type ${cliDbType} --connection-string "${connectionString}" --config "${configFile}"`);
        } else {
            // If file exists, maybe we should warn? Or just assume the user wants to append?
            // User requested "allow update", so we just proceed to add entities.
        }

        // 3. Add entities
        for (const table of tables) {
            const entityName = table.name; // Simple friendly name
            const source = `${table.schema}.${table.name}`;

            try {
                // dab add <name> --source <source> --permissions "anonymous:*" --config <file>
                // DAB might error if entity exists.
                await this._runCommand(`dab add "${entityName}" --source "${source}" --permissions "anonymous:*" --config "${configFile}"`);
            } catch (error: any) {
                // If it fails, check if it's because it already exists. 
                // We can try 'dab update' or just log it.
                // DAB CLI doesn't have an easy "add or update" flag.
                // For now, if add fails, we assume it exists and try 'dab update' to ensure permissions? 
                // Actually 'dab update' updates the *entity configuration*.
                // Let's try to update sources and permissions if add fails.
                try {
                    await this._runCommand(`dab update "${entityName}" --source "${source}" --permissions "anonymous:*" --config "${configFile}"`);
                } catch (updateError: any) {
                    console.warn(`Failed to add or update entity ${entityName}: ${updateError.message}`);
                }
            }
        }

        return configPath;
    }

    private async _runCommand(command: string): Promise<string> {
        // Execute in workspace root
        const { stdout, stderr } = await exec(command, { cwd: this.workspaceRoot });
        if (stderr && !stderr.includes('Suggested update')) {
            // dab sometimes writes non-error info to stderr? No, usually it's clean.
            // But let's log it if present.
            console.log(`DAB CLI Stderr: ${stderr}`);
        }
        return stdout;
    }
}
