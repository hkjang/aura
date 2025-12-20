"use client";

import { useState } from "react";
import { 
  Link2, 
  Copy, 
  Check, 
  Eye, 
  Edit3, 
  Users,
  X,
  Share2,
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  itemType: "chat" | "document" | "template";
  itemTitle: string;
}

type Permission = "view" | "edit" | "none";

interface SharedUser {
  id: string;
  email: string;
  name: string;
  permission: Permission;
}

export function ShareDialog({ isOpen, onClose, itemId, itemType, itemTitle }: ShareDialogProps) {
  const [linkCopied, setLinkCopied] = useState(false);
  const [email, setEmail] = useState("");
  const [selectedPermission, setSelectedPermission] = useState<Permission>("view");
  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([]);
  const [linkPermission, setLinkPermission] = useState<Permission>("view");
  const [isPublicLink, setIsPublicLink] = useState(false);

  if (!isOpen) return null;

  const shareLink = `${typeof window !== "undefined" ? window.location.origin : ""}/shared/${itemType}/${itemId}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleAddUser = () => {
    if (!email.trim()) return;
    
    const newUser: SharedUser = {
      id: `user-${Date.now()}`,
      email: email.trim(),
      name: email.split("@")[0],
      permission: selectedPermission,
    };
    
    setSharedUsers([...sharedUsers, newUser]);
    setEmail("");
  };

  const updateUserPermission = (userId: string, permission: Permission) => {
    if (permission === "none") {
      setSharedUsers(sharedUsers.filter((u) => u.id !== userId));
    } else {
      setSharedUsers(
        sharedUsers.map((u) => (u.id === userId ? { ...u, permission } : u))
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-violet-500" />
            <h3 className="font-semibold">Share &quot;{itemTitle}&quot;</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Add People */}
          <div>
            <label className="text-sm font-medium mb-2 block">Add people</label>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddUser()}
                className="flex-1"
              />
              <select
                value={selectedPermission}
                onChange={(e) => setSelectedPermission(e.target.value as Permission)}
                className="px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-transparent text-sm"
              >
                <option value="view">Can view</option>
                <option value="edit">Can edit</option>
              </select>
              <Button onClick={handleAddUser} size="sm">
                Add
              </Button>
            </div>
          </div>

          {/* Shared Users List */}
          {sharedUsers.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Shared with</label>
              {sharedUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-sm font-medium text-violet-600">
                      {user.name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <select
                    value={user.permission}
                    onChange={(e) => updateUserPermission(user.id, e.target.value as Permission)}
                    className="px-2 py-1 text-xs border border-zinc-200 dark:border-zinc-700 rounded bg-transparent"
                  >
                    <option value="view">Can view</option>
                    <option value="edit">Can edit</option>
                    <option value="none">Remove</option>
                  </select>
                </div>
              ))}
            </div>
          )}

          {/* Link Sharing */}
          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Link sharing</span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs text-muted-foreground">
                  {isPublicLink ? "Anyone with link" : "Restricted"}
                </span>
                <button
                  onClick={() => setIsPublicLink(!isPublicLink)}
                  className={`w-10 h-5 rounded-full transition-colors ${
                    isPublicLink ? "bg-violet-500" : "bg-zinc-300 dark:bg-zinc-600"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${
                      isPublicLink ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </label>
            </div>

            {isPublicLink && (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg text-xs truncate">
                    {shareLink}
                  </div>
                  <Button variant="outline" size="sm" onClick={handleCopyLink}>
                    {linkCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Link permission:</span>
                  <button
                    onClick={() => setLinkPermission("view")}
                    className={`flex items-center gap-1 px-2 py-1 rounded ${
                      linkPermission === "view" ? "bg-violet-100 dark:bg-violet-900/30 text-violet-600" : ""
                    }`}
                  >
                    <Eye className="w-3 h-3" /> View
                  </button>
                  <button
                    onClick={() => setLinkPermission("edit")}
                    className={`flex items-center gap-1 px-2 py-1 rounded ${
                      linkPermission === "edit" ? "bg-violet-100 dark:bg-violet-900/30 text-violet-600" : ""
                    }`}
                  >
                    <Edit3 className="w-3 h-3" /> Edit
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-200 dark:border-zinc-800">
          <Button className="w-full" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
