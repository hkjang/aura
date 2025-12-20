"use client";

import { useChat } from "@ai-sdk/react";
import { ChatMessage } from "./chat-message";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, StopCircle } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function ChatInterface() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, stop } = useChat({
    api: "/api/chat",
  } as any) as any;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <Card className="flex-1 flex flex-col overflow-hidden border-0 shadow-none bg-transparent">
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Send className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium mb-2">Start a new conversation</h3>
              <p className="max-w-sm">
                Ask about code, documents, or general knowledge. Aura is ready to assist.
              </p>
            </div>
          ) : (
            messages.map((m: any) => <ChatMessage key={m.id} message={m} />)
          )}
        </div>

        <div className="p-4 border-t bg-background/50 backdrop-blur">
          <form onSubmit={handleSubmit} className="flex gap-2 max-w-4xl mx-auto">
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder="Type your message..."
              className="flex-1"
            />
            {isLoading ? (
              <Button type="button" onClick={stop} variant="destructive" size="icon">
                <StopCircle className="w-4 h-4" />
              </Button>
            ) : (
              <Button type="submit" disabled={!input.trim()} size="icon">
                <Send className="w-4 h-4" />
              </Button>
            )}
          </form>
        </div>
      </Card>
    </div>
  );
}
