import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Play, 
  Save, 
  Power, 
  Plus, 
  Trash2, 
  Settings2, 
  ArrowDown, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileSpreadsheet, 
  FolderTree, 
  KanbanSquare, 
  FileDown, 
  AlertTriangle,
  Upload,
  RefreshCw,
  Terminal,
  ShieldAlert,
  ChevronRight,
  Database
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { Workflow, WorkflowStep, Execution, api } from '../api';

interface BuilderPageProps {
  initialWorkflow?: Workflow | null;
  initialPrompt?: string | null;
  onSaveWorkflowSuccess: () => void;
  onNavigateToHistory: () => void;
  onNavigateToTasks: () => void;
}

export const BuilderPage: React.FC<BuilderPageProps> = ({
  initialWorkflow,
  initialPrompt,
  onSaveWorkflowSuccess,
  onNavigateToHistory,
  onNavigateToTasks,
}) => {
  const [prompt, setPrompt] = useState(initialPrompt || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copilotExplanation, setCopilotExplanation] = useState<string | null>(null);
  const [copilotAssumptions, setCopilotAssumptions] = useState<string[]>([]);
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  
  // Selected Step for Parameter Editing
  const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null);

  // Execution State
  const [isRunning, setIsRunning] = useState(false);
  const [executionResult, setExecutionResult] = useState<Execution | null>(null);
  const [showExecutionModal, setShowExecutionModal] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [fileUploadStatus, setFileUploadStatus] = useState<string | null>(null);
  const [activeStepTab, setActiveStepTab] = useState<'visual' | 'logs'>('visual');

  const examplePrompts = [
    "When I upload a sales CSV file, clean the data, identify the top-performing products, calculate total revenue, generate a report, and notify me",
    "Organize my uploaded files by extension, categorize into documents/images/data, and generate a safe relocation plan",
    "Turn this project description into prioritized tasks, assign deadlines, and populate the task board"
  ];

  useEffect(() => {
    if (initialWorkflow) {
      setWorkflow(initialWorkflow);
      setCopilotExplanation(initialWorkflow.description);
    } else if (initialPrompt) {
      handleGenerateCopilot(initialPrompt);
    } else {
      // Default initial workflow
      handleGenerateCopilot(examplePrompts[0]);
    }
  }, [initialWorkflow, initialPrompt]);

  const handleGenerateCopilot = async (promptText: string) => {
    setIsGenerating(true);
    try {
      const res = await api.generateWorkflowWithCopilot(promptText);
      const newWf: Workflow = {
        ...res.workflow,
        id: `wf_${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setWorkflow(newWf);
      setCopilotExplanation(res.explanation);
      setCopilotAssumptions(res.assumptions);
      setSelectedStepIndex(0);
    } catch (err: any) {
      alert(err.message || 'Failed to generate workflow');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveWorkflow = async () => {
    if (!workflow) return;
    try {
      await api.createWorkflow(workflow);
      alert('Workflow saved successfully to your library!');
      onSaveWorkflowSuccess();
    } catch (err: any) {
      alert(err.message || 'Failed to save workflow');
    }
  };

  const handleRunWorkflow = async () => {
    if (!workflow) return;
    setIsRunning(true);
    setShowExecutionModal(true);
    setExecutionResult(null);

    try {
      // First ensure workflow exists or is saved
      let targetId = workflow.id;
      try {
        await api.getWorkflow(workflow.id);
      } catch {
        const saved = await api.createWorkflow(workflow);
        targetId = saved.id;
      }

      const overrides: Record<string, any> = {};
      if (uploadedFileName) {
        overrides.file_path = uploadedFileName;
      }
      overrides.approved = true;

      const res = await api.runWorkflow(targetId, overrides);
      setExecutionResult(res);
    } catch (err: any) {
      alert(err.message || 'Execution error');
    } finally {
      setIsRunning(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileUploadStatus(`Uploading ${file.name}...`);
    try {
      const res = await api.uploadFile(file);
      setUploadedFileName(res.filename);
      setFileUploadStatus(`Ready: ${res.filename} (${(res.size_bytes / 1024).toFixed(1)} KB)`);
    } catch (err: any) {
      setFileUploadStatus('Upload failed. Using sample file.');
    }
  };

  const handleAddStep = () => {
    if (!workflow) return;
    const newStep: WorkflowStep = {
      id: `step_${Date.now()}`,
      name: 'Custom Allowlisted Step',
      type: 'action',
      description: 'Executes allowlisted action with verified safety guarantee.',
      config: {
        action_type: 'condition_check',
        params: { field: 'status_code', operator: '==', value: 200 },
        retry_count: 1,
        timeout_seconds: 30
      }
    };
    setWorkflow({
      ...workflow,
      steps: [...workflow.steps, newStep]
    });
    setSelectedStepIndex(workflow.steps.length);
  };

  const handleDeleteStep = (index: number) => {
    if (!workflow || workflow.steps.length <= 1) {
      alert('Workflow must contain at least one step.');
      return;
    }
    const updated = workflow.steps.filter((_, i) => i !== index);
    setWorkflow({ ...workflow, steps: updated });
    setSelectedStepIndex(0);
  };

  const handleStepParamChange = (key: string, val: any) => {
    if (!workflow || selectedStepIndex === null) return;
    const step = { ...workflow.steps[selectedStepIndex] };
    step.config = {
      ...step.config,
      params: {
        ...(step.config.params || {}),
        [key]: val
      }
    };
    const updatedSteps = [...workflow.steps];
    updatedSteps[selectedStepIndex] = step;
    setWorkflow({ ...workflow, steps: updatedSteps });
  };

  const stepTypeColors: Record<string, string> = {
    trigger: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400',
    action: 'border-electric-500/50 bg-electric-500/10 text-electric-400',
    condition: 'border-amber-500/50 bg-amber-500/10 text-amber-400',
    output: 'border-violetAccent-500/50 bg-violetAccent-500/10 text-violetAccent-400'
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Copilot Natural Language Input Header */}
      <div className="p-6 rounded-2xl bg-charcoal-850 border border-charcoal-700 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-electric-500/15 flex items-center justify-center text-electric-400">
              <Sparkles className="w-4 h-4 animate-spin" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">AI Automation Copilot</h2>
              <p className="text-xs text-slate-400">Transform natural language instructions into multi-step executable workflows</p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-charcoal-900 border border-charcoal-700 text-slate-400">
            Allowlist Enforced
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <textarea
              rows={2}
              id="input-copilot-builder-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your automation instruction..."
              className="w-full p-3 rounded-xl bg-charcoal-900 border border-charcoal-700 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-electric-500 focus:ring-1 focus:ring-electric-500 transition-all font-sans resize-none"
            />
          </div>
          <button
            onClick={() => handleGenerateCopilot(prompt)}
            disabled={isGenerating || !prompt.trim()}
            id="btn-copilot-generate"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-electric-600 to-violetAccent-600 hover:from-electric-500 hover:to-violetAccent-500 disabled:opacity-50 text-white text-xs font-semibold shadow-glow-blue flex items-center justify-center space-x-2 transition-all flex-shrink-0"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Synthesizing Graph...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Synthesize Workflow</span>
              </>
            )}
          </button>
        </div>

        {/* Suggestion Chips */}
        <div className="mt-3 flex flex-wrap gap-2 items-center">
          <span className="text-[10px] font-mono text-slate-500">Quick Templates:</span>
          {examplePrompts.map((p, i) => (
            <button
              key={i}
              onClick={() => {
                setPrompt(p);
                handleGenerateCopilot(p);
              }}
              className="text-[11px] px-2.5 py-1 rounded-md bg-charcoal-900 hover:bg-charcoal-800 text-slate-300 hover:text-electric-300 border border-charcoal-700 transition-colors"
            >
              Demo {i+1}: {i === 0 ? 'AI Sales Report' : i === 1 ? 'Smart File Organizer' : 'Intelligent Task Assistant'}
            </button>
          ))}
        </div>

        {/* Copilot Explanation Banner */}
        {copilotExplanation && (
          <div className="mt-4 p-4 rounded-xl bg-charcoal-900/90 border border-charcoal-700/80 text-xs">
            <div className="flex items-center space-x-2 text-electric-400 font-semibold mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Copilot Workflow Logic & Execution Architecture</span>
            </div>
            <p className="text-slate-300 leading-relaxed">{copilotExplanation}</p>
            {copilotAssumptions.length > 0 && (
              <div className="mt-2 pt-2 border-t border-charcoal-800 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-400">
                <span className="font-mono text-slate-500">Guarantees & Assumptions:</span>
                {copilotAssumptions.map((asm, idx) => (
                  <span key={idx} className="flex items-center space-x-1">
                    <span className="text-electric-400">•</span>
                    <span>{asm}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Builder Workspace: Canvas & Step Inspector */}
      {workflow && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Visual Workflow Canvas (2 Cols) */}
          <div className="lg:col-span-2 space-y-4">
            {/* Workflow Controls Bar */}
            <div className="p-4 rounded-xl bg-charcoal-850 border border-charcoal-700 flex flex-wrap items-center justify-between gap-3">
              <div>
                <input
                  type="text"
                  value={workflow.name}
                  onChange={(e) => setWorkflow({ ...workflow, name: e.target.value })}
                  className="bg-transparent font-bold text-white text-sm focus:outline-none focus:border-b border-electric-500"
                />
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Category: <span className="text-electric-400 font-medium">{workflow.category}</span> • Trigger: <span className="font-mono uppercase text-slate-300">{workflow.trigger_type}</span>
                </p>
              </div>

              <div className="flex items-center space-x-2">
                {/* File Upload Selector for CSV Demo */}
                <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-charcoal-800 hover:bg-charcoal-700 border border-charcoal-700 text-xs text-slate-300 flex items-center space-x-1.5 transition-colors">
                  <Upload className="w-3.5 h-3.5 text-electric-400" />
                  <span>{uploadedFileName ? 'CSV Loaded' : 'Upload CSV'}</span>
                  <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                </label>

                {/* Save Button */}
                <button
                  onClick={handleSaveWorkflow}
                  id="btn-save-workflow"
                  className="px-3 py-1.5 rounded-lg bg-charcoal-800 hover:bg-charcoal-700 border border-charcoal-700 text-xs text-slate-200 font-medium flex items-center space-x-1.5 transition-colors"
                >
                  <Save className="w-3.5 h-3.5 text-violetAccent-400" />
                  <span>Save</span>
                </button>

                {/* Run Automation Primary Button */}
                <button
                  onClick={handleRunWorkflow}
                  disabled={isRunning}
                  id="btn-run-workflow-main"
                  className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-glow-emerald transition-all"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isRunning ? 'Executing...' : 'Run Automation'}</span>
                </button>
              </div>
            </div>

            {/* File Upload Status Banner if file selected */}
            {fileUploadStatus && (
              <div className="px-3 py-2 rounded-lg bg-charcoal-800 border border-charcoal-700 text-xs text-emerald-400 flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{fileUploadStatus}</span>
              </div>
            )}

            {/* Step Sequence Flow Canvas */}
            <div className="p-6 rounded-2xl bg-charcoal-900 border border-charcoal-700/80 shadow-2xl space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-mono">
                <span>EXECUTION GRAPH ({workflow.steps.length} NODES)</span>
                <span className="text-emerald-400 flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>Sequential Dependency Chain</span>
                </span>
              </div>

              {workflow.steps.map((step, idx) => {
                const isSelected = selectedStepIndex === idx;
                const typeStyle = stepTypeColors[step.type] || stepTypeColors.action;

                return (
                  <React.Fragment key={step.id}>
                    {/* Node Card */}
                    <div
                      onClick={() => setSelectedStepIndex(idx)}
                      id={`step-node-${idx}`}
                      className={`p-4 rounded-xl border transition-all cursor-pointer relative group ${
                        isSelected
                          ? 'border-electric-500 bg-charcoal-800 shadow-glow-blue'
                          : 'border-charcoal-700 bg-charcoal-850 hover:border-slate-500'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          {/* Step Number Badge */}
                          <div className="w-7 h-7 rounded-lg bg-charcoal-900 border border-charcoal-700 flex items-center justify-center font-mono text-xs font-bold text-slate-300">
                            {idx + 1}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="text-sm font-bold text-white">{step.name}</h4>
                              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${typeStyle}`}>
                                {step.type}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1">{step.description}</p>
                            
                            {/* Action Type & Parameters Preview */}
                            <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-mono">
                              <span className="px-2 py-0.5 rounded bg-charcoal-900 text-electric-400 border border-charcoal-700">
                                action: {step.config.action_type}
                              </span>
                              {Object.keys(step.config.params || {}).length > 0 && (
                                <span className="px-2 py-0.5 rounded bg-charcoal-900 text-slate-400 border border-charcoal-700">
                                  {Object.keys(step.config.params || {}).length} params configured
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteStep(idx);
                            }}
                            className="p-1.5 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                            title="Remove step"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isSelected ? 'rotate-90 text-electric-400' : ''}`} />
                        </div>
                      </div>
                    </div>

                    {/* Animated Connection Arrow */}
                    {idx < workflow.steps.length - 1 && (
                      <div className="flex justify-center py-1">
                        <div className="w-0.5 h-6 bg-gradient-to-b from-electric-500 to-violetAccent-500 relative flex items-center justify-center">
                          <ArrowDown className="w-3.5 h-3.5 text-electric-400 absolute -bottom-1.5" />
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}

              {/* Add Step Button */}
              <div className="pt-2">
                <button
                  onClick={handleAddStep}
                  id="btn-add-step"
                  className="w-full py-3 rounded-xl border border-dashed border-charcoal-700 hover:border-electric-500/60 text-slate-400 hover:text-electric-400 text-xs font-semibold flex items-center justify-center space-x-2 transition-colors bg-charcoal-850/50"
                >
                  <Plus className="w-4 h-4" />
                  <span>Append Allowlisted Action Step</span>
                </button>
              </div>
            </div>
          </div>

          {/* Step Inspector & Configuration Drawer (1 Col) */}
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-charcoal-850 border border-charcoal-700 sticky top-20 shadow-xl">
              <div className="flex items-center space-x-2 text-xs font-bold text-white mb-4 pb-3 border-b border-charcoal-700">
                <Settings2 className="w-4 h-4 text-electric-400" />
                <span>Node Inspector & Parameters</span>
              </div>

              {selectedStepIndex !== null && workflow.steps[selectedStepIndex] ? (
                (() => {
                  const step = workflow.steps[selectedStepIndex];
                  return (
                    <div className="space-y-4 text-xs">
                      <div>
                        <label className="block text-slate-400 font-mono text-[10px] uppercase mb-1">
                          Step Name
                        </label>
                        <input
                          type="text"
                          value={step.name}
                          onChange={(e) => {
                            const updated = [...workflow.steps];
                            updated[selectedStepIndex].name = e.target.value;
                            setWorkflow({ ...workflow, steps: updated });
                          }}
                          className="w-full p-2.5 rounded-lg bg-charcoal-900 border border-charcoal-700 text-slate-100 text-xs focus:outline-none focus:border-electric-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 font-mono text-[10px] uppercase mb-1">
                          Node Type
                        </label>
                        <select
                          value={step.type}
                          onChange={(e) => {
                            const updated = [...workflow.steps];
                            updated[selectedStepIndex].type = e.target.value as any;
                            setWorkflow({ ...workflow, steps: updated });
                          }}
                          className="w-full p-2.5 rounded-lg bg-charcoal-900 border border-charcoal-700 text-slate-100 text-xs focus:outline-none focus:border-electric-500"
                        >
                          <option value="trigger">Trigger</option>
                          <option value="action">Action</option>
                          <option value="condition">Condition</option>
                          <option value="output">Output</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-400 font-mono text-[10px] uppercase mb-1">
                          Action Identifier (Allowlist Verified)
                        </label>
                        <input
                          type="text"
                          value={step.config.action_type}
                          readOnly
                          className="w-full p-2.5 rounded-lg bg-charcoal-900/60 border border-charcoal-700 text-electric-400 font-mono text-xs cursor-not-allowed"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 font-mono text-[10px] uppercase mb-1">
                          Description
                        </label>
                        <textarea
                          rows={2}
                          value={step.description || ''}
                          onChange={(e) => {
                            const updated = [...workflow.steps];
                            updated[selectedStepIndex].description = e.target.value;
                            setWorkflow({ ...workflow, steps: updated });
                          }}
                          className="w-full p-2.5 rounded-lg bg-charcoal-900 border border-charcoal-700 text-slate-100 text-xs focus:outline-none focus:border-electric-500 resize-none"
                        />
                      </div>

                      {/* Custom Parameters Section */}
                      <div>
                        <label className="block text-slate-400 font-mono text-[10px] uppercase mb-2">
                          Step Parameters (Key / Value)
                        </label>
                        {Object.entries(step.config.params || {}).length === 0 ? (
                          <p className="text-[11px] text-slate-500 italic p-2 rounded bg-charcoal-900/40">
                            Inherits inputs from prior step outputs automatically.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {Object.entries(step.config.params || {}).map(([k, v]) => (
                              <div key={k} className="p-2 rounded bg-charcoal-900 border border-charcoal-700 flex items-center justify-between">
                                <span className="font-mono text-[11px] text-slate-300">{k}</span>
                                <input
                                  type="text"
                                  value={typeof v === 'object' ? JSON.stringify(v) : String(v)}
                                  onChange={(e) => handleStepParamChange(k, e.target.value)}
                                  className="w-1/2 p-1 rounded bg-charcoal-800 border border-charcoal-700 text-right font-mono text-xs text-electric-400 focus:outline-none"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Execution Policy: Bounded Retries */}
                      <div className="pt-3 border-t border-charcoal-700/80">
                        <label className="block text-slate-400 font-mono text-[10px] uppercase mb-1">
                          Bounded Retry Policy: {step.config.retry_count ?? 1} attempts
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="3"
                          value={step.config.retry_count ?? 1}
                          onChange={(e) => {
                            const updated = [...workflow.steps];
                            updated[selectedStepIndex].config.retry_count = parseInt(e.target.value);
                            setWorkflow({ ...workflow, steps: updated });
                          }}
                          className="w-full accent-electric-500 cursor-pointer"
                        />
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="text-center py-8 text-slate-500 text-xs">
                  Select a workflow step from the canvas to inspect its configuration and parameters.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Live Execution Telemetry Modal */}
      {showExecutionModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-4xl max-h-[90vh] bg-charcoal-900 border border-charcoal-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-charcoal-700 flex items-center justify-between bg-charcoal-850">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isRunning 
                    ? 'bg-electric-500/20 text-electric-400 animate-spin' 
                    : executionResult?.status === 'succeeded' 
                    ? 'bg-emerald-500/20 text-emerald-400' 
                    : 'bg-rose-500/20 text-rose-400'
                }`}>
                  {isRunning ? <RefreshCw className="w-4 h-4" /> : executionResult?.status === 'succeeded' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <span>Live Automation Telemetry</span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase ${
                      isRunning ? 'bg-electric-500/10 text-electric-400' : executionResult?.status === 'succeeded' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                    }`}>
                      {isRunning ? 'Executing Steps...' : executionResult?.status}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Execution ID: <span className="font-mono text-slate-300">{executionResult?.id || 'pending...'}</span> • Duration: <span className="font-mono text-slate-300">{executionResult?.duration_seconds || 0}s</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setActiveStepTab('visual')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    activeStepTab === 'visual' ? 'bg-electric-600 text-white' : 'bg-charcoal-800 text-slate-400'
                  }`}
                >
                  Results & Charts
                </button>
                <button
                  onClick={() => setActiveStepTab('logs')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    activeStepTab === 'logs' ? 'bg-electric-600 text-white' : 'bg-charcoal-800 text-slate-400'
                  }`}
                >
                  Step Logs
                </button>
                <button
                  onClick={() => setShowExecutionModal(false)}
                  className="p-1.5 rounded-lg bg-charcoal-800 hover:bg-charcoal-700 text-slate-400 hover:text-white"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {isRunning && (
                <div className="p-4 rounded-xl bg-charcoal-850 border border-charcoal-700 flex items-center space-x-3 text-xs text-electric-400">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Executing sequential allowlisted actions with real-time sandbox verification...</span>
                </div>
              )}

              {/* Step Status Progress Bar */}
              {executionResult && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-300 uppercase font-mono">
                    Step-by-Step Execution Sequence
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {executionResult.step_results.map((st, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                          st.status === 'succeeded'
                            ? 'border-emerald-500/30 bg-emerald-500/5 text-slate-200'
                            : st.status === 'failed'
                            ? 'border-rose-500/40 bg-rose-500/5 text-rose-200'
                            : 'border-charcoal-700 bg-charcoal-800 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 truncate">
                          {st.status === 'succeeded' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          ) : st.status === 'failed' ? (
                            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                          ) : (
                            <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          )}
                          <span className="font-medium truncate">{st.step_name}</span>
                        </div>
                        <span className="font-mono text-[10px] text-slate-400 ml-2">
                          {st.duration_seconds}s
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 1: Visual Artifacts & Charts */}
              {activeStepTab === 'visual' && executionResult && (
                <div className="space-y-6">
                  {/* Demo 1 Sales Artifacts Display */}
                  {executionResult.outputs.total_revenue !== undefined && (
                    <div className="p-5 rounded-2xl bg-charcoal-850 border border-charcoal-700 space-y-5">
                      <div className="flex items-center justify-between pb-3 border-b border-charcoal-700">
                        <div className="flex items-center space-x-2">
                          <FileSpreadsheet className="w-4 h-4 text-electric-400" />
                          <h4 className="text-sm font-bold text-white">Executive Sales Intelligence Dashboard</h4>
                        </div>
                        {executionResult.outputs.download_url && (
                          <a
                            href={executionResult.outputs.download_url}
                            download
                            className="px-3 py-1.5 rounded-lg bg-electric-600 hover:bg-electric-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-glow-blue"
                          >
                            <FileDown className="w-3.5 h-3.5" />
                            <span>Download Report (.md)</span>
                          </a>
                        )}
                      </div>

                      {/* KPI Numbers */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3 rounded-xl bg-charcoal-900 border border-charcoal-700">
                          <span className="text-[10px] text-slate-400 uppercase font-mono">Total Revenue</span>
                          <p className="text-lg font-bold text-white mt-0.5">
                            ${Number(executionResult.outputs.total_revenue || 0).toLocaleString()}
                          </p>
                        </div>
                        <div className="p-3 rounded-xl bg-charcoal-900 border border-charcoal-700">
                          <span className="text-[10px] text-slate-400 uppercase font-mono">Transactions</span>
                          <p className="text-lg font-bold text-white mt-0.5">
                            {executionResult.outputs.total_transactions || 0}
                          </p>
                        </div>
                        <div className="p-3 rounded-xl bg-charcoal-900 border border-charcoal-700">
                          <span className="text-[10px] text-slate-400 uppercase font-mono">Average Order</span>
                          <p className="text-lg font-bold text-white mt-0.5">
                            ${Number(executionResult.outputs.avg_order_value || 0).toFixed(2)}
                          </p>
                        </div>
                        <div className="p-3 rounded-xl bg-charcoal-900 border border-charcoal-700">
                          <span className="text-[10px] text-slate-400 uppercase font-mono">Units Sold</span>
                          <p className="text-lg font-bold text-white mt-0.5">
                            {executionResult.outputs.total_units || 0}
                          </p>
                        </div>
                      </div>

                      {/* Top Products Recharts Bar Chart */}
                      {Array.isArray(executionResult.outputs.top_products) && executionResult.outputs.top_products.length > 0 && (
                        <div>
                          <h5 className="text-xs font-bold text-slate-300 mb-2 font-mono">Top Revenue Generating Products</h5>
                          <div className="h-44 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={executionResult.outputs.top_products}>
                                <XAxis dataKey="product" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                <Tooltip
                                  contentStyle={{ backgroundColor: '#0e1422', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                                  itemStyle={{ color: '#38bdf8' }}
                                />
                                <Bar dataKey="revenue" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}

                      {/* Summary & Bullet Insights */}
                      {executionResult.outputs.summary_text && (
                        <div className="p-3.5 rounded-xl bg-charcoal-900 border border-charcoal-700/80 text-xs text-slate-300 whitespace-pre-line leading-relaxed font-sans">
                          {executionResult.outputs.summary_text}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Demo 2 File Organizer Artifacts Display */}
                  {executionResult.outputs.executed_count !== undefined && (
                    <div className="p-5 rounded-2xl bg-charcoal-850 border border-charcoal-700 space-y-4">
                      <div className="flex items-center space-x-2 text-violetAccent-400">
                        <FolderTree className="w-5 h-5" />
                        <h4 className="text-sm font-bold text-white">Safe File Organization Operations</h4>
                      </div>
                      <p className="text-xs text-slate-300">
                        Successfully organized <span className="text-emerald-400 font-bold">{executionResult.outputs.executed_count}</span> files into structured subdirectories inside the sandbox workspace.
                      </p>
                      <div className="p-3 rounded-xl bg-charcoal-900 border border-charcoal-700 font-mono text-xs text-slate-300">
                        Target Workspace: {executionResult.outputs.target_directory || 'backend/sandbox/organized_files'}
                      </div>
                    </div>
                  )}

                  {/* Demo 3 Task Assistant Artifacts Display */}
                  {executionResult.outputs.task_count !== undefined && (
                    <div className="p-5 rounded-2xl bg-charcoal-850 border border-charcoal-700 space-y-4">
                      <div className="flex items-center space-x-2 text-emerald-400">
                        <KanbanSquare className="w-5 h-5" />
                        <h4 className="text-sm font-bold text-white">Engineering Tasks Dispatched</h4>
                      </div>
                      <p className="text-xs text-slate-300">
                        Synthesized and persisted <span className="text-emerald-400 font-bold">{executionResult.outputs.task_count}</span> actionable items with deadlines to SQLite.
                      </p>
                      <button
                        onClick={() => {
                          setShowExecutionModal(false);
                          onNavigateToTasks();
                        }}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-2 shadow-glow-emerald"
                      >
                        <span>Open Interactive Task Board</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: Detailed Terminal Logs */}
              {activeStepTab === 'logs' && executionResult && (
                <div className="space-y-4">
                  {executionResult.step_results.map((st, i) => (
                    <div key={i} className="p-4 rounded-xl bg-charcoal-950 border border-charcoal-800 font-mono text-xs">
                      <div className="flex items-center justify-between pb-2 border-b border-charcoal-800 text-slate-400 mb-2">
                        <span className="text-electric-400 font-bold">{st.step_name}</span>
                        <span>{st.status.toUpperCase()}</span>
                      </div>
                      <div className="space-y-1 text-slate-300 text-[11px]">
                        {st.logs.map((log, lidx) => (
                          <p key={lidx} className="leading-relaxed">
                            <span className="text-slate-500 select-none">$ </span>
                            {log}
                          </p>
                        ))}
                        {st.error && (
                          <p className="text-rose-400 font-bold">
                            ERROR: {st.error}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-charcoal-850 border-t border-charcoal-700 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Certified by AutoPilot AI Autonomous Engine
              </span>
              <button
                onClick={() => {
                  setShowExecutionModal(false);
                  onNavigateToHistory();
                }}
                className="px-4 py-2 rounded-lg bg-charcoal-800 hover:bg-charcoal-700 text-slate-200 text-xs font-medium border border-charcoal-700"
              >
                View in Execution History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
