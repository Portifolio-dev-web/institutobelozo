import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { api, errMsg } from "@/lib/api";
import { fmtLong } from "@/lib/format";

export const CancelDialog = ({ appt, onClose, onDone }) => {
  const [scope, setScope] = useState("single");
  const submit = async () => {
    try {
      await api.post(`/admin/appointments/${appt.id}/cancel`, { scope });
      toast.success("Cancelado — cliente notificado (simulado)");
      onDone();
      onClose();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent data-testid="cancel-dialog">
        <DialogHeader>
          <DialogTitle className="font-display">Cancelar sessão</DialogTitle>
          <DialogDescription className="first-letter:uppercase-first">{appt.client_name} · {fmtLong(appt.date)} às {appt.time}</DialogDescription>
        </DialogHeader>
        {appt.recurrence_id && (
          <RadioGroup value={scope} onValueChange={setScope} className="space-y-2">
            <Label className="flex items-center gap-3 rounded-xl border p-3 cursor-pointer"><RadioGroupItem value="single" data-testid="cancel-scope-single" />Só esta sessão</Label>
            <Label className="flex items-center gap-3 rounded-xl border p-3 cursor-pointer"><RadioGroupItem value="future" data-testid="cancel-scope-future" />Esta e todas as próximas</Label>
          </RadioGroup>
        )}
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-5 h-10 rounded-full border text-sm" data-testid="cancel-dialog-back">Voltar</button>
          <button onClick={submit} className="px-5 h-10 rounded-full bg-charcoal text-cream text-sm" data-testid="cancel-dialog-confirm">Confirmar cancelamento</button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
