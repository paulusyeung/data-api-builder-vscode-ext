import React, { useState, useEffect } from 'react';
import { vscode } from '../utilities/vscode';

interface ConnectFormProps {
    isLoading: boolean;
    initialState?: { dbType: string; connectionString: string };
}

export const ConnectForm: React.FC<ConnectFormProps> = ({ isLoading, initialState }) => {
    const [dbType, setDbType] = useState('mssql');
    const [connStr, setConnStr] = useState('');

    useEffect(() => {
        if (initialState) {
            setDbType(initialState.dbType);
            setConnStr(initialState.connectionString);
        }
    }, [initialState]);

    const handleConnect = () => {
        vscode.postMessage({
            command: 'connect',
            dbType,
            connectionString: connStr
        });
    };

    return (
        <div className="container">
            <h2>Connect to Database</h2>

            <div className="form-group">
                <label>Database Type</label>
                <vscode-dropdown value={dbType} onChange={(e: any) => setDbType(e.target.value)}>
                    <vscode-option value="mssql">Microsoft SQL Server</vscode-option>
                    <vscode-option value="postgres">PostgreSQL</vscode-option>
                </vscode-dropdown>
            </div>

            <div className="form-group">
                <label>Connection String</label>
                <vscode-text-field
                    placeholder="Server=...;Database=...;"
                    value={connStr}
                    onInput={(e: any) => setConnStr(e.target.value)}
                    style={{ width: '100%' }}
                ></vscode-text-field>
            </div>

            <div className="button-group">
                <vscode-button onClick={handleConnect} disabled={isLoading || !connStr}>
                    {isLoading ? 'Connecting...' : 'Connect'}
                </vscode-button>
            </div>
        </div>
    );
};
