"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { User as UserIcon, Save, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  
  const [name, setName] = useState(session?.user?.name || "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (res.ok) {
        setMessage("Profile updated successfully!");
        // Update session client-side
        await update({ name });
        router.refresh();
      } else {
        setMessage("Failed to update profile.");
      }
    } catch (error) {
      console.error(error);
      setMessage("An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto mt-10">
      <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-violet-500" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input value={session?.user?.email || ""} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <Input 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Your Name"
                minLength={2}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between items-center">
             <div className="text-sm text-green-600 font-medium">{message}</div>
             <Button type="submit" disabled={loading}>
               {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
               Save Changes
             </Button>
          </CardFooter>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account Role</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
             <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg font-mono font-bold">
               {session?.user?.role || "USER"}
             </div>
             <p className="text-sm text-muted-foreground">
               Your current role determines your access permissions.
               {session?.user?.role !== "ADMIN" && " Contact an administrator to upgrade."}
             </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
