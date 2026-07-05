import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const BLOOD_GROUPS = ["All", "O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"] as const;

export default function Donors() {
  const [bloodGroup, setBloodGroup] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [registerOpen, setRegisterOpen] = useState(false);

  const { data: donors, isLoading } = trpc.donors.list.useQuery({ bloodGroup, search });
  const { data: count } = trpc.donors.count.useQuery();
  const createMutation = trpc.donors.create.useMutation({
    onSuccess: () => {
      setRegisterOpen(false);
      toast.success("Thanks for registering! You now appear in the donor directory.");
    },
    onError: () => toast.error("Failed to register. Please try again."),
  });

  const handleRegister = (data: { name: string; bloodGroup: string; area: string; phone: string; isFirstTime: number }) => {
    createMutation.mutate({
      name: data.name,
      bloodGroup: data.bloodGroup as "O-" | "O+" | "A-" | "A+" | "B-" | "B+" | "AB-" | "AB+",
      area: data.area,
      phone: data.phone,
      isFirstTime: data.isFirstTime,
    });
  };

  return (
    <div className="px-4 md:px-10 py-14">
      <p className="text-[#C8143C] font-bold text-xs tracking-[0.08em] uppercase mb-2">Donor Directory</p>
      <div className="flex flex-wrap gap-3 justify-between items-center mb-5">
        <h2 className="text-3xl font-extrabold">Verified donors</h2>
        <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full bg-[#C8143C] hover:bg-[#9E0F30] text-white font-semibold">+ Register as donor</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Register as Blood Donor</DialogTitle></DialogHeader>
            <RegisterForm onSubmit={handleRegister} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center justify-between mb-5">
        <div className="flex flex-wrap gap-2">
          {BLOOD_GROUPS.map(bg => (
            <button
              key={bg}
              className={`border rounded-full px-4 py-2 text-xs font-semibold transition-colors ${bloodGroup === bg ? "bg-[#C8143C] text-white border-[#C8143C]" : "border-[#E7E9EC] bg-white hover:border-[#C8143C] hover:text-[#C8143C]"}`}
              onClick={() => setBloodGroup(bg)}
            >
              {bg}
            </button>
          ))}
        </div>
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search name or area"
          className="min-w-[220px] border-[#E7E9EC] rounded-lg px-3.5 py-2 text-sm"
        />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white border border-[#E7E9EC] rounded-2xl p-4 animate-pulse flex gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-200 rounded w-3/4" />
                <div className="h-2 bg-gray-200 rounded w-full" />
                <div className="h-2 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {donors?.map(d => (
            <div key={d.id} className="bg-white border border-[#E7E9EC] rounded-2xl p-4 flex gap-3 items-start">
              <div className="w-10 h-10 rounded-full bg-[#C8143C] text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                {d.bloodGroup}
              </div>
              <div className="flex-1 min-w-0">
                <b className="text-sm">{d.name}</b>
                <span className="text-xs text-[#6B7280] block mt-0.5 mb-2">{d.area}</span>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  <span className="inline-block text-[11px] px-2 py-0.5 rounded-full bg-[#E4F6EC] text-[#1E8E5A] font-semibold">Available</span>
                  {d.isFirstTime ? (
                    <span className="inline-block text-[11px] px-2 py-0.5 rounded-full bg-[#FEF3E4] text-[#B5750A] font-semibold">First-time</span>
                  ) : d.lastDonationDate ? (
                    <span className="inline-block text-[11px] px-2 py-0.5 rounded-full bg-[#F1F1F1] text-[#555]">Last: {d.lastDonationDate}</span>
                  ) : null}
                </div>
                <div className="text-xs text-[#C8143C] font-semibold">📞 {d.phone}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RegisterForm({ onSubmit }: { onSubmit: (data: { name: string; bloodGroup: "O-" | "O+" | "A-" | "A+" | "B-" | "B+" | "AB-" | "AB+"; area: string; phone: string; isFirstTime: number }) => void }) {
  const [form, setForm] = useState({ name: "", bloodGroup: "B+" as const, area: "Kolkata", phone: "+91", isFirstTime: 1 });

  return (
    <div className="space-y-4">
      <div>
        <Label>Your name</Label>
        <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1" />
      </div>
      <div>
        <Label>Blood group</Label>
        <Select value={form.bloodGroup} onValueChange={v => setForm({ ...form, bloodGroup: v as typeof form.bloodGroup })}>
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"].map(bg => (
              <SelectItem key={bg} value={bg}>{bg}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Area / locality</Label>
        <Input value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} className="mt-1" />
      </div>
      <div>
        <Label>Phone number</Label>
        <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="mt-1" />
      </div>
      <DialogFooter>
        <Button className="bg-[#C8143C] hover:bg-[#9E0F30] text-white w-full" onClick={() => onSubmit(form)}>
          Register
        </Button>
      </DialogFooter>
    </div>
  );
}
