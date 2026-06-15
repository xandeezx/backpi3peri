const express = require('express');
const router = express.Router();
const Atividade = require('../models/Atividade');
const Usuario = require('../models/Usuario');
const Curso = require('../models/Curso');
const Log = require('../models/Log');

/**
 * @swagger
 * /api/dashboard:
 *   get:
 *     summary: Retorna métricas completas do sistema
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Métricas retornadas com sucesso
 */
router.get('/', async (req, res) => {
  try {
    const [
      totalPendentes,
      totalAprovadas,
      totalRejeitadas,
      totalAlunos,
      totalCursos,
      totalCoordenadores,
      atividadesRecentes
    ] = await Promise.all([
      Atividade.countDocuments({ status: 'pendente' }),
      Atividade.countDocuments({ status: 'aprovado' }),
      Atividade.countDocuments({ status: 'rejeitado' }),
      Usuario.countDocuments({ perfil: 'aluno' }),
      Curso.countDocuments(),
      Usuario.countDocuments({ perfil: 'coordenador' }),
      Atividade.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('idAluno', 'nome')
        .populate('idCategoria', 'nome')
        .select('titulo status cargaHoraria createdAt idAluno idCategoria')
    ]);

    const totalAvaliadas = totalAprovadas + totalRejeitadas;
    const taxaAprovacao = totalAvaliadas > 0
      ? parseFloat(((totalAprovadas / totalAvaliadas) * 100).toFixed(1))
      : 0;

    // Soma total de horas aprovadas no sistema
    const horasAprovadas = await Atividade.aggregate([
      { $match: { status: 'aprovado' } },
      { $group: { _id: null, total: { $sum: '$avaliacao.cargaHorariaValidada' } } }
    ]);
    const totalHorasAprovadas = horasAprovadas[0]?.total || 0;

    // Atividades por status (para gráfico)
    const porStatus = [
      { status: 'pendente', total: totalPendentes },
      { status: 'aprovado', total: totalAprovadas },
      { status: 'rejeitado', total: totalRejeitadas }
    ];

    // Atividades dos últimos 6 meses (para gráfico de linha)
    const seisAtras = new Date();
    seisAtras.setMonth(seisAtras.getMonth() - 5);
    seisAtras.setDate(1);

    const porMes = await Atividade.aggregate([
      { $match: { createdAt: { $gte: seisAtras } } },
      {
        $group: {
          _id: {
            ano: { $year: '$createdAt' },
            mes: { $month: '$createdAt' }
          },
          total: { $sum: 1 },
          aprovadas: { $sum: { $cond: [{ $eq: ['$status', 'aprovado'] }, 1, 0] } }
        }
      },
      { $sort: { '_id.ano': 1, '_id.mes': 1 } }
    ]);

    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const evolucaoMensal = porMes.map(m => ({
      mes: `${meses[m._id.mes - 1]}/${m._id.ano}`,
      total: m.total,
      aprovadas: m.aprovadas
    }));

    res.json({
      totalPendentes,
      totalAprovadas,
      totalRejeitadas,
      totalAlunos,
      totalCursos,
      totalCoordenadores,
      totalHorasAprovadas,
      taxaAprovacao,
      porStatus,
      evolucaoMensal,
      atividadesRecentes: atividadesRecentes.map(a => ({
        _id: a._id,
        titulo: a.titulo,
        status: a.status,
        cargaHoraria: a.cargaHoraria,
        aluno: a.idAluno?.nome || '—',
        categoria: a.idCategoria?.nome || '—',
        data: a.createdAt
      }))
    });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar métricas', detalhe: error.message });
  }
});

/**
 * @swagger
 * /api/dashboard/logs:
 *   get:
 *     summary: Retorna os logs recentes do sistema
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: limite
 *         schema:
 *           type: number
 *           default: 50
 *     responses:
 *       200:
 *         description: Logs retornados com sucesso
 */
router.get('/logs', async (req, res) => {
  try {
    const limite = parseInt(req.query.limite) || 50;
    const logs = await Log.find()
      .sort({ createdAt: -1 })
      .limit(limite)
      .populate('idUsuario', 'nome email perfil');
    res.json(logs);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar logs', detalhe: error.message });
  }
});

module.exports = router;
