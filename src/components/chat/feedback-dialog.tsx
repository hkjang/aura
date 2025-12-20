
import { useState } from "react";
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"; // Assuming shadcn/ui
// import { Button } from "@/components/ui/button";
// import { Textarea } from "@/components/ui/textarea";

// Mocking UI components as standard HTML/Tailwind for speed if not present, but using standard structure
// Assuming we have basic UI components. If not, I'll use raw HTML structures styled with Tailwind.

import { X } from "lucide-react";

interface FeedbackDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}

export function FeedbackDialog({ isOpen, onClose, onSubmit }: FeedbackDialogProps) {
  const [reason, setReason] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-800 p-6 animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Provide Feedback</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-700">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
          Please let us know why this response wasn't helpful. This helps us improve.
        </p>

        <textarea
          className="w-full h-32 p-3 text-sm rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none mb-4"
          placeholder="e.g. The information was outdated..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={() => {
                onSubmit(reason);
                setReason("");
            }}
            disabled={!reason.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-md disabled:opacity-50"
          >
            Submit Report
          </button>
        </div>
      </div>
    </div>
  );
}
