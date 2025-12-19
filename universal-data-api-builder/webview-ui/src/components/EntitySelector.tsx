import React, { useState } from 'react';
import { vscode } from '../utilities/vscode';

interface EntityMetadata {
    schema: string;
    name: string;
    type: 'table' | 'view';
    keyFields: string[];
    columns: string[];
}

interface EntitySelectorProps {
    tables: EntityMetadata[];
    targetFolder: string;
    onBack: () => void;
}

export const EntitySelector: React.FC<EntitySelectorProps> = ({ tables, targetFolder, onBack }) => {
    const [selectedTables, setSelectedTables] = useState<string[]>([]);
    const [selectedViews, setSelectedViews] = useState<string[]>([]);
    const [viewKeys, setViewKeys] = useState<Record<string, string[]>>({});

    const [filename, setFilename] = useState('dab-config.json');
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'tables' | 'views'>('tables');

    const handleToggleTable = (id: string) => {
        setSelectedTables(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleToggleView = (id: string) => {
        setSelectedViews(prev => {
            const isSelected = prev.includes(id);
            if (isSelected) {
                return prev.filter(x => x !== id);
            } else {
                if (!viewKeys[id]) {
                    setViewKeys(vk => ({ ...vk, [id]: [] }));
                }
                return [...prev, id];
            }
        });
    };

    const handleKeyToggle = (id: string, col: string) => {
        setViewKeys(prev => {
            const current = prev[id] || [];
            if (current.includes(col)) {
                return { ...prev, [id]: current.filter(c => c !== col) };
            } else {
                return { ...prev, [id]: [...current, col] };
            }
        });
    };

    const handleBrowse = () => {
        vscode.postMessage({ command: 'pickFolder' });
    };

    const handleGenerate = (type: 'table' | 'view') => {
        setLoading(true);
        const filteredSelected = tables
            .filter(t => t.type === type && (type === 'table' ? selectedTables : selectedViews).includes(`${t.schema}.${t.name}`))
            .map(t => {
                const id = `${t.schema}.${t.name}`;
                return {
                    ...t,
                    keyFields: t.type === 'view' ? (viewKeys[id] || []) : t.keyFields
                };
            });

        vscode.postMessage({
            command: 'generateConfig',
            selectedTables: filteredSelected,
            filename,
            targetFolder
        });
    };

    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [generatedPath, setGeneratedPath] = useState('');

    React.useEffect(() => {
        const handleGenerated = (e: any) => {
            setLoading(false);
            setGeneratedPath(e.detail.path);
            setShowSuccessModal(true);
        };
        window.addEventListener('dab-generated', handleGenerated);
        return () => window.removeEventListener('dab-generated', handleGenerated);
    }, []);

    const resetSelections = () => {
        setSelectedTables([]);
        setSelectedViews([]);
        setViewKeys({});
        setShowSuccessModal(false);
    };

    const tableEntities = tables.filter(t => t.type === 'table');
    const viewEntities = tables.filter(t => t.type === 'view');

    return (
        <div className="container">
            {showSuccessModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-icon">✓</div>
                        <h3 className="modal-title">Generation Successful!</h3>
                        <p className="modal-message">
                            Your DAB configuration has been generated successfully at:<br />
                            <code style={{ fontSize: '0.8rem', wordBreak: 'break-all', display: 'block', marginTop: '10px', padding: '8px', background: 'var(--bg-primary)', borderRadius: '4px' }}>
                                {generatedPath}
                            </code>
                        </p>
                        <vscode-button onClick={resetSelections} style={{ width: '100%' }}>
                            Got it, reset selections
                        </vscode-button>
                    </div>
                </div>
            )}

            <header style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <h1 style={{ color: 'var(--accent-primary)', fontSize: '1.5rem', marginBottom: '0.25rem' }}>Configuration Details</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Specify output location and select entities</p>
            </header>

            <section className="config-section">
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block' }}>Output Location</label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <vscode-text-field
                            value={targetFolder}
                            readOnly
                            style={{ flex: 1 }}
                        ></vscode-text-field>
                        <vscode-button appearance="secondary" onClick={handleBrowse}>Browse...</vscode-button>
                    </div>
                </div>
                <div className="form-group">
                    <label style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block' }}>Config Filename</label>
                    <vscode-text-field
                        value={filename}
                        onInput={(e: any) => setFilename(e.target.value)}
                        style={{ width: '100%' }}
                    ></vscode-text-field>
                </div>
            </section>

            <section className="selector-section" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                <div className="index-tabs-container" style={{ display: 'flex', gap: '4px', marginBottom: '-1px', zIndex: 2 }}>
                    <div
                        onClick={() => setActiveTab('tables')}
                        className={`index-tab ${activeTab === 'tables' ? 'active' : ''}`}
                        style={{ cursor: 'pointer', transition: 'all var(--transition-speed)' }}
                    >
                        TABLES ({selectedTables.length})
                    </div>
                    <div
                        onClick={() => setActiveTab('views')}
                        className={`index-tab ${activeTab === 'views' ? 'active' : ''}`}
                        style={{ cursor: 'pointer', transition: 'all var(--transition-speed)' }}
                    >
                        VIEWS ({selectedViews.length})
                    </div>
                </div>

                <div
                    className="tab-content-container"
                    style={{
                        flex: 1,
                        padding: '1rem',
                        minHeight: 0,
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                >
                    {activeTab === 'tables' && (
                        <EntityTable
                            entities={tableEntities}
                            selected={selectedTables}
                            onToggle={handleToggleTable}
                            isView={false}
                        />
                    )}
                    {activeTab === 'views' && (
                        <EntityTable
                            entities={viewEntities}
                            selected={selectedViews}
                            onToggle={handleToggleView}
                            viewKeys={viewKeys}
                            onKeyToggle={handleKeyToggle}
                            isView={true}
                        />
                    )}

                    <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
                        <vscode-button
                            onClick={() => handleGenerate(activeTab === 'tables' ? 'table' : 'view')}
                            disabled={loading || (activeTab === 'tables' ? selectedTables.length === 0 : selectedViews.length === 0)}
                            style={{ height: '40px', padding: '0 30px' }}
                        >
                            {loading ? 'Generating...' : `Generate ${activeTab === 'tables' ? 'Table' : 'View'}`}
                        </vscode-button>
                    </div>
                </div>
            </section>

            <section className="action-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="button-group">
                    <vscode-button appearance="secondary" onClick={onBack}>Back to Connection</vscode-button>
                </div>
                <div>
                    <span style={{ fontSize: '0.9em', color: 'var(--text-secondary)', fontWeight: 500 }}>
                        {selectedTables.length} Tables, {selectedViews.length} Views selected
                    </span>
                </div>
            </section>
        </div>
    );
};

interface EntityTableProps {
    entities: EntityMetadata[];
    selected: string[];
    onToggle: (id: string) => void;
    viewKeys?: Record<string, string[]>;
    onKeyToggle?: (id: string, col: string) => void;
    isView: boolean;
}

const EntityTable: React.FC<EntityTableProps> = ({ entities, selected, onToggle, viewKeys, onKeyToggle, isView }) => {
    return (
        <div className="entity-table-wrapper" style={{ height: '100%', minHeight: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text-primary)' }}>
                <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-secondary)', zIndex: 1, boxShadow: '0 1px 0 var(--border-color)' }}>
                    <tr style={{ textAlign: 'left' }}>
                        <th style={{ padding: '12px 8px', fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Select</th>
                        <th style={{ padding: '12px 8px', fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Name</th>
                        {isView && <th style={{ padding: '12px 8px', fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Primary Keys (Horizontal Scroll)</th>}
                    </tr>
                </thead>
                <tbody>
                    {entities.map(e => {
                        const id = `${e.schema}.${e.name}`;
                        const isSelected = selected.includes(id);
                        return (
                            <tr key={id} style={{
                                borderBottom: '1px solid var(--border-color)',
                                background: isSelected ? 'rgba(var(--accent-primary-rgb, 0, 120, 212), 0.05)' : 'transparent',
                                transition: 'background var(--transition-speed)'
                            }}>
                                <td style={{ padding: '12px 8px', verticalAlign: 'top' }}>
                                    <vscode-checkbox
                                        checked={isSelected}
                                        onChange={() => onToggle(id)}
                                    ></vscode-checkbox>
                                </td>
                                <td style={{ padding: '12px 8px', verticalAlign: 'top' }}>
                                    <div style={{ fontWeight: 600, color: isSelected ? 'var(--accent-primary)' : 'inherit' }}>{e.name}</div>
                                    <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>{e.schema}</div>
                                </td>
                                {isView && (
                                    <td style={{ padding: '12px 8px' }}>
                                        {isSelected ? (
                                            <div style={{
                                                display: 'flex',
                                                flexFlow: 'column wrap',
                                                height: '164px', /* Increased from 110px to accommodate ~5 rows */
                                                overflowX: 'auto',
                                                gap: '4px 16px',
                                                maxWidth: '650px',
                                                paddingBottom: '8px',
                                                scrollbarWidth: 'thin',
                                                alignContent: 'flex-start'
                                            }}>
                                                {e.columns.map(col => (
                                                    <vscode-checkbox
                                                        key={col}
                                                        checked={(viewKeys?.[id] || []).includes(col)}
                                                        onChange={() => onKeyToggle?.(id, col)}
                                                        style={{ whiteSpace: 'nowrap', minWidth: '150px' }}
                                                    >
                                                        <span style={{ fontSize: '0.85rem' }}>{col}</span>
                                                    </vscode-checkbox>
                                                ))}
                                            </div>
                                        ) : (
                                            <span style={{ fontSize: '0.8rem', opacity: 0.4, fontStyle: 'italic' }}>Select view to set keys</span>
                                        )}
                                    </td>
                                )}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            {entities.length === 0 && (
                <div style={{ padding: '4rem', textAlign: 'center', opacity: 0.5, border: '2px dashed var(--border-color)', margin: '1rem', borderRadius: 'var(--border-radius-md)' }}>
                    <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>No {isView ? 'views' : 'tables'} found</div>
                    <div style={{ fontSize: '0.9rem' }}>Check your connection or database permissions</div>
                </div>
            )}
        </div>
    );
}
