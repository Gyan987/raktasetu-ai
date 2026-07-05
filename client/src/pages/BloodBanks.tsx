import { trpc } from "@/lib/trpc";

export default function BloodBanks() {
  const { data: banks, isLoading } = trpc.bloodBanks.list.useQuery();

  return (
    <div className="px-4 md:px-10 py-14">
      <p className="text-[#C8143C] font-bold text-xs tracking-[0.08em] uppercase mb-2">Blood Banks</p>
      <h2 className="text-3xl font-extrabold mb-8">Kolkata blood banks — 24×7</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="bg-white border border-[#E7E9EC] rounded-2xl p-5 animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-full" />
              <div className="h-3 bg-gray-200 rounded w-2/3" />
            </div>
          ))
        ) : banks?.map(b => (
          <div key={b.id} className="bg-white border border-[#E7E9EC] rounded-2xl p-5">
            <h3 className="text-sm font-semibold mb-2.5">{b.name}</h3>
            <div className="text-xs text-[#6B7280] mb-1.5 flex items-center gap-1.5">📍 {b.area}</div>
            <div className="text-xs text-[#6B7280] mb-1.5 flex items-center gap-1.5">📞 {b.phone}</div>
            <div className="text-xs text-[#1E8E5A] font-semibold flex items-center gap-1.5">🕐 24×7</div>
          </div>
        ))}
      </div>
    </div>
  );
}
