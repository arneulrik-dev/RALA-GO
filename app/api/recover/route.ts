// RALA GO recovery endpoint
// Environment refresh 2
import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!;
const RESEND_API_KEY = process.env.RESEND_API_KEY!;

export async function POST(req: Request) {
  const generic = () => NextResponse.json({ ok: true });
  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string" || !email.includes("@")) return generic();
    if (!SUPABASE_URL || !SUPABASE_SECRET_KEY || !RESEND_API_KEY) {
      console.error("Recovery server configuration is incomplete");
      return NextResponse.json({ error: "E-posttjenesten er ikke ferdig konfigurert." }, { status: 500 });
    }

    // Resolve the external recovery address to the RALA GO profile/Auth account.
    const lookup = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=id,notification_email&notification_email=ilike.${encodeURIComponent(email.trim())}&limit=1`, {
      headers: { apikey: SUPABASE_SECRET_KEY, Authorization: `Bearer ${SUPABASE_SECRET_KEY}` },
    });
    if (!lookup.ok) { console.error("Recovery profile lookup failed", lookup.status); return generic(); }
    const profiles = await lookup.json();
    const profile = profiles?.[0];
    if (!profile?.id) return generic();

    const authUser = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${profile.id}`, {
      headers: { apikey: SUPABASE_SECRET_KEY, Authorization: `Bearer ${SUPABASE_SECRET_KEY}` },
    });
    if (!authUser.ok) { console.error("Recovery auth lookup failed", authUser.status); return generic(); }
    const authData = await authUser.json();
    const authEmail = authData?.email;
    if (!authEmail) return generic();

    const generate = await fetch(`${SUPABASE_URL}/auth/v1/admin/generate_link`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_SECRET_KEY,
        Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
      },
      body: JSON.stringify({ type: "recovery", email: authEmail }),
    });
    if (!generate.ok) {
      console.error("Recovery link generation failed", generate.status);
      return generic();
    }
    const data = await generate.json();
    const actionLink = data.action_link || data.properties?.action_link;
    if (!actionLink) return generic();

    const redirectTo = "https://rala-go.vercel.app";
    const recoveryUrl = new URL(actionLink);
    recoveryUrl.searchParams.set("redirect_to", redirectTo);

    const sent = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "RALA GO <onboarding@resend.dev>",
        to: [email],
        subject: "RALA GO – velg nytt passord",
        text: `Du har bedt om å endre passordet til RALA GO.\n\nÅpne denne sikre lenken:\n${recoveryUrl.toString()}\n\nHvis du ikke ba om dette, kan du ignorere e-posten.`,
      }),
    });
    if (!sent.ok) {
      console.error("Resend recovery email failed", sent.status, await sent.text());
      return NextResponse.json({ error: "Kunne ikke sende e-posten akkurat nå." }, { status: 502 });
    }
    return generic();
  } catch (error) {
    console.error("Recovery request failed", error);
    return NextResponse.json({ error: "Kunne ikke sende e-posten akkurat nå." }, { status: 500 });
  }
}
