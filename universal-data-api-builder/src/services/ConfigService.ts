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
        tables: Array<{ schema: string; name: string; type: 'table' | 'view'; keyFields: string[]; columns: string[] }>,
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
            const cliDbType = dbType === 'postgres' ? 'postgresql' : 'mssql';
            await this._runCommand(`dab init --database-type ${cliDbType} --connection-string "${connectionString}" --config "${configFile}"`);
        }

        // 3. Add/Update entities
        // Sort tables by name to ensure consistent iteration order
        const sortedTables = [...tables].sort((a, b) => a.name.localeCompare(b.name));

        for (const table of sortedTables) {
            const entityName = table.name;
            const source = `${table.schema}.${table.name}`;
            const keyFieldsStr = table.keyFields.length > 0 ? `--source.key-fields "${table.keyFields.join(',')}"` : '';
            const sourceTypeStr = table.type === 'view' ? '--source.type "view"' : '';
            const restStr = `--rest "${entityName}"`;

            // Note: DAB add doesn't support --map directly, we usually do dab add then dab update for mapping.
            // Or use dab add with minimal info then update.

            try {
                // TRY ADD FIRST
                // dab add <name> --source <source> [options]
                let addCmd = `dab add "${entityName}" --source "${source}" ${sourceTypeStr} ${keyFieldsStr} ${restStr} --permissions "anonymous:*" --config "${configFile}"`;
                await this._runCommand(addCmd);
            } catch (error) {
                // IF ADD FAILS, TRY UPDATE
                let updateCmd = `dab update "${entityName}" --source "${source}" ${sourceTypeStr} ${keyFieldsStr} ${restStr} --config "${configFile}"`;
                await this._runCommand(updateCmd);
            }

            // 4. MAPPING
            // dab update <name> --map "Col1:Col1,Col2:Col2..."
            if (table.columns && table.columns.length > 0) {
                const mapValue = table.columns.map(c => `${c}:${c}`).join(',');
                try {
                    await this._runCommand(`dab update "${entityName}" --map "${mapValue}" --config "${configFile}"`);
                } catch (mapError) {
                    console.warn(`Failed to update mapping for ${entityName}:`, mapError);
                }
            }
        }

        // 5. Final pass: Alphabetize the entities object in the JSON file
        try {
            const configContent = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            if (configContent.entities) {
                const sortedEntities: any = {};
                Object.keys(configContent.entities)
                    .sort()
                    .forEach(key => {
                        sortedEntities[key] = configContent.entities[key];
                    });
                configContent.entities = sortedEntities;
                fs.writeFileSync(configPath, JSON.stringify(configContent, null, 2), 'utf8');
            }
        } catch (sortError) {
            console.warn(`Failed to perform final sort on dab-config.json:`, sortError);
        }

        return configPath;
    }

    private async _runCommand(command: string): Promise<string> {
        const { stdout, stderr } = await exec(command, { cwd: this.workspaceRoot });
        if (stderr && !stderr.includes('Suggested update') && !stderr.includes('already exists')) {
            console.log(`DAB CLI Stderr: ${stderr}`);
        }
        return stdout;
    }
}
