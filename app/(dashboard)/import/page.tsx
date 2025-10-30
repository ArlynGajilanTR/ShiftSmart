'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { parseCSV, seedFromCSV, generateCSVTemplate } from '@/lib/scheduling/csv-import';
import { Upload, Download, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';

export default function CSVImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [bureauId, setBureauId] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!file || !bureauId) {
      alert('Please select a file and enter a bureau ID');
      return;
    }

    setImporting(true);
    setResult(null);

    try {
      const content = await file.text();
      const data = parseCSV(content);
      const importResult = await seedFromCSV(data, bureauId);
      setResult(importResult);
    } catch (error) {
      alert('Error importing CSV: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const template = generateCSVTemplate();
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'shiftsmart_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <FileSpreadsheet className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl font-bold">CSV Import</h1>
          </div>

          <p className="text-gray-600 mb-8">
            Import shifts and staff assignments from a CSV file. Download the template to see the required format.
          </p>

          {/* Download Template */}
          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Need a template?</h3>
                <p className="text-sm text-blue-700">
                  Download our CSV template to see the required format and example data.
                </p>
              </div>
              <button
                onClick={downloadTemplate}
                className="flex items-center gap-2 bg-[#FF6600] hover:bg-[#E65C00] text-white px-4 py-2 rounded-md transition font-medium"
              >
                <Download className="w-4 h-4" />
                Download Template
              </button>
            </div>
          </div>

          {/* Import Form */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bureau ID
              </label>
              <input
                type="text"
                value={bureauId}
                onChange={(e) => setBureauId(e.target.value)}
                placeholder="Enter bureau ID (from Supabase)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CSV File
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-400 transition">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                  id="csv-file"
                />
                <label htmlFor="csv-file" className="cursor-pointer">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  {file ? (
                    <div>
                      <div className="font-medium text-gray-900">{file.name}</div>
                      <div className="text-sm text-gray-500">{(file.size / 1024).toFixed(2)} KB</div>
                    </div>
                  ) : (
                    <div>
                      <div className="font-medium text-gray-700 mb-1">Click to upload CSV</div>
                      <div className="text-sm text-gray-500">or drag and drop</div>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <button
              onClick={handleImport}
              disabled={importing || !file || !bureauId}
              className="w-full bg-[#FF6600] hover:bg-[#E65C00] text-white font-medium py-4 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {importing ? 'Importing...' : 'Import CSV'}
            </button>
          </div>

          {/* Results */}
          {result && (
            <div className="mt-8 p-6 bg-gray-50 rounded-lg border">
              <h3 className="font-semibold text-lg mb-4">Import Results</h3>
              
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-white p-4 rounded-lg border">
                  <div className="text-2xl font-bold text-indigo-600">{result.users}</div>
                  <div className="text-sm text-gray-600">Users Created</div>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                  <div className="text-2xl font-bold text-indigo-600">{result.shifts}</div>
                  <div className="text-sm text-gray-600">Shifts Created</div>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                  <div className="text-2xl font-bold text-indigo-600">{result.assignments}</div>
                  <div className="text-sm text-gray-600">Assignments Made</div>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Errors ({result.errors.length})
                  </h4>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {result.errors.map((error: string, idx: number) => (
                      <div key={idx} className="text-sm text-red-700">
                        • {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.errors.length === 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <div>
                    <div className="font-semibold text-green-900">Import Successful!</div>
                    <div className="text-sm text-green-700">All data imported without errors.</div>
                  </div>
                </div>
              )}

              <button
                onClick={() => router.push('/dashboard')}
                className="mt-4 w-full bg-[#FF6600] hover:bg-[#E65C00] text-white py-3 rounded-md transition font-medium"
              >
                Go to Dashboard
              </button>
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-[#FF6600] hover:text-[#E65C00] font-medium transition"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

