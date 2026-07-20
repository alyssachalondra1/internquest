import { NextResponse } from "next/server"
import { friendlyAiError, generateWithRetry, LITE_MODEL, PRIMARY_MODEL } from "@/lib/ai"

export const runtime = "nodejs"

function stripFences(s: string) {
  return s.replace(/```json/gi, "").replace(/```/g, "").trim()
}

// Shared description of every field we want back from the model.
const SHAPE = `{
  "company_name": string,
  "role": string,
  "location": string,
  "work_type": "on-site" | "remote" | "hybrid" | "",
  "is_paid": boolean,
  "open_date": string,       // registration OPEN date, ISO YYYY-MM-DD or ""
  "deadline": string,        // registration CLOSE / application deadline, ISO YYYY-MM-DD or ""
  "deadline_type": "date" | "urgent" | "until_filled" | "asap",
  "timing_note": string,     // short free text when timing is vague, e.g. "around late June"; else ""
  "start_date": string,      // internship start date, ISO YYYY-MM-DD or ""
  "duration_months": number, // 0 if unknown
  "notes": string,           // requirements / required documents summary, in English
  "source_url": string       // the application/registration link if any is visible; "" if none
}`

const RULES = `Rules:
- Use "" or 0 when a field is missing. Do not invent data.
- If a registration PERIOD is shown (for example "12 to 30 July" or "open until 30 July"), set open_date to the start of the period and deadline to the end of the period, and set deadline_type to "date".
- deadline_type: use "date" when a specific closing date is given. Use "urgent" when it says urgent / immediately / segera / dibutuhkan cepat. Use "until_filled" when it says open until filled / rolling / sampai posisi terisi. Use "asap" when it says as soon as possible / secepatnya with no specific date.
- When deadline_type is not "date", set deadline to "". If the source hints at a rough time (e.g. "around June", "sekitar Juli"), put that short phrase in timing_note; otherwise leave timing_note as "".
- If the source contains a link to apply or register (a full URL, bit.ly, tinyurl, s.id, Google Form, or an "apply here / register at" link), put it EXACTLY as written into source_url.
- Write notes in English. Do not use the em dash character. Do not use the fire emoji.`

const SINGLE_PROMPT = `You are an assistant that extracts internship details from a job poster image, a web page, or a pasted job description.
Return ONLY valid JSON (no prose) with this exact shape:
${SHAPE}
${RULES}`

const SEPARATE_PROMPT = `You are an assistant that extracts internship details from SEVERAL job poster images. Each image is a SEPARATE, UNRELATED internship posting.
Return ONLY valid JSON: an ARRAY where each element corresponds to one poster image, IN THE SAME ORDER as the images. Do not merge posters. Each element must have this exact shape:
${SHAPE}
${RULES}`

// Best-effort raw text from a URL. Login-gated sites such as LinkedIn and Instagram often block this.
async function fetchUrlText(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    })
    const html = await res.text()
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&[a-z]+;/gi, " ")
      .replace(/\s+/g, " ")
      .trim()
    return text.slice(0, 8000)
  } catch {
    return ""
  }
}

async function imagePart(url: string) {
  const img = await fetch(url)
  const buf = Buffer.from(await img.arrayBuffer())
  const mimeType = img.headers.get("content-type") || "image/png"
  return { inlineData: { data: buf.toString("base64"), mimeType } }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { poster_url, poster_urls, multi_mode, text, source_url } = body as {
      poster_url?: string
      poster_urls?: string[]
      multi_mode?: "merge" | "separate"
      text?: string
      source_url?: string
    }

    // Normalise the poster inputs into a single list.
    const urls: string[] = Array.isArray(poster_urls) && poster_urls.length
      ? poster_urls.filter(Boolean)
      : poster_url
      ? [poster_url]
      : []
    const separate = multi_mode === "separate" && urls.length > 1

    const parts: any[] = [{ text: separate ? SEPARATE_PROMPT : SINGLE_PROMPT }]

    let fetched = ""
    if (source_url) {
      fetched = await fetchUrlText(source_url)
      parts.push({ text: "SOURCE URL: " + source_url })
      if (fetched) parts.push({ text: "PAGE CONTENT FROM THAT URL:\n" + fetched })
    }
    if (text) parts.push({ text: "JOB TEXT:\n" + text })

    // Attach every poster image. Sending them in one call keeps us within the
    // free Gemini request quota (one call for merge, one call for separate).
    for (let i = 0; i < urls.length; i++) {
      if (separate) parts.push({ text: "POSTER #" + (i + 1) + ":" })
      parts.push(await imagePart(urls[i]))
    }
    if (urls.length) {
      if (separate) {
        parts.push({
          text:
            "There are " + urls.length +
            " separate posters above. Return a JSON array with exactly " + urls.length +
            " objects, one per poster, in the same order. Do not merge them.",
        })
      } else if (urls.length > 1) {
        parts.push({
          text:
            "The " + urls.length +
            " images above are different screenshots of the SAME internship. Combine all of the information into ONE object.",
        })
      } else {
        parts.push({ text: "Extract the details from the poster image above, including any application link visible on it." })
      }
    }

    const raw = stripFences(
      await generateWithRetry(parts, {
        models: [LITE_MODEL, PRIMARY_MODEL],
        generationConfig: { responseMimeType: "application/json" },
      }),
    )
    const parsed = JSON.parse(raw)

    if (separate) {
      const arr: any[] = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.items)
        ? parsed.items
        : Array.isArray(parsed?.list)
        ? parsed.list
        : [parsed]
      return NextResponse.json({ ok: true, list: arr })
    }

    if (source_url && !parsed.source_url) parsed.source_url = source_url

    const isInstagram = !!source_url && /instagram\.com/i.test(source_url)
    const isLinkedin = !!source_url && /linkedin\.com/i.test(source_url)
    const blocked = (isInstagram || isLinkedin) && !fetched && !parsed.company_name
    let warning: string | undefined
    if (isInstagram && blocked) {
      warning =
        "Instagram does not allow automatic reading of posts. For the best result, upload a screenshot of the poster image from the post so AI can read it directly."
    } else if (isLinkedin && blocked) {
      warning =
        "LinkedIn limits automatic access, so some fields may be empty. Fill them in manually, or copy and paste the job text using the Paste JD option."
    }

    return NextResponse.json({ ok: true, data: parsed, warning })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: friendlyAiError(err) }, { status: 500 })
  }
}
