"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Smile } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { createClient } from "@/lib/supabase/client";
import { EmojiPicker } from "@/components/emoji-picker";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ChatMessage { id: string; user_id: string; username: string; photo_url: string | null; level: number; message: string; created_at: string; }

export function CommunityChat() {
  const { user, userData } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const client = createClient();

  const scrollToBottom = useCallback(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), []);

  useEffect(() => {
    if (!client) return;
    let active = true;
    const load = async () => {
      const { data } = await client.from("community_chat").select("id,user_id,username,photo_url,level,message,created_at").order("created_at", { ascending: false }).limit(50);
      if (active) setMessages(((data ?? []) as ChatMessage[]).reverse());
    };
    void load();
    const channel = client.channel("public:community_chat").on("postgres_changes", { event: "INSERT", schema: "public", table: "community_chat" }, ({ new: row }) => {
      if (active) setMessages((current) => [...current, row as ChatMessage].slice(-50));
    }).subscribe();
    return () => { active = false; void client.removeChannel(channel); };
  }, [client]);

  useEffect(() => { if (open) scrollToBottom(); }, [messages, open, scrollToBottom]);

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!client || !user || !userData || !value.trim() || sending) return;
    const message = value.trim(); setValue(""); setEmojiOpen(false); setSending(true);
    const { error } = await client.from("community_chat").insert({ user_id: user.id, username: userData.username, photo_url: userData.photoURL, level: userData.level, message });
    if (error) setValue(message);
    setSending(false); inputRef.current?.focus();
  };

  return <>
    <button aria-label="Open community chat" onClick={() => setOpen(true)} className={`fixed bottom-24 right-6 lg:bottom-6 z-50 size-14 rounded-full brand-gradient shadow-lg flex items-center justify-center transition-transform hover:scale-105 ${open ? "hidden" : ""}`}><MessageCircle className="size-6 text-white" /></button>
    {open && <div className="fixed inset-0 z-[100] flex items-end justify-end lg:inset-auto lg:bottom-6 lg:right-6">
      <button aria-label="Close chat backdrop" className="absolute inset-0 bg-black/60 lg:hidden" onClick={() => setOpen(false)} />
      <section className="relative flex h-[min(34rem,100dvh)] w-full max-w-[30rem] flex-col overflow-hidden rounded-t-2xl border border-border bg-card shadow-2xl lg:rounded-2xl">
        <header className="flex items-center justify-between border-b border-border bg-secondary/50 p-4"><div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-xl brand-gradient"><MessageCircle className="size-5 text-white" /></div><div><h2 className="font-bold text-foreground">Community Chat</h2><p className="text-xs text-muted-foreground">Latest messages</p></div></div><button aria-label="Close community chat" onClick={() => setOpen(false)} className="flex size-8 items-center justify-center rounded-lg bg-secondary"><X className="size-4 text-muted-foreground" /></button></header>
        <div className="flex-1 overflow-y-auto p-4"><div className="flex flex-col gap-3">{messages.map((item) => <div key={item.id} className={`flex gap-2 ${item.user_id === user?.id ? "flex-row-reverse" : ""}`}><Avatar className="size-8 shrink-0"><AvatarImage src={item.photo_url ?? ""} /><AvatarFallback>{item.username?.[0]?.toUpperCase() ?? "U"}</AvatarFallback></Avatar><div className={`flex max-w-[75%] flex-col ${item.user_id === user?.id ? "items-end" : "items-start"}`}><div className="mb-1 flex items-center gap-2"><span className="text-xs font-semibold text-foreground/80">{item.username}</span><span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-500">Lv.{item.level}</span></div><div className={`rounded-xl px-3 py-2 text-sm ${item.user_id === user?.id ? "rounded-tr-sm bg-primary text-primary-foreground" : "rounded-tl-sm bg-secondary text-foreground"}`}>{item.message}</div><time className="mt-1 text-[10px] text-muted-foreground">{new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time></div></div>)}{messages.length === 0 && <p className="py-12 text-center text-sm text-muted-foreground">No messages yet. Be the first to say hello.</p>}<div ref={endRef} /></div></div>
        {user && userData ? <form onSubmit={send} className="flex gap-2 border-t border-border bg-secondary/30 p-3"><div className="relative"><button type="button" aria-label="Add emoji" onClick={() => setEmojiOpen((current) => !current)} className="flex size-10 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground"><Smile className="size-5" /></button>{emojiOpen && <EmojiPicker onSelect={(emoji) => { setValue((current) => current + emoji); inputRef.current?.focus(); }} onClose={() => setEmojiOpen(false)} />}</div><input ref={inputRef} value={value} onChange={(event) => setValue(event.target.value)} maxLength={500} disabled={sending} placeholder="Type your message..." className="min-w-0 flex-1 rounded-xl border border-border bg-background px-4 text-sm text-foreground outline-none focus:border-primary" /><button type="submit" aria-label="Send message" disabled={!value.trim() || sending} className="flex size-10 items-center justify-center rounded-xl brand-gradient text-white disabled:opacity-50"><Send className="size-5" /></button></form> : <p className="border-t border-border p-4 text-center text-sm text-muted-foreground">Sign in to join the conversation</p>}
      </section>
    </div>}
  </>;
}
