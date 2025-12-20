import ChatInterface from "@/components/chat/chat-interface";

// Prevent static prerendering
export const dynamic = 'force-dynamic';

export default function ChatPage() {
  return (
    <div className="h-full">
      <ChatInterface />
    </div>
  );
}
