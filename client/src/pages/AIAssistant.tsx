import { useState, useRef, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type Message = { type: "bot" | "user" | "system"; text: string };
type DonorMatch = { bg: string; name: string; area: string; phone: string };
type Lang = "English" | "Hindi" | "Bengali";

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    { type: "bot", text: "Namaste! I'm RaktaSetu AI. Tell me about the blood requirement — in Hindi, Bengali, or English." },
  ]);
  const [input, setInput] = useState("");
  const [lang, setLang] = useState<Lang>("English");
  const [isTyping, setIsTyping] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();

  const chatMutation = trpc.ai.chat.useMutation();

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { type: "user", text: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);
    const typingId = crypto.randomUUID();
    setMessages(prev => [...prev, { type: "system", text: "RaktaSetu AI is typing…" }]);

    try {
      const res = await chatMutation.mutateAsync({ message: text.trim(), language: lang });
      const contentStr = typeof res.content === "string" ? res.content : JSON.stringify(res.content);
      let parsed;
      try { parsed = JSON.parse(contentStr); } catch { /* fallback */ }
      setMessages(prev => prev.filter(m => m.text !== "RaktaSetu AI is typing…"));
      setIsTyping(false);

      if (parsed?.reply) {
        setMessages(prev => [...prev, { type: "bot", text: parsed.reply }]);
      } else {
        setMessages(prev => [...prev, { type: "bot", text: contentStr || "Sorry, I couldn't process that. Please try again." }]);
      }

      if (parsed?.intent === "blood_request" && parsed.blood_group) {
        const matches = await utils.donors.match.fetch({ bloodGroup: parsed.blood_group, location: parsed.location || undefined });
        if (matches && matches.length > 0) {
          setMessages(prev => [...prev, ...(matches.slice(0, 3) as any).map((d: any) => ({
            type: "donor" as const,
            bg: d.bloodGroup,
            name: d.name,
            area: d.area,
            phone: d.phone,
          }))]);
        } else {
          setMessages(prev => [...prev, { type: "system", text: "No exact matches found right now in the directory — try the Blood Banks tab for 24×7 hospital stock." }]);
        }
      }
    } catch (err) {
      setMessages(prev => prev.filter(m => m.text !== "RaktaSetu AI is typing…"));
      setIsTyping(false);
      setMessages(prev => [...prev, { type: "system", text: "Network error reaching the AI service. Please try again." }]);
    }
  }, [lang, chatMutation, utils.donors.match]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  const quickChips = [
    "I urgently need B+ blood in Salt Lake, Kolkata",
    "Where is the nearest blood bank in Park Street?",
    "Am I eligible to donate blood?",
  ];

  return (
    <div className="px-4 md:px-10 py-14">
      <p className="text-[#C8143C] font-bold text-xs tracking-[0.08em] uppercase mb-2">AI Assistant</p>
      <h2 className="text-3xl font-extrabold mb-5">✳ Blood emergency chat</h2>
      <div className="max-w-[760px] mx-auto">
        {/* Language Toggle */}
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
          <div />
          <div className="flex gap-1.5 bg-[#F3F4F6] p-1 rounded-full">
            {(["English", "Hindi", "Bengali"] as Lang[]).map(l => (
              <button
                key={l}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${lang === l ? "bg-[#C8143C] text-white" : "text-[#6B7280] hover:text-[#C8143C]"}`}
                onClick={() => setLang(l)}
              >
                {l === "Hindi" ? "हिन्दी" : l === "Bengali" ? "বাংলা" : l}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Box */}
        <div ref={chatRef} className="bg-[#EAF6F0] rounded-2xl p-5 min-h-[360px] max-h-[440px] overflow-y-auto flex flex-col gap-3">
          {messages.map((m, i) => (
            <div key={i}>
              {m.type === "bot" && (
                <div className="max-w-[80%] bg-white rounded-xl p-3 px-4 text-sm leading-relaxed self-start rounded-bl-sm">
                  {m.text}
                </div>
              )}
              {m.type === "user" && (
                <div className="max-w-[80%] bg-[#C8143C] text-white rounded-xl p-3 px-4 text-sm leading-relaxed self-end ml-auto rounded-br-sm">
                  {m.text}
                </div>
              )}
              {m.type === "system" && (
                <div className="max-w-[80%] bg-[#FFF6D8] rounded-xl p-2 px-4 text-xs text-[#8a6d00] self-center text-center italic">
                  {m.text}
                </div>
              )}
              {/* @ts-ignore */}
              {m.type === "donor" && (
                <div className="max-w-[80%] bg-white border border-[#E7E9EC] rounded-xl p-2.5 px-3.5 text-xs self-start flex justify-between items-center gap-3">
                  <span><b className="text-[#C8143C]">{/* @ts-ignore */}m.bg</b> {/* @ts-ignore */}m.name · {/* @ts-ignore */}m.area</span>
                  <span>{/* @ts-ignore */}m.phone</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Quick Chips */}
        <div className="flex flex-wrap gap-2 mt-3.5">
          {quickChips.map(c => (
            <button
              key={c}
              className="border border-[#E7E9EC] bg-white rounded-full px-3.5 py-1.5 text-xs text-[#374151] hover:border-[#C8143C] hover:text-[#C8143C] transition-colors"
              onClick={() => sendMessage(c)}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="flex gap-2.5 mt-3.5">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMessage(input)}
            placeholder="Type your emergency... (Hindi / Bengali / English)"
            className="flex-1 rounded-full px-5 py-3 border-[#E7E9EC] focus:border-[#C8143C]"
          />
          <button
            className="w-11 h-11 rounded-full bg-[#C8143C] text-white flex items-center justify-center text-base hover:bg-[#9E0F30] transition-colors flex-shrink-0"
            onClick={() => sendMessage(input)}
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}
