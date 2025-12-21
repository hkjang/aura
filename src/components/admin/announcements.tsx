"use client";

import { useState, useEffect } from "react";
import { 
  Megaphone, 
  Plus, 
  Trash2, 
  Edit, 
  Check,
  X,
  AlertCircle,
  AlertTriangle,
  Info,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: "LOW" | "NORMAL" | "HIGH" | "CRITICAL";
  isActive: boolean;
  startDate: string;
  endDate: string | null;
  createdAt: string;
}

const priorityConfig = {
  LOW: { label: "낮음", color: "#6b7280", icon: Info },
  NORMAL: { label: "보통", color: "#3b82f6", icon: Info },
  HIGH: { label: "높음", color: "#f59e0b", icon: AlertTriangle },
  CRITICAL: { label: "긴급", color: "#ef4444", icon: AlertCircle },
};

export function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    priority: "NORMAL" as Announcement["priority"],
    isActive: true,
    endDate: "",
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch("/api/admin/announcements");
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data);
      }
    } catch (error) {
      console.error("Failed to fetch announcements:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId 
        ? `/api/admin/announcements/${editingId}` 
        : "/api/admin/announcements";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        resetForm();
        fetchAnnouncements();
      }
    } catch (error) {
      console.error("Failed to save announcement:", error);
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingId(announcement.id);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority,
      isActive: announcement.isActive,
      endDate: announcement.endDate?.split("T")[0] || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      const res = await fetch(`/api/admin/announcements/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchAnnouncements();
      }
    } catch (error) {
      console.error("Failed to delete announcement:", error);
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      await fetch(`/api/admin/announcements/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      fetchAnnouncements();
    } catch (error) {
      console.error("Failed to toggle announcement:", error);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      title: "",
      content: "",
      priority: "NORMAL",
      isActive: true,
      endDate: "",
    });
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
        <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--text-primary)" }}>
          공지 관리
        </h2>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
          {showForm ? "취소" : "새 공지"}
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {editingId ? "공지 수정" : "새 공지 작성"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label">제목</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="공지 제목"
                  required
                />
              </div>

              <div>
                <label className="form-label">내용</label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="공지 내용을 입력하세요"
                  style={{ minHeight: "100px" }}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
                <div>
                  <label className="form-label">우선순위</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as Announcement["priority"] })}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--border-color)",
                      background: "var(--bg-primary)",
                      color: "var(--text-primary)",
                    }}
                  >
                    {Object.entries(priorityConfig).map(([key, config]) => (
                      <option key={key} value={key}>{config.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">종료일 (선택)</label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>

                <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: "8px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      style={{ width: "18px", height: "18px" }}
                    />
                    <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>활성화</span>
                  </label>
                </div>
              </div>

              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                <Button type="button" variant="outline" onClick={resetForm}>
                  취소
                </Button>
                <Button type="submit">
                  <Check className="w-4 h-4 mr-2" />
                  {editingId ? "수정" : "저장"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Announcements List */}
      <div className="space-y-3">
        {announcements.length === 0 ? (
          <Card>
            <CardContent style={{ textAlign: "center", padding: "40px", color: "var(--text-tertiary)" }}>
              <Megaphone className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>등록된 공지가 없습니다.</p>
            </CardContent>
          </Card>
        ) : (
          announcements.map((announcement) => {
            const config = priorityConfig[announcement.priority];
            const Icon = config.icon;
            
            return (
              <Card 
                key={announcement.id}
                style={{ 
                  borderLeft: `4px solid ${config.color}`,
                  opacity: announcement.isActive ? 1 : 0.6,
                }}
              >
                <CardContent style={{ padding: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                        <Icon style={{ width: "16px", height: "16px", color: config.color }} />
                        <span style={{ 
                          fontSize: "11px", 
                          padding: "2px 8px", 
                          borderRadius: "4px",
                          background: `${config.color}20`,
                          color: config.color,
                          fontWeight: 600,
                        }}>
                          {config.label}
                        </span>
                        {!announcement.isActive && (
                          <span style={{ 
                            fontSize: "11px", 
                            padding: "2px 8px", 
                            borderRadius: "4px",
                            background: "var(--bg-tertiary)",
                            color: "var(--text-tertiary)",
                          }}>
                            비활성
                          </span>
                        )}
                      </div>
                      <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>
                        {announcement.title}
                      </h3>
                      <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                        {announcement.content}
                      </p>
                      <p style={{ fontSize: "11px", color: "var(--text-tertiary)", marginTop: "8px" }}>
                        {new Date(announcement.createdAt).toLocaleDateString("ko-KR")}
                        {announcement.endDate && ` ~ ${new Date(announcement.endDate).toLocaleDateString("ko-KR")}`}
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: "4px" }}>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => toggleActive(announcement.id, announcement.isActive)}
                      >
                        {announcement.isActive ? "비활성화" : "활성화"}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(announcement)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDelete(announcement.id)}
                        style={{ color: "#ef4444" }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
