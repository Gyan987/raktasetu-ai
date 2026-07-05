import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";

const TABS = ["home", "assistant", "donors", "banks", "camps", "scan"] as const;
type TabId = (typeof TABS)[number];

export default function Home() {
  const { data: stats } = trpc.stats.get.useQuery();
  const onTab = (tab: TabId) => window.dispatchEvent(new CustomEvent("rakta-tab", { detail: tab }));

  return (
    <>
      {/* HERO */}
      <div className="flex flex-col lg:flex-row gap-12 px-4 md:px-10 pt-16 pb-10 items-center bg-gradient-to-b from-white to-[#EAF6F0]/60">
        <div className="flex-1 min-w-[320px]">
          <div className="inline-flex items-center gap-1.5 bg-[#FCE9EE] text-[#C8143C] text-xs font-bold tracking-widest px-3 py-1.5 rounded-full mb-5">
            <span className="w-2 h-2 rounded-full bg-[#C8143C] inline-block animate-pulse" />
            LIVE EMERGENCY NETWORK
          </div>
          <h1 className="text-4xl md:text-[44px] leading-[1.08] font-extrabold">
            Every minute matters.<br /><span className="text-[#C8143C]">RaktaSetu</span> finds a donor.
          </h1>
          <p className="text-[#6B7280] text-base mt-4 mb-6 max-w-[520px] leading-relaxed">
            A multilingual AI network that understands "Mere father ke liye Kolkata me urgent B+ chahiye" — extracts location, urgency, and matches compatible donors within kilometers.
          </p>
          <div className="flex flex-wrap gap-3 mb-7">
            <Button className="rounded-full bg-[#C8143C] hover:bg-[#9E0F30] text-white px-6 py-5 text-sm font-semibold" onClick={() => onTab("assistant")}>
              💧 Request Blood Now
            </Button>
            <Button variant="outline" className="rounded-full border-[#E7E9EC] px-6 py-5 text-sm font-semibold hover:border-[#C8143C] hover:text-[#C8143C]" onClick={() => onTab("assistant")}>
              💬 Talk to AI (Bangla/Hindi/EN)
            </Button>
            <Button variant="outline" className="rounded-full border-[#E7E9EC] px-6 py-5 text-sm font-semibold hover:border-[#C8143C] hover:text-[#C8143C]" onClick={() => onTab("donors")}>
              ♡ Become a Donor
            </Button>
          </div>
          <div className="flex flex-wrap gap-3">
            <StatCard label="DONORS" value={stats?.donorCount ?? 0} />
            <StatCard label="OPEN SOS" value={stats?.openSOS ?? 3} />
            <StatCard label="BLOOD BANKS" value={stats?.bankCount ?? 0} />
          </div>
        </div>
        <div className="flex-1 min-w-[300px]">
          <div className="w-full rounded-2xl bg-gradient-to-br from-[#FCE9EE] to-[#F3E9FB] h-[280px] flex items-center justify-center text-[#C8143C] font-bold relative overflow-hidden">
            <div className="absolute top-3 right-3 bg-white px-2.5 py-2 rounded-lg text-[10px] leading-tight shadow-md">
              POWERED BY<br /><small className="text-[#6B7280] font-medium">Gemma 4 model</small>
            </div>
            <span>Live donor network illustration</span>
            <div className="absolute bottom-3.5 left-3.5 bg-white rounded-xl px-3.5 py-2.5 text-xs shadow-lg flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1E8E5A]" />
              Donor Match 94% · B+ · 2.4km · ETA 18 min
            </div>
          </div>
        </div>
      </div>

      {/* FEATURES */}
      <div className="px-4 md:px-10 py-14">
        <p className="text-[#C8143C] font-bold text-xs tracking-[0.08em] uppercase mb-2">Killer AI Features</p>
        <h2 className="text-3xl font-extrabold mb-2">Built for real-world blood emergencies.</h2>
        <p className="text-[#6B7280] max-w-[560px] mb-8 leading-relaxed">
          Five intelligent capabilities that turn scattered information into a life-saving coordinated response.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <FeatureCard icon="🤖" title="Multilingual Blood Assistant" desc={`"Amar B+ blood dorkar, Salt Lake e" → 3 verified B+ donors within 5 km found. Understands Hindi, Bengali, English mixed with location, urgency & context.`} />
          <FeatureCard icon="📷" title="Medical Document Vision" desc="Upload doctor's prescription or blood slip. AI extracts blood group, units, hospital and urgency automatically." accent />
          <FeatureCard icon="🔗" title="Smart Donor Matching" desc="Beyond blood group — distance, last donation date, eligibility, and response history combined into a single match score." />
          <FeatureCard icon="🤖" title="Emergency AI Agent" desc="Auto-composes personalized outreach messages and dispatches to top-scored donors the moment a request is created." accent />
          <FeatureCard icon="📍" title="Camp Organizer Mode" desc="Colleges & NGOs predict demand, register donors, and generate awareness posts with a single click." />
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div className="px-4 md:px-10 pt-0 pb-14">
        <p className="text-[#C8143C] font-bold text-xs tracking-[0.08em] uppercase mb-2">How it works</p>
        <h2 className="text-3xl font-extrabold mb-6">From SOS to donor — in three steps.</h2>
        <div className="flex flex-col lg:flex-row gap-12 items-center bg-[#EAF6F0] rounded-3xl p-10">
          <div className="flex-1 min-w-[280px]">
            <Step num={1} title="Describe the need" desc={`Type or speak in your language: "Baba er jonno urgent B+ chai."`} />
            <Step num={2} title="AI understands & matches" desc="Location, urgency, blood group extracted. Compatible donors scored by distance, eligibility & history." />
            <Step num={3} title="Reach donors instantly" desc="Personalized emergency messages sent to top donors. Blood banks suggested with ETAs." />
          </div>
          <div className="flex-1 min-w-[260px]">
            <div className="w-full h-[260px] rounded-2xl bg-gradient-to-br from-[#FCE9EE] to-[#EAF6F0]" />
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center py-16 px-4 bg-[#DCF0E6]">
        <h2 className="text-[28px] font-extrabold mb-2">Your one gesture. Someone's tomorrow.</h2>
        <p className="text-[#6B7280] mb-6">Register as a donor and be the reason someone gets to hug their family again.</p>
        <div className="flex justify-center gap-3">
          <Button className="rounded-full bg-[#C8143C] hover:bg-[#9E0F30] text-white px-6 py-5 font-semibold" onClick={() => onTab("donors")}>Register as Donor</Button>
          <Button variant="outline" className="rounded-full border-[#E7E9EC] px-6 py-5 font-semibold hover:border-[#C8143C] hover:text-[#C8143C]" onClick={() => onTab("camps")}>Organize a Camp</Button>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="px-4 md:px-10 py-10 flex flex-wrap gap-12 border-t border-[#E7E9EC]">
        <div className="flex-1 min-w-[220px]">
          <div className="flex items-center gap-2 font-extrabold text-lg mb-2.5 cursor-pointer" onClick={() => onTab("home")}>
            <span className="w-6 h-6 rounded-full bg-[#C8143C] text-white flex items-center justify-center text-sm">🩸</span>
            <span>RaktaSetu</span><span className="text-[#C8143C]">AI</span>
          </div>
          <p className="text-[#6B7280] text-sm leading-relaxed">Emergency blood & donor intelligence network. Bridging donors and lives, powered by multilingual AI.</p>
        </div>
        <div className="min-w-[120px]">
          <h4 className="text-xs mb-2.5">Product</h4>
          <a className="text-sm text-[#6B7280] block mb-1.5 hover:text-[#C8143C] cursor-pointer" onClick={() => onTab("assistant")}>AI Assistant</a>
          <a className="text-sm text-[#6B7280] block mb-1.5 hover:text-[#C8143C] cursor-pointer" onClick={() => onTab("donors")}>Smart Matching</a>
          <a className="text-sm text-[#6B7280] block mb-1.5 hover:text-[#C8143C] cursor-pointer" onClick={() => onTab("scan")}>Doc Scanning</a>
        </div>
        <div className="min-w-[120px]">
          <h4 className="text-xs mb-2.5">For Organizers</h4>
          <a className="text-sm text-[#6B7280] block mb-1.5 hover:text-[#C8143C] cursor-pointer" onClick={() => onTab("camps")}>Blood Camps</a>
          <a className="text-sm text-[#6B7280] block mb-1.5 hover:text-[#C8143C] cursor-pointer" onClick={() => onTab("camps")}>Demand Forecast</a>
          <a className="text-sm text-[#6B7280] block mb-1.5 hover:text-[#C8143C] cursor-pointer" onClick={() => onTab("camps")}>Awareness Posts</a>
        </div>
        <div className="min-w-[120px]">
          <h4 className="text-xs mb-2.5">Emergency</h4>
          <p className="text-sm text-[#6B7280]">Central Blood Bank: 24×7</p>
          <p className="text-sm text-[#6B7280]">+91 33 2241 2345</p>
        </div>
      </footer>
    </>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white border border-[#E7E9EC] rounded-xl px-5 py-3.5 min-w-[110px]">
      <b className="text-xl block">{value}</b>
      <span className="text-xs text-[#6B7280] tracking-widest">{label}</span>
    </div>
  );
}

function FeatureCard({ icon, title, desc, accent }: { icon: string; title: string; desc: string; accent?: boolean }) {
  return (
    <div className="bg-white border border-[#E7E9EC] rounded-2xl p-5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg mb-3.5 ${accent ? "bg-[#E4F6EC] text-[#1E8E5A]" : "bg-[#FCE9EE] text-[#C8143C]"}`}>
        {icon}
      </div>
      <h3 className="text-base font-semibold mb-1">{title}</h3>
      <p className="text-xs text-[#6B7280] leading-relaxed">{desc}</p>
    </div>
  );
}

function Step({ num, title, desc }: { num: number; title: string; desc: string }) {
  return (
    <div className="flex gap-3.5 mb-5">
      <div className="w-6.5 h-6.5 rounded-full bg-[#C8143C] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{num}</div>
      <div>
        <h3 className="text-sm font-semibold mb-0.5">{title}</h3>
        <p className="text-xs text-[#6B7280] leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
