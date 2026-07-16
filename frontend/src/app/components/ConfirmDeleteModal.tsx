import { AlertTriangle } from "lucide-react";

type Props = {
  open: boolean;
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDeleteModal({
  open,
  title,
  message,
  onCancel,
  onConfirm,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-card shadow-xl">
        <div className="p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-full bg-destructive/10 p-3">
              <AlertTriangle className="text-destructive" size={22} />
            </div>

            <h2 className="text-lg font-semibold">{title}</h2>
          </div>

          <p className="text-sm text-muted-foreground">{message}</p>
        </div>

        <div className="flex justify-end gap-3 border-t p-4">
          <button
            onClick={onCancel}
            className="rounded-md border px-4 py-2 hover:bg-muted"
          >
            Cancelar
          </button>

          <button
            onClick={onConfirm}
            className="rounded-md bg-destructive px-4 py-2 text-white hover:opacity-90"
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
}
