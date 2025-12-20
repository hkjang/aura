"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Users, Shield, ShieldAlert } from "lucide-react";
import { useSession } from "next-auth/react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function UsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      
      if (res.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      }
    } catch (error) {
      console.error("역할 업데이트 실패", error);
    }
  };

  if (session?.user?.role !== "ADMIN") {
    return (
      <div className="empty-state">
        <ShieldAlert className="empty-state-icon" style={{ color: 'var(--color-error)' }} />
        <h2 className="empty-state-title">접근 거부</h2>
        <p className="empty-state-description">이 페이지를 볼 권한이 없습니다.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Users style={{ width: '28px', height: '28px', color: 'var(--color-primary)' }} />
          사용자 관리
        </h1>
        <Button onClick={fetchUsers} isLoading={loading}>
          새로고침
        </Button>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>이름</th>
              <th>이메일</th>
              <th>역할</th>
              <th>가입일</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td style={{ fontWeight: 500 }}>{user.name || "이름 없음"}</td>
                <td>{user.email}</td>
                <td>
                  <span className={`status ${user.role === "ADMIN" ? 'status-info' : 'status-success'}`}>
                    {user.role === "ADMIN" ? "관리자" : "사용자"}
                  </span>
                </td>
                <td>{new Date(user.createdAt).toLocaleDateString('ko-KR')}</td>
                <td>
                  {user.role === "USER" ? (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleRoleChange(user.id, "ADMIN")}
                    >
                      <Shield style={{ width: '12px', height: '12px', marginRight: '4px' }} /> 관리자 승격
                    </Button>
                  ) : (
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => handleRoleChange(user.id, "USER")}
                      disabled={user.email === session.user.email}
                    >
                      사용자로 강등
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
