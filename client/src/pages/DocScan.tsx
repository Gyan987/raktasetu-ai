import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type ExtractedData = {
  blood_group: string | null;
  units_required: number | null;
  hospital: string | null;
  urgency: string | null;
  patient_name: string | null;
  notes: string;
} | null;

export default function DocScan() {
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState("image/jpeg");
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState<ExtractedData>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  const extractMutation = trpc.ai.extractDocument.useMutation();

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMimeType(file.type);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      setImageBase64(base64);
      setResult(null);
    };
    reader.readAsDataURL(file);
  };

  const handleExtract = async () => {
    if (!imageBase64) return;
    setIsExtracting(true);
    setResult(null);
    try {
      const res = await extractMutation.mutateAsync({ imageBase64, mimeType });
      let parsed: ExtractedData = null;
      try {
        parsed = JSON.parse(res.content as string);
      } catch {
        toast.error("Couldn't parse AI response. Please try again.");
        return;
      }
      setResult(parsed);
    } catch {
      toast.error("Error reaching AI vision service. Please try again.");
    }
    setIsExtracting(false);
  };

  return (
    <div className="px-4 md:px-10 py-14">
      <p className="text-[#C8143C] font-bold text-xs tracking-[0.08em] uppercase mb-2">AI Vision</p>
      <h2 className="text-3xl font-extrabold mb-2">⛶ Scan medical document</h2>
      <p className="text-[#6B7280] max-w-[560px] mb-8 leading-relaxed">
        Upload a prescription or blood requirement slip. AI extracts blood group, units, hospital & urgency.
      </p>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Upload Area */}
        <div className="flex-1 min-w-[300px]">
          <label className="block border-2 border-dashed border-[#E7E9EC] rounded-2xl p-10 text-center bg-[#EAF6F0] cursor-pointer hover:border-[#C8143C] transition-colors">
            <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
            {imageBase64 ? (
              <div>
                <img src={`data:${mimeType};base64,${imageBase64}`} alt="Upload" className="max-w-full max-h-[220px] rounded-xl mx-auto mb-3.5" />
                <p className="text-sm text-[#6B7280]">{fileName}</p>
              </div>
            ) : (
              <div>
                <div className="text-[28px] mb-2">⬆</div>
                <p className="text-sm text-[#6B7280]">Click to upload (JPEG / PNG / WEBP)</p>
              </div>
            )}
          </label>
          <Button
            className="w-full mt-3.5 bg-[#C8143C] hover:bg-[#9E0F30] text-white font-semibold"
            onClick={handleExtract}
            disabled={!imageBase64 || isExtracting}
          >
            {isExtracting ? "Extracting…" : "✳ Extract with AI"}
          </Button>
        </div>

        {/* Results */}
        <div className="flex-1 min-w-[300px] bg-[#EAF6F0] rounded-2xl p-6">
          <h3 className="text-sm font-semibold mb-4">Extracted details</h3>
          {!result ? (
            <p className="text-sm text-[#6B7280]">Upload a document and click Extract.</p>
          ) : (
            <div>
              <FieldRow label="Blood Group" value={result.blood_group ?? "—"} />
              <FieldRow label="Units Required" value={result.units_required ?? "—"} />
              <FieldRow label="Hospital" value={result.hospital ?? "—"} />
              <FieldRow label="Urgency" value={result.urgency ?? "—"} />
              <FieldRow label="Patient Name" value={result.patient_name ?? "—"} />
              <p className="text-xs text-[#6B7280] mt-3">{result.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FieldRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between py-2.5 border-b border-[#DCF0E6] text-sm">
      <span>{label}</span>
      <b className="text-[#C8143C]">{value}</b>
    </div>
  );
}
