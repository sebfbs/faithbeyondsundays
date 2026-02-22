import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface ExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (expense: { name: string; amount_cents: number; frequency: string; category: string; notes?: string }) => void;
  initial?: { id: string; name: string; amount_cents: number; frequency: string; category: string; notes?: string } | null;
}

export default function ExpenseDialog({ open, onOpenChange, onSave, initial }: ExpenseDialogProps) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState("monthly");
  const [category, setCategory] = useState("other");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (initial) {
      setName(initial.name);
      setAmount((initial.amount_cents / 100).toFixed(2));
      setFrequency(initial.frequency);
      setCategory(initial.category);
      setNotes(initial.notes ?? "");
    } else {
      setName(""); setAmount(""); setFrequency("monthly"); setCategory("other"); setNotes("");
    }
  }, [initial, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      amount_cents: Math.round(parseFloat(amount) * 100),
      frequency,
      category,
      notes: notes || undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-slate-100">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Expense" : "Add Expense"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-slate-300">Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} required className="bg-slate-800 border-slate-700 text-slate-100" placeholder="e.g. Apple Developer Account" />
          </div>
          <div>
            <Label className="text-slate-300">Amount ($)</Label>
            <Input type="number" step="0.01" min="0" value={amount} onChange={e => setAmount(e.target.value)} required className="bg-slate-800 border-slate-700 text-slate-100" placeholder="9.99" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-slate-300">Frequency</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                  <SelectItem value="one-time">One-time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="hosting">Hosting</SelectItem>
                  <SelectItem value="api">API / Services</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-slate-300">Notes (optional)</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} className="bg-slate-800 border-slate-700 text-slate-100" rows={2} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="text-slate-400">Cancel</Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Save</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
