"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
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
        setMessage("프로필이 업데이트되었습니다!");
        await update({ name });
        router.refresh();
      } else {
        setMessage("프로필 업데이트에 실패했습니다.");
      }
    } catch (error) {
      console.error(error);
      setMessage("오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '640px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '24px' }}>
        프로필 설정
      </h1>
      
      <Card style={{ marginBottom: '24px' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserIcon style={{ width: '20px', height: '20px', color: 'var(--color-primary)' }} />
            개인 정보
          </h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="form-group">
              <label className="form-label">이메일</label>
              <Input value={session?.user?.email || ""} disabled style={{ background: 'var(--bg-secondary)' }} />
              <p className="form-hint">이메일은 변경할 수 없습니다.</p>
            </div>
            
            <div className="form-group">
              <label className="form-label">이름</label>
              <Input 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="이름을 입력하세요"
                minLength={2}
              />
            </div>
          </div>
          <div style={{ 
            padding: '16px 24px', 
            borderTop: '1px solid var(--border-color)', 
            background: 'var(--bg-secondary)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
             <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-success)' }}>{message}</div>
             <Button type="submit" disabled={loading}>
               {loading ? <Loader2 style={{ width: '16px', height: '16px', marginRight: '8px' }} className="animate-spin" /> : <Save style={{ width: '16px', height: '16px', marginRight: '8px' }} />}
               변경 저장
             </Button>
          </div>
        </form>
      </Card>

      <Card>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>계정 역할</h2>
        </div>
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
             <div style={{ 
               padding: '12px 16px', 
               background: 'var(--bg-tertiary)', 
               borderRadius: 'var(--radius-md)', 
               fontFamily: 'monospace', 
               fontWeight: 700,
               color: 'var(--text-primary)',
               border: '1px solid var(--border-color)'
             }}>
               {session?.user?.role === "ADMIN" ? "관리자" : "사용자"}
             </div>
             <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
               현재 역할이 접근 권한을 결정합니다.
               {session?.user?.role !== "ADMIN" && " 업그레이드가 필요하면 관리자에게 문의하세요."}
             </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
