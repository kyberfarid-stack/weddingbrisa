const fs = require("fs");
const path = require("path");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

let supabase = null;
if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
        const { createClient } = require("@supabase/supabase-js");
        supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
}

const LOCAL_DB_PATH = path.join(process.cwd(), "data", "guests.json");

function ensureLocalFile() {
        const dir = path.dirname(LOCAL_DB_PATH);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        if (!fs.existsSync(LOCAL_DB_PATH)) fs.writeFileSync(LOCAL_DB_PATH, "[]");
}

async function saveGuest({ eventSlug, name, templateId, photoDataUrl, voiceNoteDataUrl, message }) {
        const createdAt = new Date().toISOString();

  if (supabase) {
            const base64Data = photoDataUrl.split(",")[1];
            const buffer = Buffer.from(base64Data, "base64");
            const fileName = `${eventSlug}/${Date.now()}-${Math.random()
                                                                 .toString(36)
                                                                 .slice(2, 8)}.jpg`;

          const { error: uploadError } = await supabase.storage
              .from("photobooth")
              .upload(fileName, buffer, { contentType: "image/jpeg" });

          if (uploadError) throw uploadError;

          const { data: publicUrlData } = supabase.storage
              .from("photobooth")
              .getPublicUrl(fileName);

          let voiceUrl = null;
            if (voiceNoteDataUrl) {
                        const voiceBase64 = voiceNoteDataUrl.split(",")[1];
                        const voiceBuffer = Buffer.from(voiceBase64, "base64");
                        const voiceFileName = `${eventSlug}/voice/${Date.now()}-${Math.random()
                                                                                          .toString(36)
                                                                                          .slice(2, 8)}.webm`;

              const { error: voiceUploadError } = await supabase.storage
                          .from("photobooth")
                          .upload(voiceFileName, voiceBuffer, { contentType: "audio/webm" });

              if (!voiceUploadError) {
                            const { data: voicePublicUrlData } = supabase.storage
                              .from("photobooth")
                              .getPublicUrl(voiceFileName);
                            voiceUrl = voicePublicUrlData.publicUrl;
              }
            }

          const { error: insertError } = await supabase.from("guests").insert({
                      event_slug: eventSlug,
                      name,
                      template_id: templateId,
                      photo_url: publicUrlData.publicUrl,
                      voice_url: voiceUrl,
                      message: message || null,
                      created_at: createdAt,
          });

          if (insertError) throw insertError;

          return {
                      name,
                      templateId,
                      photoUrl: publicUrlData.publicUrl,
                      voiceUrl,
                      message: message || null,
                      createdAt,
          };
  }

  // Fallback lokal (dev/testing saja)
  ensureLocalFile();
        const all = JSON.parse(fs.readFileSync(LOCAL_DB_PATH, "utf-8"));
        const entry = {
                  eventSlug,
                  name,
                  templateId,
                  photoDataUrl,
                  voiceNoteDataUrl: voiceNoteDataUrl || null,
                  message: message || null,
                  createdAt,
        };
        all.push(entry);
        fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(all, null, 2));
        return entry;
}

async function listGuests(eventSlug) {
        if (supabase) {
                  const { data, error } = await supabase
                    .from("guests")
                    .select("*")
                    .eq("event_slug", eventSlug)
                    .order("created_at", { ascending: false });
                  if (error) throw error;
                  return data.map((d) => ({
                              name: d.name,
                              templateId: d.template_id,
                              photoUrl: d.photo_url,
                              voiceUrl: d.voice_url || null,
                              message: d.message || null,
                              createdAt: d.created_at,
                  }));
        }

  ensureLocalFile();
        const all = JSON.parse(fs.readFileSync(LOCAL_DB_PATH, "utf-8"));
        return all
          .filter((g) => g.eventSlug === eventSlug)
          .reverse()
          .map((g) => ({
                      name: g.name,
                      templateId: g.templateId,
                      photoUrl: g.photoDataUrl,
                      voiceUrl: g.voiceNoteDataUrl || null,
                      message: g.message || null,
                      createdAt: g.createdAt,
          }));
}

module.exports = { saveGuest, listGuests, usingSupabase: !!supabase };
