import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const logoImg = `<table cellpadding="0" cellspacing="0"><tr><td style="background:#ffffff;border-radius:10px;width:40px;height:40px;text-align:center;vertical-align:middle;font-family:Arial,sans-serif;font-size:20px;font-weight:900;color:#e85a4f;line-height:40px;">G</td></tr></table>`;

function emailLayout(content: string) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f0f0f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f0f5;">
  <tr>
    <td align="center" style="padding:40px 16px;">
      <table width="100%" style="max-width:460px;" cellpadding="0" cellspacing="0">

        <!-- Header colorido -->
        <tr>
          <td style="background:linear-gradient(135deg,#e85a4f,#f07c45);border-radius:12px 12px 0 0;padding:28px 32px;text-align:center;">
            <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
              <tr>
                <td style="vertical-align:middle;">${logoImg}</td>
                <td style="padding-left:10px;vertical-align:middle;">
                  <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.3px;">GymMatch</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Corpo branco -->
        <tr>
          <td style="background:#ffffff;border-radius:0 0 12px 12px;padding:36px 40px;">
            ${content}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td align="center" style="padding:24px 8px 0;">
            <p style="margin:0;color:#999;font-size:12px;line-height:1.6;">
              Se não foi você, ignore este email com segurança.
            </p>
            <p style="margin:8px 0 0;color:#bbb;font-size:11px;">
              © 2025 GymMatch &nbsp;·&nbsp;
              <a href="mailto:suporte@gymmatch.app" style="color:#bbb;text-decoration:none;">suporte@gymmatch.app</a>
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

function confirmHtml(url: string) {
  return emailLayout(`
    <h1 style="margin:0 0 8px;color:#1a1a2e;font-size:22px;font-weight:700;">Bem-vindo ao GymMatch!</h1>
    <p style="margin:0 0 24px;color:#555;font-size:15px;line-height:1.6;">
      Olá! Estamos felizes em ter você por aqui. Confirme seu email para ativar sua conta e começar a encontrar pessoas da sua academia.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td style="background:#f7f7fa;border-radius:8px;padding:16px 20px;">
          <p style="margin:0 0 4px;color:#999;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Email cadastrado</p>
          <p style="margin:0;color:#1a1a2e;font-size:15px;font-weight:600;">Clique no botão abaixo para confirmar</p>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td align="center">
          <a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#e85a4f,#f07c45);color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 40px;border-radius:8px;">
            Confirmar email
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0;color:#aaa;font-size:12px;line-height:1.6;text-align:center;">
      O link expira em 24 horas.
    </p>

    <p style="margin:28px 0 0;color:#777;font-size:13px;">
      Obrigado por escolher o GymMatch.<br>
      — Time GymMatch
    </p>
  `);
}

function resetHtml(url: string) {
  return emailLayout(`
    <h1 style="margin:0 0 8px;color:#1a1a2e;font-size:22px;font-weight:700;">Redefinir sua senha</h1>
    <p style="margin:0 0 24px;color:#555;font-size:15px;line-height:1.6;">
      Recebemos uma solicitação para redefinir a senha da sua conta. Clique no botão abaixo para criar uma nova senha.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td align="center">
          <a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#e85a4f,#f07c45);color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 40px;border-radius:8px;">
            Redefinir senha
          </a>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td style="background:#fff8f7;border-radius:8px;padding:14px 18px;border-left:3px solid #e85a4f;">
          <p style="margin:0;color:#888;font-size:12px;line-height:1.6;">
            Este link expira em <strong style="color:#555;">1 hora</strong>. Se você não solicitou a redefinição de senha, ignore este email — sua conta permanece segura.
          </p>
        </td>
      </tr>
    </table>

    <p style="margin:28px 0 0;color:#777;font-size:13px;">
      — Time GymMatch
    </p>
  `);
}

async function sendViaResend(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY não configurado");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "GymMatch <onboarding@resend.dev>",
      to: [to],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend: ${body}`);
  }
}

export const signUpAndSendEmail = createServerFn({ method: "POST" }).handler(async (ctx) => {
  const { email, password, redirectTo } = ctx.data as {
    email: string;
    password: string;
    redirectTo: string;
  };

  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: "signup",
    email,
    password,
    options: { redirectTo },
  });

  if (error) throw new Error(error.message);

  await sendViaResend(
    email,
    "Confirme seu email — GymMatch",
    confirmHtml(data.properties.action_link)
  );

  return { success: true };
});

export const sendPasswordResetEmail = createServerFn({ method: "POST" }).handler(async (ctx) => {
  const { email, redirectTo } = ctx.data as {
    email: string;
    redirectTo: string;
  };

  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo },
  });

  if (error) throw new Error(error.message);

  await sendViaResend(
    email,
    "Redefinir sua senha — GymMatch",
    resetHtml(data.properties.action_link)
  );

  return { success: true };
});
