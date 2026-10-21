import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SERVICE_ROLE_KEY") ?? "";
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const resendKey = Deno.env.get("RESEND_API_KEY") ?? "";
const from = Deno.env.get("REMINDER_FROM") ?? "StudyCircle <reminders@example.com>";
const client = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
  if (!serviceKey || request.headers.get("authorization") !== `Bearer ${serviceKey}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (!resendKey || !supabaseUrl) return new Response("Reminder service is not configured", { status: 500 });

  const { data: reminders, error } = await client.rpc("due_reminders");
  if (error) return new Response("Could not load reminders", { status: 500 });
  let sent = 0;
  for (const reminder of reminders ?? []) {
    const when = new Date(reminder.starts_at).toLocaleString("en", { dateStyle: "medium", timeStyle: "short" });
    const subject = reminder.kind === "quorum_warning" ? `Attendance check: ${reminder.title}` : `Reminder: ${reminder.title}`;
    const text = `Hi ${reminder.name},\n\n${reminder.title} for ${reminder.group_name} starts at ${when}.\nLocation: ${reminder.location}${reminder.video_url ? `\nJoin: ${reminder.video_url}` : ""}`;
    const html = `<p>Hi ${escapeHtml(reminder.name)},</p><p><strong>${escapeHtml(reminder.title)}</strong> for ${escapeHtml(reminder.group_name)} starts at ${escapeHtml(when)}.</p><p>Location: ${escapeHtml(reminder.location)}${reminder.video_url ? `<br><a href="${escapeHtml(reminder.video_url)}">Join the session</a>` : ""}</p>`;
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from, to: [reminder.email], subject, text, html }),
      });
      if (!response.ok) continue;
      const marked = await client.rpc("mark_reminder_sent", {
        session_id: reminder.session_id,
        user_id: reminder.user_id,
        kind: reminder.kind,
      });
      if (!marked.error) sent++;
    } catch {
      // A failed recipient must not stop other reminders in the batch.
    }
  }
  return Response.json({ sent, attempted: reminders?.length ?? 0 });
});
