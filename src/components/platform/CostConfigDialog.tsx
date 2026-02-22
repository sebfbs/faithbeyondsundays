import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CostConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: { key: string; value_cents: number; label: string }[];
  onSave: (key: string, value_cents: number) => void;
}

export default function CostConfigDialog({ open, onOpenChange, items, onSave }: CostConfigDialogProps) {
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    const v: Record<string, string> = {};
    items.forEach(i => { v[i.key] = (i.value_cents / 100).toFixed(2); });
    setValues(v);
  }, [items, open]);

  const handleSave = () => {
    items.forEach(i => {
      const newCents = Math.round(parseFloat(values[i.key] || "0") * 100);
      if (newCents !== i.value_cents) {
        onSave(i.key, newCents);
      }
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-slate-100">
        <DialogHeader>
          <DialogTitle>Cost Assumptions</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-slate-400 -mt-2">Adjust the unit costs used for auto-calculated estimates.</p>
        <div className="space-y-4 mt-2">
          {items.map(i => (
            <div key={i.key}>
              <Label className="text-slate-300">{i.label}</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={values[i.key] ?? ""}
                onChange={e => setValues(prev => ({ ...prev, [i.key]: e.target.value }))}
                className="bg-slate-800 border-slate-700 text-slate-100"
              />
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-slate-400">Cancel</Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
