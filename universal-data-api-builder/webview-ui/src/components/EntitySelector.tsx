import React, { useState } from 'react';
import { vscode } from '../utilities/vscode';

interface EntitySelectorProps {
    tables: Array<{ schema: string; name: string; type: string }>;
    onBack: () => void;
}

export const EntitySelector: React.FC<EntitySelectorProps> = ({ tables, onBack }) => {
    const [selected, setSelected] = useState<string[]>([]);
    const [filename, setFilename] = useState('dab-config.json');
    const [loading, setLoading] = useState(false);

    const handleToggle = (id: string) => {
        setSelected(prev =>
            prev.includes(id)
                ? prev.filter(x => x !== id)
                : [...prev, id]
        );
    };

    const handleGenerate = () => {
        setLoading(true);
        vscode.postMessage({
            command: 'generateConfig',
            selectedTables: tables.filter(t => selected.includes(`${t.schema}.${t.name}`)),
            filename
        });
    };

    return (
        <div className="container">
            <h2>Select Entities</h2>
            <p>Select the tables and views you want to expose via Data API Builder.</p>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Output Filename</label>
                <vscode-text-field
                    value={filename}
                    onInput={(e: any) => setFilename(e.target.value)}
                    style={{ width: '100%' }}
                ></vscode-text-field>
            </div>

            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--vscode-foreground)' }}>
                    <thead>
                        <tr style={{ textAlign: 'left' }}>
                            <th>Select</th>
                            <th>Schema</th>
                            <th>Name</th>
                            <th>Type</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tables.map(table => {
                            const id = `${table.schema}.${table.name}`;
                            return (
                                <tr key={id}>
                                    <td>
                                        <vscode-checkbox
                                            checked={selected.includes(id)}
                                            onChange={() => handleToggle(id)}
                                        ></vscode-checkbox>
                                    </td>
                                    <td>{table.schema}</td>
                                    <td>{table.name}</td>
                                    <td>{table.type}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="button-group">
                <vscode-button appearance="secondary" onClick={onBack}>Back</vscode-button>
                <vscode-button onClick={handleGenerate} disabled={loading || selected.length === 0}>
                    {loading ? 'Generating...' : 'Generate Config'}
                </vscode-button>
            </div>
        </div>
    );
};
