const express = require('express');
const router = express.Router();
const Atividade = require('../models/Atividade');
const Usuario = require('../models/Usuario');
const Curso = require('../models/Curso');
const { registrarLog } = require('../middleware/logger');
const {
  notificarCoordenadorNovaSubmissao,
  notificarAlunoAprovado,
  notificarAlunoRejeitado
} = require('../services/emailService');

// calcula horas aprovadas de um aluno por categoria
async function calcularHorasAlunoCategoria(idAluno, idCategoria) {
  const atividades = await Atividade.find({ idAluno, idCategoria, status: 'aprovado' });
  return atividades.reduce((acc, a) => acc + (a.avaliacao?.cargaHorariaValidada || 0), 0);
}

// lista todas as solicitacoes
router.get('/', async (req, res) => {
  try {
    const filtro = {};
    if (req.query.status && req.query.status !== 'todos') filtro.status = req.query.status;
    if (req.query.idAluno) filtro.idAluno = req.query.idAluno;

    // nao retorna o base64 do certificado na listagem (economiza banda)
    const atividades = await Atividade.find(filtro)
      .select('-certificado.base64')
      .populate('idAluno', 'nome email matricula')
      .populate('idCurso', 'nome')
      .populate('idCategoria', 'nome')
      .sort({ createdAt: -1 });

    res.json(atividades);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao listar solicitações', detalhe: error.message });
  }
});

// lista solicitacoes de um aluno
router.get('/aluno/:idAluno', async (req, res) => {
  try {
    const atividades = await Atividade.find({ idAluno: req.params.idAluno })
      .select('-certificado.base64')
      .populate('idCurso', 'nome cargaHorariaTotal')
      .populate('idCategoria', 'nome')
      .sort({ createdAt: -1 });

    const totalAprovadas = atividades
      .filter(a => a.status === 'aprovado')
      .reduce((acc, a) => acc + (a.avaliacao?.cargaHorariaValidada || 0), 0);

    res.json({ atividades, totalHorasAprovadas: totalAprovadas });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao listar solicitações do aluno', detalhe: error.message });
  }
});

// busca solicitacao por ID (inclui o certificado completo)
router.get('/:id', async (req, res) => {
  try {
    const atividade = await Atividade.findById(req.params.id)
      .populate('idAluno', 'nome email matricula')
      .populate('idCurso', 'nome cargaHorariaTotal regrasCategoria')
      .populate('idCategoria', 'nome');

    if (!atividade) return res.status(404).json({ erro: 'Solicitação não encontrada' });
    res.json(atividade);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar solicitação', detalhe: error.message });
  }
});

// rota separada so pra baixar o certificado
router.get('/:id/certificado', async (req, res) => {
  try {
    const atividade = await Atividade.findById(req.params.id).select('certificado titulo');
    if (!atividade) return res.status(404).json({ erro: 'Solicitação não encontrada' });
    if (!atividade.certificado || !atividade.certificado.base64) {
      return res.status(404).json({ erro: 'Essa solicitação não possui certificado anexado' });
    }

    // converte base64 de volta pra buffer e envia como PDF
    const buffer = Buffer.from(atividade.certificado.base64, 'base64');
    const nomeArquivo = atividade.certificado.nomeArquivo || 'certificado.pdf';

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${nomeArquivo}"`);
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao baixar certificado', detalhe: error.message });
  }
});

// cria nova solicitacao
router.post('/', async (req, res) => {
  try {
    const { titulo, descricao, cargaHoraria, idAluno, idCurso, idCategoria, certificado } = req.body;
    const ip = req.ip;

    if (!titulo || !cargaHoraria || !idAluno || !idCurso || !idCategoria) {
      return res.status(400).json({ erro: 'Título, carga horária, aluno, curso e categoria são obrigatórios' });
    }

    // valida regras de horas do curso
    const curso = await Curso.findById(idCurso);
    if (curso && curso.regrasCategoria && curso.regrasCategoria.length > 0) {
      const regraCategoria = curso.regrasCategoria.find(
        r => r.idCategoria.toString() === idCategoria.toString()
      );
      if (regraCategoria) {
        const horasJaAprovadas = await calcularHorasAlunoCategoria(idAluno, idCategoria);
        if (horasJaAprovadas >= regraCategoria.maxHoras) {
          return res.status(400).json({
            erro: 'Limite de horas atingido para esta categoria neste curso.',
            detalhe: `Você já tem ${horasJaAprovadas}h aprovadas (limite: ${regraCategoria.maxHoras}h).`
          });
        }
      }
    }

    const dadosAtividade = {
      titulo,
      descricao,
      cargaHoraria,
      idAluno,
      idCurso,
      idCategoria,
      status: 'pendente',
      dataEnvio: new Date()
    };

    // salva o certificado se foi enviado
    if (certificado && certificado.base64) {
      dadosAtividade.certificado = {
        nomeArquivo: certificado.nomeArquivo || 'certificado.pdf',
        base64:      certificado.base64,
        tamanho:     certificado.tamanho || 0
      };
    }

    const atividade = new Atividade(dadosAtividade);
    await atividade.save();

    await registrarLog({
      acao: 'solicitacao_criada',
      descricao: `Aluno submeteu atividade: "${titulo}" (${cargaHoraria}h)${certificado ? ' com certificado' : ''}`,
      idUsuario: idAluno,
      idReferencia: atividade._id,
      tipoReferencia: 'Atividade',
      ip
    });

    // notifica coordenadores por e-mail
    try {
      const aluno = await Usuario.findById(idAluno).select('nome email matricula');
      const atividadePopulada = await Atividade.findById(atividade._id).populate('idCategoria', 'nome');
      const coordenadores = await Usuario.find({ perfil: 'coordenador' }).select('nome email');

      for (const coord of coordenadores) {
        await notificarCoordenadorNovaSubmissao({
          coordenador: coord,
          aluno,
          atividade: {
            titulo,
            descricao,
            cargaHoraria,
            categoria: atividadePopulada.idCategoria?.nome,
            temCertificado: !!(certificado && certificado.base64)
          }
        });
      }
    } catch (emailErr) {
      console.error('[EMAIL] Erro ao notificar coordenadores:', emailErr.message);
    }

    res.status(201).json({ ...atividade.toObject(), certificado: { nomeArquivo: dadosAtividade.certificado?.nomeArquivo || null } });
  } catch (error) {
    await registrarLog({ acao: 'solicitacao_criada', descricao: 'Erro ao criar solicitação', sucesso: false, erro: error.message });
    res.status(500).json({ erro: 'Erro ao criar solicitação', detalhe: error.message });
  }
});

// aprova solicitacao
router.put('/:id/aprovar', async (req, res) => {
  try {
    const { idCoordenador, cargaHorariaValidada, observacao } = req.body;

    const atividade = await Atividade.findByIdAndUpdate(
      req.params.id,
      {
        status: 'aprovado',
        'avaliacao.cargaHorariaValidada': cargaHorariaValidada || 0,
        'avaliacao.observacao':           observacao || null,
        'avaliacao.dataAvaliacao':        new Date(),
        'avaliacao.idCoordenador':        idCoordenador || null
      },
      { new: true }
    ).select('-certificado.base64').populate('idAluno', 'nome email matricula').populate('idCategoria', 'nome');

    if (!atividade) return res.status(404).json({ erro: 'Solicitação não encontrada' });

    await registrarLog({
      acao: 'solicitacao_aprovada',
      descricao: `Atividade "${atividade.titulo}" aprovada com ${cargaHorariaValidada || 0}h`,
      idUsuario: idCoordenador || null,
      idReferencia: atividade._id,
      tipoReferencia: 'Atividade',
      ip: req.ip
    });

    // notifica aluno por e-mail
    try {
      if (atividade.idAluno) {
        await notificarAlunoAprovado({
          aluno: atividade.idAluno,
          atividade: { titulo: atividade.titulo, cargaHoraria: atividade.cargaHoraria },
          cargaValidada: cargaHorariaValidada || 0,
          observacao: observacao || null
        });
      }
    } catch (emailErr) {
      console.error('[EMAIL] Erro ao notificar aluno aprovado:', emailErr.message);
    }

    res.json(atividade);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao aprovar solicitação', detalhe: error.message });
  }
});

// rejeita solicitacao
router.put('/:id/rejeitar', async (req, res) => {
  try {
    const { observacao, idCoordenador } = req.body || {};

    const atividade = await Atividade.findByIdAndUpdate(
      req.params.id,
      {
        status: 'rejeitado',
        'avaliacao.observacao':    observacao || null,
        'avaliacao.dataAvaliacao': new Date(),
        'avaliacao.idCoordenador': idCoordenador || null
      },
      { new: true }
    ).select('-certificado.base64').populate('idAluno', 'nome email matricula');

    if (!atividade) return res.status(404).json({ erro: 'Solicitação não encontrada' });

    await registrarLog({
      acao: 'solicitacao_rejeitada',
      descricao: `Atividade "${atividade.titulo}" rejeitada. Motivo: ${observacao || 'não informado'}`,
      idUsuario: idCoordenador || null,
      idReferencia: atividade._id,
      tipoReferencia: 'Atividade',
      ip: req.ip
    });

    // notifica aluno por e-mail
    try {
      if (atividade.idAluno) {
        await notificarAlunoRejeitado({
          aluno: atividade.idAluno,
          atividade: { titulo: atividade.titulo, cargaHoraria: atividade.cargaHoraria },
          observacao: observacao || null
        });
      }
    } catch (emailErr) {
      console.error('[EMAIL] Erro ao notificar aluno rejeitado:', emailErr.message);
    }

    res.json(atividade);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao rejeitar solicitação', detalhe: error.message });
  }
});

module.exports = router;
