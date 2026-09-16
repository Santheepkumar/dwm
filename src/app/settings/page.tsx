'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { getAppwriteConfig } from '@/lib/appwrite';
import { activityService } from '@/services/activityService';
import { Client, Databases } from 'appwrite';
import {
  Settings,
  Database,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Download,
  Upload,
  Code,
  ExternalLink,
  Save,
} from 'lucide-react';

export default function SettingsPage() {
  const [endpoint, setEndpoint] = useState('');
  const [projectId, setProjectId] = useState('');
  const [databaseId, setDatabaseId] = useState('dwm_database');
  const [collectionId, setCollectionId] = useState('activities');
  const [apiKey, setApiKey] = useState('');
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [provisionLogs, setProvisionLogs] = useState<string[]>([]);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);

  useEffect(() => {
    const config = getAppwriteConfig();
    setEndpoint(config.endpoint || 'https://cloud.appwrite.io/v1');
    setProjectId(config.projectId || '');
    setDatabaseId(config.databaseId || 'dwm_database');
    setCollectionId(config.collectionId || 'activities');
  }, []);

  const handleSaveAppwrite = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dwm_appwrite_endpoint', endpoint.trim());
      localStorage.setItem('dwm_appwrite_project_id', projectId.trim());
      localStorage.setItem('dwm_appwrite_db_id', databaseId.trim());
      localStorage.setItem('dwm_appwrite_collection_id', collectionId.trim());
      setStatusMessage({
        type: 'success',
        text: 'Appwrite configuration saved successfully to local browser environment!',
      });
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleAutoProvision = async () => {
    if (!endpoint || !projectId || !apiKey) {
      setStatusMessage({
        type: 'error',
        text: 'Please provide API Endpoint, Project ID, and an Appwrite API Key.',
      });
      return;
    }

    setIsProvisioning(true);
    setProvisionLogs([]);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/appwrite/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint, projectId, apiKey, databaseId, collectionId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Provisioning failed');
      }

      setProvisionLogs(data.logs || []);
      handleSaveAppwrite();
      setStatusMessage({
        type: 'success',
        text: '🎉 Database, Collection, and all 25 Schema Attributes created automatically!',
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Provisioning Error: ${err.message}`,
      });
    } finally {
      setIsProvisioning(false);
    }
  };

  const handleTestConnection = async () => {
    if (!endpoint || !projectId) {
      setStatusMessage({ type: 'error', text: 'Please provide both Endpoint and Project ID.' });
      return;
    }

    setTestingConnection(true);
    setStatusMessage(null);

    try {
      const client = new Client().setEndpoint(endpoint).setProject(projectId);
      const db = new Databases(client);
      await db.listDocuments(databaseId, collectionId);
      setStatusMessage({
        type: 'success',
        text: 'Connected successfully to Appwrite Database & Collection!',
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Connection test result: ${err.message || 'Check endpoint, project ID, and CORS permissions in Appwrite Console.'}`,
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleResetData = () => {
    if (confirm('Reset all activities back to initial HR and Operations seed data?')) {
      activityService.resetDemoData();
      setStatusMessage({
        type: 'success',
        text: 'All 5 example workflows (Candidate Sourcing, Reports, Statutory, Payroll, Engagement) have been restored!',
      });
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleExportData = () => {
    const jsonStr = activityService.exportData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dwm_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = activityService.importData(content);
      if (success) {
        setStatusMessage({ type: 'success', text: 'Data imported successfully!' });
      } else {
        setStatusMessage({ type: 'error', text: 'Failed to parse JSON file.' });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 space-y-6 pb-28 lg:pb-12">
        {/* Header */}
        <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-2xs">
            <Settings className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Settings & Appwrite Backend</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure Appwrite Cloud backend, schema attributes, and local demo backups
            </p>
          </div>
        </div>

        {statusMessage && (
          <div
            className={`flex items-center gap-2 rounded-xl p-4 text-xs font-semibold ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : statusMessage.type === 'error'
                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Appwrite Connection Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <Database className="h-5 w-5 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900">Appwrite Credentials</h2>
            </div>
            <a
              href="https://cloud.appwrite.io"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline"
            >
              <span>Appwrite Console</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Appwrite API Endpoint
              </label>
              <input
                type="text"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                placeholder="https://cloud.appwrite.io/v1"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-800 font-mono focus:border-indigo-500 focus:bg-white focus:outline-hidden transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Project ID
              </label>
              <input
                type="text"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder="e.g. 64a8b79c0..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-800 font-mono focus:border-indigo-500 focus:bg-white focus:outline-hidden transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Database ID
                </label>
                <input
                  type="text"
                  value={databaseId}
                  onChange={(e) => setDatabaseId(e.target.value)}
                  placeholder="dwm_database"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-800 font-mono focus:border-indigo-500 focus:bg-white focus:outline-hidden transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Collection ID
                </label>
                <input
                  type="text"
                  value={collectionId}
                  onChange={(e) => setCollectionId(e.target.value)}
                  placeholder="activities"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-800 font-mono focus:border-indigo-500 focus:bg-white focus:outline-hidden transition-colors"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={handleSaveAppwrite}
                className="flex min-h-[44px] items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition-colors cursor-pointer"
              >
                <Save className="h-4 w-4" />
                <span>Save Credentials</span>
              </button>

              <button
                onClick={handleTestConnection}
                disabled={testingConnection}
                className="flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-60"
              >
                <Database className="h-4 w-4 text-indigo-600" />
                <span>{testingConnection ? 'Testing...' : 'Test Connection'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Appwrite 1-Click Auto-Provision Card */}
        <div className="rounded-2xl border border-indigo-200 bg-linear-to-br from-indigo-50/60 via-white to-white p-6 shadow-xs">
          <div className="flex items-center gap-2.5 pb-3 border-b border-indigo-100">
            <span className="text-xl">🚀</span>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                1-Click Auto-Provision (No Manual Column Creation)
              </h2>
              <p className="text-xs text-slate-600">
                Don't want to create 25 columns manually in the Appwrite console? Enter an API Key and click below!
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Appwrite API Secret Key (from Appwrite Console &gt; Project Settings &gt; View API Keys &gt; Create API Key)
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="e.g. 98a3f01c29b..."
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 font-mono focus:border-indigo-500 focus:outline-hidden"
              />
              <p className="text-[11px] text-slate-500 mt-1.5">
                Required scopes for key: <code>databases.write</code>, <code>collections.write</code>, <code>attributes.write</code>.
              </p>
            </div>

            <div className="pt-1">
              <button
                onClick={handleAutoProvision}
                disabled={isProvisioning || !apiKey}
                className="flex min-h-[44px] items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors cursor-pointer"
              >
                <span>{isProvisioning ? '⚡ Creating Database, Collection & Attributes...' : '⚡ Auto-Create All 25 Columns & Database'}</span>
              </button>
            </div>

            {provisionLogs.length > 0 && (
              <div className="mt-3 rounded-xl bg-slate-900 p-4 text-xs font-mono text-emerald-400 max-h-48 overflow-y-auto space-y-1">
                <div className="text-slate-400 font-bold border-b border-slate-700 pb-1 mb-1">
                  Provisioning Log:
                </div>
                {provisionLogs.map((log, index) => (
                  <div key={index}>{log}</div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Appwrite Collection Schema Helper */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <Code className="h-5 w-5 text-indigo-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Recommended Appwrite Database Attributes
              </h2>
              <p className="text-xs text-slate-500">
                When creating the collection in Appwrite, add the following attributes:
              </p>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2">Attribute Key</th>
                  <th className="px-4 py-2">Type</th>
                  <th className="px-4 py-2">Required</th>
                  <th className="px-4 py-2">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                <tr>
                  <td className="px-4 py-2 text-indigo-600">title</td>
                  <td className="px-4 py-2">String (size 255)</td>
                  <td className="px-4 py-2 text-rose-600">Yes</td>
                  <td className="px-4 py-2 font-sans text-slate-600">Activity title</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-indigo-600">category</td>
                  <td className="px-4 py-2">String (size 50)</td>
                  <td className="px-4 py-2 text-rose-600">Yes</td>
                  <td className="px-4 py-2 font-sans text-slate-600">candidate_sourcing, reports, statutory, payroll, engagement</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-indigo-600">stage</td>
                  <td className="px-4 py-2">String (size 50)</td>
                  <td className="px-4 py-2 text-rose-600">Yes</td>
                  <td className="px-4 py-2 font-sans text-slate-600">Workflow stage in pipeline</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-indigo-600">status</td>
                  <td className="px-4 py-2">String (size 50)</td>
                  <td className="px-4 py-2 text-rose-600">Yes</td>
                  <td className="px-4 py-2 font-sans text-slate-600">planned, under_processing, waiting_approval, completed, postponed</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-indigo-600">plannedDate</td>
                  <td className="px-4 py-2">String (size 20)</td>
                  <td className="px-4 py-2 text-rose-600">Yes</td>
                  <td className="px-4 py-2 font-sans text-slate-600">Target date (YYYY-MM-DD)</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-indigo-600">plannedHours</td>
                  <td className="px-4 py-2">Float</td>
                  <td className="px-4 py-2">No</td>
                  <td className="px-4 py-2 font-sans text-slate-600">Estimated duration</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-indigo-600">actualHours</td>
                  <td className="px-4 py-2">Float</td>
                  <td className="px-4 py-2">No</td>
                  <td className="px-4 py-2 font-sans text-slate-600">Actual clocked hours</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-indigo-600">approverName</td>
                  <td className="px-4 py-2">String (size 100)</td>
                  <td className="px-4 py-2">No</td>
                  <td className="px-4 py-2 font-sans text-slate-600">Assigned top level authority</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-indigo-600">postponeCount</td>
                  <td className="px-4 py-2">Integer</td>
                  <td className="px-4 py-2">No (Default 0)</td>
                  <td className="px-4 py-2 font-sans text-slate-600">Number of postponements</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-indigo-600">metadata</td>
                  <td className="px-4 py-2">String (size 5000)</td>
                  <td className="px-4 py-2">No</td>
                  <td className="px-4 py-2 font-sans text-slate-600">JSON stringified category attributes</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Data Reset & Import/Export */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
            Data Management & Demo Workflows
          </h2>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={handleResetData}
              className="flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <RotateCcw className="h-4 w-4 text-indigo-600" />
              <span>Reset to Sample Data</span>
            </button>

            <button
              onClick={handleExportData}
              className="flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Download className="h-4 w-4 text-emerald-600" />
              <span>Export Data (JSON)</span>
            </button>

            <label className="flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer">
              <Upload className="h-4 w-4 text-amber-600" />
              <span>Import Data (JSON)</span>
              <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
            </label>
          </div>
        </div>
      </main>
    </div>
  );
}
