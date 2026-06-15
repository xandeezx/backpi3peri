const nodemailer = require('nodemailer');

// Cria o transporter usando variáveis de ambiente
// Para produção: configure SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS no .env
// Para testes: use Ethereal (https://ethereal.email) — cria conta gratuita fake
function criarTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

const remetente = process.env.SMTP_FROM || '"Sistema de Atividades" <noreply@senac.br>';

// ──────────────────────────────────────────────
// E-mail enviado ao COORDENADOR quando aluno submete atividade
// ──────────────────────────────────────────────
async function notificarCoordenadorNovaSubmissao({ coordenador, aluno, atividade }) {
  if (!process.env.SMTP_USER) {
    console.log('[EMAIL] SMTP não configurado — e-mail de nova submissão não enviado.');
    return false;
  }

  const transporter = criarTransporter();

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
      <div style="background: #2563eb; padding: 24px 32px;">
        <h1 style="color: #fff; margin: 0; font-size: 20px;">Nova Solicitação de Atividade Complementar</h1>
      </div>
      <div style="padding: 24px 32px;">
        <p style="color: #374151;">Olá, <strong>${coordenador.nome}</strong>!</p>
        <p style="color: #374151;">O aluno <strong>${aluno.nome}</strong> (matrícula: <strong>${aluno.matricula || '—'}</strong>) submeteu uma nova atividade complementar para análise.</p>
        
        <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 8px; color: #111;"><strong>Atividade:</strong> ${atividade.titulo}</p>
          <p style="margin: 0 0 8px; color: #111;"><strong>Categoria:</strong> ${atividade.categoria || '—'}</p>
          <p style="margin: 0 0 8px; color: #111;"><strong>Carga Horária Solicitada:</strong> ${atividade.cargaHoraria}h</p>
          ${atividade.descricao ? `<p style="margin: 0; color: #111;"><strong>Descrição:</strong> ${atividade.descricao}</p>` : ''}
        </div>

        <p style="color: #374151;">Acesse o sistema para analisar a solicitação.</p>
      </div>
      <div style="background: #f3f4f6; padding: 16px 32px; text-align: center;">
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">Sistema de Atividades Complementares — SENAC</p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: remetente,
      to: coordenador.email,
      subject: `[Atividades] Nova submissão de ${aluno.nome}`,
      html
    });
    console.log(`[EMAIL] Notificação enviada ao coordenador ${coordenador.email}`);
    return true;
  } catch (err) {
    console.error('[EMAIL] Erro ao enviar e-mail ao coordenador:', err.message);
    return false;
  }
}

// ──────────────────────────────────────────────
// E-mail enviado ao ALUNO quando atividade é APROVADA
// ──────────────────────────────────────────────
async function notificarAlunoAprovado({ aluno, atividade, cargaValidada, observacao }) {
  if (!process.env.SMTP_USER) {
    console.log('[EMAIL] SMTP não configurado — e-mail de aprovação não enviado.');
    return false;
  }

  const transporter = criarTransporter();

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
      <div style="background: #16a34a; padding: 24px 32px;">
        <h1 style="color: #fff; margin: 0; font-size: 20px;">✅ Atividade Aprovada!</h1>
      </div>
      <div style="padding: 24px 32px;">
        <p style="color: #374151;">Olá, <strong>${aluno.nome}</strong>!</p>
        <p style="color: #374151;">Sua solicitação de atividade complementar foi <strong style="color: #16a34a;">aprovada</strong>.</p>
        
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 8px; color: #111;"><strong>Atividade:</strong> ${atividade.titulo}</p>
          <p style="margin: 0 0 8px; color: #111;"><strong>Horas Solicitadas:</strong> ${atividade.cargaHoraria}h</p>
          <p style="margin: 0; color: #111;"><strong>Horas Validadas:</strong> ${cargaValidada}h</p>
          ${observacao ? `<p style="margin: 8px 0 0; color: #111;"><strong>Observação:</strong> ${observacao}</p>` : ''}
        </div>

        <p style="color: #374151;">As horas foram computadas no seu histórico. Continue assim!</p>
      </div>
      <div style="background: #f3f4f6; padding: 16px 32px; text-align: center;">
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">Sistema de Atividades Complementares — SENAC</p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: remetente,
      to: aluno.email,
      subject: `[Atividades] Sua atividade "${atividade.titulo}" foi aprovada!`,
      html
    });
    console.log(`[EMAIL] Notificação de aprovação enviada ao aluno ${aluno.email}`);
    return true;
  } catch (err) {
    console.error('[EMAIL] Erro ao enviar e-mail de aprovação:', err.message);
    return false;
  }
}

// ──────────────────────────────────────────────
// E-mail enviado ao ALUNO quando atividade é REJEITADA
// ──────────────────────────────────────────────
async function notificarAlunoRejeitado({ aluno, atividade, observacao }) {
  if (!process.env.SMTP_USER) {
    console.log('[EMAIL] SMTP não configurado — e-mail de rejeição não enviado.');
    return false;
  }

  const transporter = criarTransporter();

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
      <div style="background: #dc2626; padding: 24px 32px;">
        <h1 style="color: #fff; margin: 0; font-size: 20px;">❌ Atividade Não Aprovada</h1>
      </div>
      <div style="padding: 24px 32px;">
        <p style="color: #374151;">Olá, <strong>${aluno.nome}</strong>!</p>
        <p style="color: #374151;">Infelizmente, sua solicitação de atividade complementar foi <strong style="color: #dc2626;">rejeitada</strong>.</p>
        
        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 8px; color: #111;"><strong>Atividade:</strong> ${atividade.titulo}</p>
          <p style="margin: 0 0 8px; color: #111;"><strong>Horas Solicitadas:</strong> ${atividade.cargaHoraria}h</p>
          ${observacao ? `<p style="margin: 0; color: #111;"><strong>Motivo:</strong> ${observacao}</p>` : '<p style="margin: 0; color: #6b7280;">Nenhum motivo informado pelo coordenador.</p>'}
        </div>

        <p style="color: #374151;">Em caso de dúvidas, entre em contato com a coordenação do seu curso.</p>
      </div>
      <div style="background: #f3f4f6; padding: 16px 32px; text-align: center;">
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">Sistema de Atividades Complementares — SENAC</p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: remetente,
      to: aluno.email,
      subject: `[Atividades] Resultado da sua solicitação: "${atividade.titulo}"`,
      html
    });
    console.log(`[EMAIL] Notificação de rejeição enviada ao aluno ${aluno.email}`);
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
