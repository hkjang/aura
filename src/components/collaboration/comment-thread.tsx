"use client";

import { useState } from "react";
import { 
  MessageCircle, 
  Send, 
  MoreHorizontal,
  Edit2,
  Trash2,
  Reply,
  ThumbsUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Comment {
  id: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  content: string;
  timestamp: Date;
  likes: number;
  replies?: Comment[];
  isEditing?: boolean;
}

interface CommentThreadProps {
  responseId: string;
  comments: Comment[];
  currentUserId?: string;
  onAddComment: (content: string, parentId?: string) => void;
  onEditComment: (commentId: string, content: string) => void;
  onDeleteComment: (commentId: string) => void;
  onLikeComment: (commentId: string) => void;
}

export function CommentThread({
  responseId,
  comments,
  currentUserId = "current-user",
  onAddComment,
  onEditComment,
  onDeleteComment,
  onLikeComment
}: CommentThreadProps) {
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");

  const handleSubmit = () => {
    if (!newComment.trim()) return;
    onAddComment(newComment);
    setNewComment("");
  };

  const handleReply = (parentId: string) => {
    if (!replyContent.trim()) return;
    onAddComment(replyContent, parentId);
    setReplyContent("");
    setReplyingTo(null);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("ko-KR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  };

  const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => {
    const [showMenu, setShowMenu] = useState(false);
    const [editContent, setEditContent] = useState(comment.content);
    const [isEditing, setIsEditing] = useState(false);
    const isOwn = comment.author.id === currentUserId;

    return (
      <div className={`${isReply ? "ml-8 border-l-2 border-zinc-100 dark:border-zinc-800 pl-4" : ""}`}>
        <div className="flex items-start gap-3 py-3">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-sm font-medium text-violet-600 flex-shrink-0">
            {comment.author.name[0].toUpperCase()}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm">{comment.author.name}</span>
              <span className="text-xs text-muted-foreground">{formatTime(comment.timestamp)}</span>
            </div>

            {isEditing ? (
              <div className="flex gap-2">
                <Input
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  size="sm" 
                  onClick={() => {
                    onEditComment(comment.id, editContent);
                    setIsEditing(false);
                  }}
                >
                  Save
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <p className="text-sm">{comment.content}</p>
            )}

            {/* Actions */}
            {!isEditing && (
              <div className="flex items-center gap-3 mt-2">
                <button
                  onClick={() => onLikeComment(comment.id)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ThumbsUp className="w-3 h-3" />
                  {comment.likes > 0 && comment.likes}
                </button>
                
                <button
                  onClick={() => setReplyingTo(comment.id)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Reply className="w-3 h-3" />
                  Reply
                </button>

                {isOwn && (
                  <div className="relative">
                    <button
                      onClick={() => setShowMenu(!showMenu)}
                      className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                    >
                      <MoreHorizontal className="w-3 h-3" />
                    </button>
                    
                    {showMenu && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                        <div className="absolute left-0 top-full mt-1 z-50 bg-white dark:bg-zinc-900 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-800 py-1 min-w-[100px]">
                          <button
                            onClick={() => {
                              setIsEditing(true);
                              setShowMenu(false);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800"
                          >
                            <Edit2 className="w-3 h-3" />
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              onDeleteComment(comment.id);
                              setShowMenu(false);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Reply Input */}
        {replyingTo === comment.id && (
          <div className="ml-11 flex gap-2 pb-3">
            <Input
              placeholder="Write a reply..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleReply(comment.id)}
              className="flex-1"
            />
            <Button size="sm" onClick={() => handleReply(comment.id)}>
              Reply
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setReplyingTo(null)}>
              Cancel
            </Button>
          </div>
        )}

        {/* Replies */}
        {comment.replies?.map((reply) => (
          <CommentItem key={reply.id} comment={reply} isReply />
        ))}
      </div>
    );
  };

  return (
    <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 mt-4">
      <h4 className="font-medium text-sm flex items-center gap-2 mb-4">
        <MessageCircle className="w-4 h-4 text-violet-500" />
        Comments ({comments.length})
      </h4>

      {/* Comment Input */}
      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          className="flex-1"
        />
        <Button onClick={handleSubmit} disabled={!newComment.trim()}>
          <Send className="w-4 h-4" />
        </Button>
      </div>

      {/* Comments List */}
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
        {comments.map((comment) => (
          <CommentItem key={comment.id} comment={comment} />
        ))}
      </div>

      {comments.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-4">
          No comments yet. Be the first to comment!
        </p>
      )}
    </div>
  );
}
