import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";
import {
  listDonors, createDonor, getCompatibleDonors, getDonorCount, seedDonors,
  listBloodBanks, getBloodBankCount, seedBloodBanks,
  listBloodCamps, createBloodCamp, seedBloodCamps,
} from "./db";

/* ========== Seeding helper ========== */
let _seeded = false;
async function ensureSeeded() {
  if (_seeded) return;
  _seeded = true; // mark immediately to prevent races
  await seedDonors();
  await seedBloodBanks();
  await seedBloodCamps();
}

/* ========== AI CONFIG ========== */
const GEMINI_MODEL = "gemini-3.1-pro-preview";

/* ========== DONORS ROUTER ========== */
const donorsRouter = router({
  list: publicProcedure
    .input(z.object({ bloodGroup: z.string().optional(), search: z.string().optional() }))
    .query(async ({ input }) => {
      await ensureSeeded();
      return await listDonors(input.bloodGroup, input.search);
    }),

  create: publicProcedure
    .input(z.object({
      name: z.string().min(1),
      bloodGroup: z.enum(["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"]),
      area: z.string().min(1),
      phone: z.string().min(1),
      lastDonationDate: z.string().nullable().optional(),
      isFirstTime: z.number().default(1),
      userId: z.number().nullable().optional(),
    }))
    .mutation(async ({ input }) => {
      await ensureSeeded();
      return await createDonor(input);
    }),

  match: publicProcedure
    .input(z.object({
      bloodGroup: z.string(),
      location: z.string().optional(),
    }))
    .query(async ({ input }) => {
      await ensureSeeded();
      return await getCompatibleDonors(input.bloodGroup, input.location);
    }),

  count: publicProcedure.query(async () => {
    await ensureSeeded();
    return await getDonorCount();
  }),
});

/* ========== BLOOD BANKS ROUTER ========== */
const bloodBanksRouter = router({
  list: publicProcedure.query(async () => {
    await ensureSeeded();
    return await listBloodBanks();
  }),

  count: publicProcedure.query(async () => {
    await ensureSeeded();
    return await getBloodBankCount();
  }),
});

/* ========== BLOOD CAMPS ROUTER ========== */
const bloodCampsRouter = router({
  list: publicProcedure.query(async () => {
    await ensureSeeded();
    return await listBloodCamps();
  }),

  create: publicProcedure
    .input(z.object({
      name: z.string().min(1),
      organizer: z.string().min(1),
      location: z.string().min(1),
      date: z.string().min(1),
      registeredCount: z.number().default(0),
      capacity: z.number().default(100),
      userId: z.number().nullable().optional(),
    }))
    .mutation(async ({ input }) => {
      await ensureSeeded();
      return await createBloodCamp(input);
    }),

  stats: publicProcedure.query(async () => {
    await ensureSeeded();
    const camps = await listBloodCamps();
    const total = camps.length;
    const totalRegistered = camps.reduce((sum, c) => sum + (c.registeredCount ?? 0), 0);
    const totalCapacity = camps.reduce((sum, c) => sum + (c.capacity ?? 100), 0);
    return { total, totalRegistered, totalCapacity };
  }),
});

/* ========== AI ASSISTANT ROUTER ========== */
const aiRouter = router({
  chat: publicProcedure
    .input(z.object({
      message: z.string(),
      language: z.enum(["English", "Hindi", "Bengali"]).default("English"),
    }))
    .mutation(async ({ input }) => {
      const systemPrompt = `You are RaktaSetu AI, a multilingual (Hindi, Bengali, English, and mixed "Hinglish/Benglish") blood-emergency assistant for Kolkata, India.
Reply in the SAME language/script mix the user used, in a warm, calm, urgent-but-reassuring tone, in 2-4 sentences max.
You must ALSO return structured extraction so the app can do real donor matching. Respond ONLY with valid JSON in this exact shape:
{
  "reply": "natural language reply to show the user",
  "intent": "blood_request" | "find_bloodbank" | "eligibility_question" | "general",
  "blood_group": "A+"|"A-"|"B+"|"B-"|"AB+"|"AB-"|"O+"|"O-"|null,
  "location": "area name or null",
  "urgency": "high"|"medium"|"low"|null
}
Do not invent donor names or phone numbers yourself; the app will attach real matches separately.`;

      try {
        const response = await invokeLLM({
          model: GEMINI_MODEL,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: input.message },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "chat_response",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  reply: { type: "string" },
                  intent: { type: "string", enum: ["blood_request", "find_bloodbank", "eligibility_question", "general"] },
                  blood_group: { type: ["string", "null"], enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", null] },
                  location: { type: ["string", "null"] },
                  urgency: { type: ["string", "null"], enum: ["high", "medium", "low", null] },
                },
                required: ["reply", "intent"],
                additionalProperties: false,
              },
            },
          },
        });

        // Safely extract content from the LLM response
        const firstChoice = response.choices?.[0];
        if (!firstChoice || !firstChoice.message) {
          console.error("[AI Chat] Invalid response structure:", JSON.stringify(response).substring(0, 500));
          return { success: false, content: "Sorry, I'm having trouble right now. Please try again or call the blood bank directly." };
        }
        const content = firstChoice.message.content || "{}";
        return { success: true, content };
      } catch (err) {
        console.error("[AI Chat] Error:", err);
        return { success: false, content: "Sorry, I'm having trouble right now. Please try again or call the blood bank directly." };
      }
    }),

  forecast: publicProcedure
    .input(z.object({
      donorCounts: z.record(z.string(), z.number()),
    }))
    .mutation(async ({ input }) => {
      const systemPrompt = `You forecast 30-day blood-type demand for a Kolkata blood-donation platform, purely as an illustrative planning estimate (not medical/clinical data).
Given current donor pool counts, return ONLY JSON: {"forecast":[{"bg":"O+","val": number 0-100}, ... all 8 groups O+,A+,B+,AB+,O-,A-,B-,AB-], "note": "one short sentence"}.
Higher demand typically correlates with common groups (O+, B+, A+) and lower donor availability for that group increases urgency score.`;

      try {
        const response = await invokeLLM({
          model: GEMINI_MODEL,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: JSON.stringify(input.donorCounts) },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "forecast",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  forecast: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        bg: { type: "string", enum: ["O+", "A+", "B+", "AB+", "O-", "A-", "B-", "AB-"] },
                        val: { type: "integer" },
                      },
                      required: ["bg", "val"],
                      additionalProperties: false,
                    },
                  },
                  note: { type: "string" },
                },
                required: ["forecast", "note"],
                additionalProperties: false,
              },
            },
          },
        });

        const firstChoice = response.choices?.[0];
        if (!firstChoice || !firstChoice.message) {
          console.error("[AI Forecast] Invalid response structure");
          return { success: false, content: '{"forecast":[{"bg":"O+","val":58},{"bg":"A+","val":44},{"bg":"B+","val":50},{"bg":"AB+","val":20},{"bg":"O-","val":16},{"bg":"A-","val":14},{"bg":"B-","val":12},{"bg":"AB-","val":8}], "note": "Fallback estimate"}' };
        }
        const content = firstChoice.message.content || "{}";
        return { success: true, content };
      } catch (err) {
        console.error("[AI Forecast] Error:", err);
        return { success: false, content: '{"forecast":[{"bg":"O+","val":58},{"bg":"A+","val":44},{"bg":"B+","val":50},{"bg":"AB+","val":20},{"bg":"O-","val":16},{"bg":"A-","val":14},{"bg":"B-","val":12},{"bg":"AB-","val":8}], "note": "Fallback estimate"}' };
      }
    }),

  extractDocument: publicProcedure
    .input(z.object({
      imageBase64: z.string(),
      mimeType: z.string(),
    }))
    .mutation(async ({ input }) => {
      const systemPrompt = `You are a medical document vision extractor for a blood-donation emergency platform.
Read the uploaded image (a prescription, blood requirement slip, or hospital note) and extract fields.
Respond ONLY with valid JSON in this exact shape, using null for anything not visible/legible:
{"blood_group": "A+"|"A-"|"B+"|"B-"|"AB+"|"AB-"|"O+"|"O-"|null, "units_required": number|null, "hospital": string|null, "urgency": "high"|"medium"|"low"|null, "patient_name": string|null, "notes": "short summary of anything else relevant"}
If the image is not a medical document, set all fields to null and explain briefly in "notes".`;

      try {
        const dataUrl = `data:${input.mimeType};base64,${input.imageBase64}`;
        const response = await invokeLLM({
          model: GEMINI_MODEL,
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: [
                { type: "image_url", image_url: { url: dataUrl } },
                { type: "text", text: "Extract the blood requirement details from this document." },
              ],
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "document_extraction",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  blood_group: { type: ["string", "null"], enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", null] },
                  units_required: { type: ["number", "null"] },
                  hospital: { type: ["string", "null"] },
                  urgency: { type: ["string", "null"], enum: ["high", "medium", "low", null] },
                  patient_name: { type: ["string", "null"] },
                  notes: { type: "string" },
                },
                required: ["blood_group", "units_required", "hospital", "urgency", "patient_name", "notes"],
                additionalProperties: false,
              },
            },
          },
        });

        const content = response.choices[0].message.content || "{}";
        return { success: true, content };
      } catch (err) {
        console.error("[AI Vision] Error:", err);
        return {
          success: false,
          content: '{"blood_group":null,"units_required":null,"hospital":null,"urgency":null,"patient_name":null,"notes":"Error processing the document. Please try again."}',
        };
      }
    }),
});

/* ========== STATS ROUTER ========== */
const statsRouter = router({
  get: publicProcedure.query(async () => {
    await ensureSeeded();
    const donorCount = await getDonorCount();
    const bankCount = await getBloodBankCount();
    return { donorCount, bankCount, openSOS: 3 };
  }),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  donors: donorsRouter,
  bloodBanks: bloodBanksRouter,
  bloodCamps: bloodCampsRouter,
  ai: aiRouter,
  stats: statsRouter,
});

export type AppRouter = typeof appRouter;
