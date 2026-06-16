const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

// remetente padrao (funciona sem verificar dominio)
const FROM = 'Sistema SENAC <onboarding@resend.dev>';

// ── E-mail pro COORDENADOR quando aluno submete ──────────────
async function notificarCoordenadorNovaSubmissao({ coordenador, aluno, atividade }) {
  if (!process.env.RESEND_API_KEY) {
    console.log('[EMAIL] RESEND_API_KEY nao configurado');
    return false;
  }

  try {
    await resend.emails.send({
      from: FROM,
      to: [coordenador.email],
      subject: `[Atividades] Nova submissão de ${aluno.nome}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:auto;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
          <div style="background:#2563eb;padding:24px 32px;">
            <h1 style="color:#fff;margin:0;font-size:20px;">Nova Solicitação de Atividade Complementar</h1>
          </div>
          <div style="padding:24px 32px;">
            <p>Olá, <strong>${coordenador.nome}</strong>!</p>
            <p>O aluno <strong>${aluno.nome}</strong> submeteu uma nova atividade complementar para análise.</p>
            <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:16px 0;">
              <p style="margin:0 0 8px;"><strong>Atividade:</strong> ${atividade.titulo}</p>
              <p style="margin:0 0 8px;"><strong>Categoria:</strong> ${atividade.categoria || '—'}</p>
              <p style="margin:0 0 8px;"><strong>Carga Horária:</strong> ${atividade.cargaHoraria}h</p>
              ${atividade.temCertificado ? '<p style="margin:0;color:#16a34a;"><strong>📎 Certificado anexado</strong></p>' : ''}
              ${atividade.descricao ? `<p style="margin:8px 0 0;"><strong>Descrição:</strong> ${atividade.descricao}</p>` : ''}
            </div>
            <p>Acesse o sistema para analisar a solicitação.</p>
          </div>
          <div style="background:#f3f4f6;padding:16px 32px;text-align:center;">
            <p style="color:#9ca3af;font-size:12px;margin:0;">Sistema de Atividades Complementares — SENAC</p>
          </div>
        </div>
      `
    });
    console.log(`[EMAIL] Notificação enviada ao coordenador ${coordenador.email}`);
    return true;
  } catch (err) {
    console.error('[EMAIL] Erro ao enviar e-mail ao coordenador:', err.message);
    return false;
  }
}

// ── E-mail pro ALUNO quando atividade é APROVADA ─────────────
async function notificarAlunoAprovado({ aluno, atividade, cargaValidada, observacao }) {
  if (!process.env.RESEND_API_KEY) {
    console.log('[EMAIL] RESEND_API_KEY nao configurado');
    return false;
  }

  try {
    await resend.emails.send({
      from: FROM,
      to: [aluno.email],
      subject: `[Atividades] Sua atividade "${atividade.titulo}" foi aprovada!`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:auto;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
          <div style="background:#16a34a;padding:24px 32px;">
            <h1 style="color:#fff;margin:0;font-size:20px;">✅ Atividade Aprovada!</h1>
          </div>
          <div style="padding:24px 32px;">
            <p>Olá, <strong>${aluno.nome}</strong>!</p>
            <p>Sua solicitação foi <strong style="color:#16a34a;">aprovada</strong>.</p>
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:16px 0;">
              <p style="margin:0 0 8px;"><strong>Atividade:</strong> ${atividade.titulo}</p>
              <p style="margin:0 0 8px;"><strong>Horas Solicitadas:</strong> ${atividade.cargaHoraria}h</p>
              <p style="margin:0;"><strong>Horas Validadas:</strong> ${cargaValidada}h</p>
              ${observacao ? `<p style="margin:8px 0 0;"><strong>Observação:</strong> ${observacao}</p>` : ''}
            </div>
            <p>As horas foram computadas no seu histórico. Continue assim!</p>
          </div>
          <div style="background:#f3f4f6;padding:16px 32px;text-align:center;">
            <p style="color:#9ca3af;font-size:12px;margin:0;">Sistema de Atividades Complementares — SENAC</p>
          </div>
        </div>
      `
    });
    console.log(`[EMAIL] Aprovação enviada ao aluno ${aluno.email}`);
    return true;
  } catch (err) {
    console.error('[EMAIL] Erro ao enviar e-mail de aprovação:', err.message);
    return false;
  }
}

// ── E-mail pro ALUNO quando atividade é REJEITADA ────────────
async function notificarAlunoRejeitado({ aluno, atividade, observacao }) {
  if (!process.env.RESEND_API_KEY) {
    console.log('[EMAIL] RESEND_API_KEY nao configurado');
    return false;
  }

  try {
    await resend.emails.send({
      from: FROM,
      to: [aluno.email],
      subject: `[Atividades] Resultado da sua solicitação: "${atividade.titulo}"`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:auto;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
          <div style="background:#dc2626;padding:24px 32px;">
            <h1 style="color:#fff;margin:0;font-size:20px;">❌ Atividade Não Aprovada</h1>
          </div>
          <div style="padding:24px 32px;">
            <p>Olá, <strong>${aluno.nome}</strong>!</p>
            <p>Sua solicitação foi <strong style="color:#dc2626;">rejeitada</strong>.</p>
            <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin:16px 0;">
              <p style="margin:0 0 8px;"><strong>Atividade:</strong> ${atividade.titulo}</p>
              <p style="margin:0 0 8px;"><strong>Horas Solicitadas:</strong> ${atividade.cargaHoraria}h</p>
              ${observacao ? `<p style="margin:0;"><strong>Motivo:</strong> ${observacao}</p>` : '<p style="margin:0;color:#6b7280;">Nenhum motivo informado.</p>'}
            </div>
            <p>Em caso de dúvidas, entre em contato com a coordenação do seu curso.</p>
          </div>
          <div style="background:#f3f4f6;padding:16px 32px;text-align:center;">
            <p style="color:#9ca3af;font-size:12px;margin:0;">Sistema de Atividades Complementares — SENAC</p>
          </div>
        </div>
      `
    });
    console.log(`[EMAIL] Rejeição enviada ao aluno ${aluno.email}`);
    return true;
  } catch (err) {
    console.error('[EMAIL] Erro ao enviar e-mail de rejeição:', err.message);
    return false;
  }
}

module.exports = {
  notificarCoordenadorNovaSubmissao,
  notificarAlunoAprovado,
  notificarAlunoRejeitado
};
