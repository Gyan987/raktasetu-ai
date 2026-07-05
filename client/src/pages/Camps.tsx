import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function Camps() {
  const { data: camps, isLoading: campsLoading } = trpc.bloodCamps.list.useQuery();
  const { data: donors } = trpc.donors.list.useQuery({});
  const [campOpen, setCampOpen] = useState(false);
  const [isForecasting, setIsForecasting] = useState(false);

  const createMutation = trpc.bloodCamps.create.useMutation({
    onSuccess: () => {
      setCampOpen(false);
      toast.success("Camp organized successfully!");
    },
    onError: () => toast.error("Failed to create camp."),
  });

  const forecastMutation = trpc.ai.forecast.useMutation();
  const [demandData, setDemandData] = useState([
    { bg: "O+", val: 58 }, { bg: "A+", val: 44 }, { bg: "B+", val: 50 }, { bg: "AB+", val: 20 },
    { bg: "O-", val: 16 }, { bg: "A-", val: 14 }, { bg: "B-", val: 12 }, { bg: "AB-", val: 8 },
  ]);

  const handlePredict = async () => {
    setIsForecasting(true);
    const donorCounts: Record<string, number> = {};
    donors?.forEach(d => { donorCounts[d.bloodGroup] = (donorCounts[d.bloodGroup] || 0) + 1; });
    try {
      const res = await forecastMutation.mutateAsync({ donorCounts });
      let parsed;
      try { parsed = JSON.parse(res.content as string); } catch { /* fallback */ }
      if (parsed?.forecast) {
        setDemandData(parsed.forecast);
        toast.success("AI forecast updated!");
      }
    } catch {
      toast.error("Forecast failed. Using fallback estimate.");
    }
    setIsForecasting(false);
  };

  const handleRegisterCamp = (data: { name: string; organizer: string; location: string; date: string; capacity: number }) => {
    createMutation.mutate({ name: data.name, organizer: data.organizer, location: data.location, date: data.date, capacity: data.capacity });
  };

  const maxVal = Math.max(...demandData.map(d => d.val), 1);

  return (
    <div className="px-4 md:px-10 py-14">
      <p className="text-[#C8143C] font-bold text-xs tracking-[0.08em] uppercase mb-2">Camp Organizer</p>
      <div className="flex flex-wrap gap-3 justify-between items-center mb-5">
        <h2 className="text-3xl font-extrabold">Blood camps in Kolkata</h2>
        <Dialog open={campOpen} onOpenChange={setCampOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full bg-[#C8143C] hover:bg-[#9E0F30] text-white font-semibold">+ Organize Camp</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Organize a Blood Camp</DialogTitle></DialogHeader>
            <CampForm onSubmit={handleRegisterCamp} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Camps List */}
        <div className="flex-1 min-w-[300px] flex flex-col gap-3.5">
          {campsLoading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="bg-white border border-[#E7E9EC] rounded-2xl p-5 animate-pulse flex justify-between">
                <div className="space-y-2"><div className="h-4 bg-gray-200 rounded w-32" /><div className="h-3 bg-gray-200 rounded w-24" /></div>
                <div className="h-8 w-16 bg-gray-200 rounded" />
              </div>
            ))
          ) : camps?.map(c => (
            <div key={c.id} className="bg-white border border-[#E7E9EC] rounded-2xl p-5 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-semibold">{c.name}</h3>
                <div className="text-xs text-[#6B7280] mt-0.5 mb-1">{c.organizer}</div>
                <div className="text-xs text-[#6B7280]">📍 {c.location} · 📅 {c.date}</div>
              </div>
              <div className="text-right">
                <b className="text-[#1E8E5A] text-lg">{c.registeredCount}/{c.capacity}</b>
                <span className="block text-[10px] text-[#6B7280]">registered</span>
              </div>
            </div>
          ))}
        </div>

        {/* Demand Forecast */}
        <div className="min-w-[260px] bg-white border border-[#E7E9EC] rounded-2xl p-5 self-start">
          <h4 className="text-[11px] text-[#C8143C] tracking-[0.05em] uppercase mb-1">Predicted Demand</h4>
          <h3 className="text-sm font-semibold mb-4">Kolkata — next 30 days</h3>
          <div className="flex items-end gap-2 h-[140px]">
            {demandData.map(d => (
              <div key={d.bg} className="flex-1 flex flex-col items-center gap-1.5">
                <div
                  className="w-full bg-[#C8143C] rounded-t transition-all duration-500"
                  style={{ height: `${Math.max(6, Math.round((d.val / maxVal) * 120))}px` }}
                />
                <span className="text-[10px] text-[#6B7280]">{d.bg}</span>
              </div>
            ))}
          </div>
          <Button
            variant="outline"
            className="w-full mt-4 border-[#E7E9EC] hover:border-[#C8143C] hover:text-[#C8143C] text-xs"
            onClick={handlePredict}
            disabled={isForecasting}
          >
            {isForecasting ? "Forecasting…" : "✳ Refresh forecast with AI"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function CampForm({ onSubmit }: { onSubmit: (data: { name: string; organizer: string; location: string; date: string; capacity: number }) => void }) {
  const [form, setForm] = useState({ name: "", organizer: "", location: "Kolkata", date: "2026-03-01", capacity: 100 });
  return (
    <div className="space-y-4">
      <div><Label>Camp name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1" /></div>
      <div><Label>Organizer</Label><Input value={form.organizer} onChange={e => setForm({ ...form, organizer: e.target.value })} className="mt-1" /></div>
      <div><Label>Location</Label><Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="mt-1" /></div>
      <div><Label>Date (YYYY-MM-DD)</Label><Input value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="mt-1" /></div>
      <div><Label>Capacity</Label><Input type="number" value={form.capacity} onChange={e => setForm({ ...form, capacity: Number(e.target.value) })} className="mt-1" /></div>
      <DialogFooter>
        <Button className="bg-[#C8143C] hover:bg-[#9E0F30] text-white w-full" onClick={() => onSubmit(form)}>
          Create Camp
        </Button>
      </DialogFooter>
    </div>
  );
}
