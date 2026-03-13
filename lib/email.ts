import sgMail from "@sendgrid/mail";

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || "thulasivasanth01@gmail.com";

// Debug: Log environment variable status
console.log("[Debug] SENDGRID_API_KEY present:", !!SENDGRID_API_KEY);
console.log(
  "[Debug] SENDGRID_API_KEY value:",
  SENDGRID_API_KEY ? SENDGRID_API_KEY.substring(0, 10) + "..." : "NOT SET",
);
console.log("[Debug] FROM_EMAIL:", FROM_EMAIL);

// Initialize SendGrid
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
  console.log("[Email] SendGrid configured successfully");
} else {
  console.log(
    "[Email] ⚠️ SendGrid API key not found - emails will NOT be sent!",
  );
}

/**
 * Send an invitation email to a new team member
 */
export async function sendInvitationEmail({
  email,
  inviterName,
  workspaceName,
  role,
}: {
  email: string;
  inviterName: string;
  workspaceName: string;
  role: string;
}): Promise<{ success: boolean; error?: string }> {
  console.log("[Email] === Sending Invitation Email ===");
  console.log("[Email] To:", email);
  console.log("[Email] From:", FROM_EMAIL);
  console.log(
    "[Email] Subject:",
    `You've been invited to join ${workspaceName} on Planify`,
  );

  if (!SENDGRID_API_KEY) {
    console.log("[Email] ❌ SendGrid not configured, skipping email");
    return { success: false, error: "SendGrid not configured" };
  }

  const msg = {
    to: email,
    from: FROM_EMAIL,
    subject: `You've been invited to join ${workspaceName} on Planify`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">You're Invited! 🎉</h1>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="margin-top: 0;">Hi there,</p>
            
            <p><strong>${inviterName}</strong> has invited you to join <strong>${workspaceName}</strong> on Planify as a <strong>${role}</strong>.</p>
            
            <p>Planify helps teams organize tasks, track projects, and collaborate effectively.</p>
            
            <div style="margin: 30px 0; text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/sign-up" style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                Join the Team
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">
              If you don't have a Planify account, you'll need to sign up first.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
            
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              This invitation was sent by ${inviterName} from ${workspaceName}. If you weren't expecting this invitation, you can safely ignore this email.
            </p>
          </div>
        </body>
      </html>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log("[Email] Invitation sent successfully to:", email);
    return { success: true };
  } catch (error: unknown) {
    console.error("[Email] Failed to send invitation:", error);
    const err = error as {
      response?: { body?: { errors?: Array<{ message: string }> } };
    };
    const errorMessage =
      err.response?.body?.errors?.[0]?.message || "Failed to send email";
    return { success: false, error: errorMessage };
  }
}

/**
 * Send a reminder email for a pending invitation
 */
export async function sendReminderEmail({
  email,
  inviterName,
  workspaceName,
}: {
  email: string;
  inviterName: string;
  workspaceName: string;
}): Promise<{ success: boolean; error?: string }> {
  console.log("[Email] === Sending Reminder Email ===");
  console.log("[Email] To:", email);
  console.log("[Email] From:", FROM_EMAIL);
  console.log(
    "[Email] Subject:",
    `Reminder: You're invited to join ${workspaceName} on Planify`,
  );

  if (!SENDGRID_API_KEY) {
    console.log("[Email] ❌ SendGrid not configured, skipping reminder");
    return { success: false, error: "SendGrid not configured" };
  }

  const msg = {
    to: email,
    from: FROM_EMAIL,
    subject: `Reminder: You're invited to join ${workspaceName} on Planify`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Don't miss out! 📨</h1>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="margin-top: 0;">Hi there,</p>
            
            <p>This is a friendly reminder that <strong>${inviterName}</strong> from <strong>${workspaceName}</strong> has invited you to join their team on Planify.</p>
            
            <div style="margin: 30px 0; text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/sign-up" style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                Join the Team
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">
              If you already have a Planify account, you can sign in to accept the invitation.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
            
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              This reminder was sent by ${inviterName} from ${workspaceName}.
            </p>
          </div>
        </body>
      </html>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log("[Email] Reminder sent successfully to:", email);
    return { success: true };
  } catch (error: unknown) {
    console.error("[Email] Failed to send reminder:", error);
    const err = error as {
      response?: { body?: { errors?: Array<{ message: string }> } };
    };
    const errorMessage =
      err.response?.body?.errors?.[0]?.message || "Failed to send email";
    return { success: false, error: errorMessage };
  }
}
