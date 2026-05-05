import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, Plus, Pencil, Trash2, Settings2 } from "lucide-react";
import ExpenseDialog from "./ExpenseDialog";
import CostConfigDialog from "./CostConfigDialog";

// ElevenLabs Scribe v2: $0.0125 per minute = 1.25 cents per minute
const ELEVENLABS_CENTS_PER_MINUTE = 1.25;
// Each completed sermon job generates 7 AI content calls
const AI_CALLS_PER_SERMON = 7;

interface FinancialOverviewProps {
  totalSermonMinutes: number;
  completedJobCount: number;
  costConfig: Record<string, number>;
  costConfigItems: { key: string; value_cents: number; label: string }[];
  expenses: any[];
  addExpense: { mutate: (data: any) => void; isPending: boolean };
  updateExpense: { mutate: (data: any) => void };
  deleteExpense: { mutate: (id: string) => void };
  updateCostConfig: { mutate: (data: { key: string; value_cents: number }) => void };
}

function toMonthly(amount_cents: number, frequency: string) {
  if (frequency === "yearly") return amount_cents / 12;
  if (frequency === "one-time") return 0;
  return amount_cents;
}

export default function FinancialOverview({
  totalSermonMinutes, completedJobCount, costConfig, costConfigItems, expenses,
  addExpense, updateExpense, deleteExpense, updateCostConfig,
}: FinancialOverviewProps) {
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [costConfigOpen, setCostConfigOpen] = useState(false);

  const lovablePlan = costConfig["base_hosting_monthly"] ?? 2500;
  const elevenLabsCost = totalSermonMinutes * ELEVENLABS_CENTS_PER_MINUTE;
  const costPerAiCall = costConfig["cost_per_ai_call"] ?? 2;
  const aiCost = completedJobCount * AI_CALLS_PER_SERMON * costPerAiCall;

  const autoCosts = lovablePlan + elevenLabsCost + aiCost;
  const manualMonthly = expenses.reduce((sum, e) => sum + toMonthly(e.amount_cents, e.frequency), 0);
  const totalBurn = autoCosts + manualMonthly;

  const fmt = (cents: number) => `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <>
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-emerald-400" /> Financial Overview
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setCostConfigOpen(true)} className="text-slate-400 hover:text-slate-200 h-7 px-2">
            <Settings2 className="h-3.5 w-3.5 mr-1" /> Config
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Auto-calculated */}
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Estimated Costs (auto)</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-xs text-slate-400">Vercel + Supabase</p>
                <p className="text-sm font-semibold text-slate-200">{fmt(lovablePlan)}/mo</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-xs text-slate-400">ElevenLabs STT</p>
                <p className="text-sm font-semibold text-slate-200">{fmt(elevenLabsCost)}</p>
                <p className="text-[10px] text-slate-500">{Math.round(totalSermonMinutes)} min transcribed</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-xs text-slate-400">Claude AI</p>
                <p className="text-sm font-semibold text-slate-200">{fmt(aiCost)}</p>
                <p className="text-[10px] text-slate-500">{completedJobCount * AI_CALLS_PER_SERMON} calls</p>
              </div>
            </div>
          </div>

          {/* Manual expenses */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Manual Expenses</p>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-blue-400 hover:text-blue-300" onClick={() => { setEditingExpense(null); setExpenseDialogOpen(true); }}>
                <Plus className="h-3 w-3 mr-1" /> Add
              </Button>
            </div>
            {expenses.length === 0 ? (
              <p className="text-xs text-slate-500">No manual expenses added.</p>
            ) : (
              <div className="space-y-1.5">
                {expenses.map((e: any) => (
                  <div key={e.id} className="flex items-center justify-between bg-slate-800/50 rounded-lg px-3 py-2">
                    <div>
                      <span className="text-sm text-slate-200">{e.name}</span>
                      <span className="text-xs text-slate-500 ml-2">{e.category} · {e.frequency}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-300">{fmt(e.amount_cents)}</span>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-slate-500 hover:text-slate-300" onClick={() => { setEditingExpense(e); setExpenseDialogOpen(true); }}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-slate-500 hover:text-red-400" onClick={() => deleteExpense.mutate(e.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="border-t border-slate-800 pt-3 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-sm text-slate-400">Total Monthly Burn</span>
              <span className="text-sm font-bold text-red-400">{fmt(totalBurn)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-400">Revenue</span>
              <span className="text-sm text-slate-500">$0.00 <span className="text-xs">(no pricing plan yet)</span></span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-400">Net</span>
              <span className="text-sm font-bold text-red-400">-{fmt(totalBurn)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <ExpenseDialog
        open={expenseDialogOpen}
        onOpenChange={setExpenseDialogOpen}
        initial={editingExpense}
        onSave={(data) => {
          if (editingExpense) {
            updateExpense.mutate({ id: editingExpense.id, ...data });
          } else {
            addExpense.mutate(data);
          }
        }}
      />
      <CostConfigDialog
        open={costConfigOpen}
        onOpenChange={setCostConfigOpen}
        items={costConfigItems}
        onSave={(key, value_cents) => updateCostConfig.mutate({ key, value_cents })}
      />
    </>
  );
}
