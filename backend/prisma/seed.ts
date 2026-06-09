import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // ── CommissionConfig ────────────────────────────────────────
  // Valores zerados — superadmin edita via PUT /api/commission/config
  const tiers = [
    { tier: 'bronze',   minXp: 0,    maxXp: 499,  amount: 0 },
    { tier: 'silver',   minXp: 500,  maxXp: 999,  amount: 0 },
    { tier: 'gold',     minXp: 1000, maxXp: 1999, amount: 0 },
    { tier: 'platinum', minXp: 2000, maxXp: 3499, amount: 0 },
    { tier: 'elite',    minXp: 3500, maxXp: null, amount: 0 },
  ];

  for (const t of tiers) {
    await prisma.commissionConfig.upsert({
      where:  { tier: t.tier },
      create: t,
      update: {},          // nao sobrescreve se admin ja editou
    });
  }
  console.log('✔ CommissionConfig: 5 faixas criadas');

  // ── FieldTask ───────────────────────────────────────────────
  // Categorias e SLAs baseados no Ocomon de producao (.214)
  // XP base proporcional ao SLA: tarefas mais longas/criticas = mais XP
  const fieldTasks = [
    // Manutenção Corretiva (urgente, SLA curto)
    { name: 'Substituir HD/SSD com falha',        category: 'Manutenção Corretiva',  xpBase: 40, slaMinutes: 120, description: 'Troca de disco com falha e restauração de dados' },
    { name: 'Trocar fonte de alimentação',         category: 'Manutenção Corretiva',  xpBase: 30, slaMinutes: 60  },
    { name: 'Reparar cabo de rede danificado',     category: 'Manutenção Corretiva',  xpBase: 20, slaMinutes: 30  },
    { name: 'Resolver falha de impressora',        category: 'Manutenção Corretiva',  xpBase: 25, slaMinutes: 45  },
    { name: 'Restaurar acesso bloqueado no AD',    category: 'Manutenção Corretiva',  xpBase: 20, slaMinutes: 20  },

    // Manutenção Emergencial (SLA crítico 2h)
    { name: 'Servidor fora do ar — diagnóstico',  category: 'Manutenção Emergencial', xpBase: 60, slaMinutes: 120, description: 'Identificar e resolver indisponibilidade de servidor' },
    { name: 'Switch/roteador sem resposta',        category: 'Manutenção Emergencial', xpBase: 50, slaMinutes: 120 },
    { name: 'Ataque/ransomware — contenção',       category: 'Manutenção Emergencial', xpBase: 80, slaMinutes: 120, description: 'Isolar máquina e acionar protocolo de segurança' },

    // Manutenção Preventiva (SLA folgado, agendado)
    { name: 'Limpeza interna de computador',      category: 'Manutenção Preventiva',  xpBase: 15, slaMinutes: 30  },
    { name: 'Atualização de drivers e SO',         category: 'Manutenção Preventiva',  xpBase: 20, slaMinutes: 60  },
    { name: 'Verificação de backup',               category: 'Manutenção Preventiva',  xpBase: 15, slaMinutes: 20  },
    { name: 'Inventário de equipamento',           category: 'Manutenção Preventiva',  xpBase: 10, slaMinutes: 20  },
    { name: 'Teste de nobreak/UPS',                category: 'Manutenção Preventiva',  xpBase: 20, slaMinutes: 30  },

    // Manutenção Evolutiva (instalações novas)
    { name: 'Instalar estação de trabalho',        category: 'Manutenção Evolutiva',   xpBase: 35, slaMinutes: 90, description: 'Montagem, configuração e ingresso no domínio' },
    { name: 'Instalar monitor e periféricos',      category: 'Manutenção Evolutiva',   xpBase: 15, slaMinutes: 20  },
    { name: 'Configurar VPN para usuário',         category: 'Manutenção Evolutiva',   xpBase: 25, slaMinutes: 30  },
    { name: 'Passar ponto de rede (cabeamento)',   category: 'Manutenção Evolutiva',   xpBase: 30, slaMinutes: 120 },
    { name: 'Instalar e configurar software',      category: 'Manutenção Evolutiva',   xpBase: 20, slaMinutes: 45  },

    // Manutenção Proativa (monitoramento, melhoria)
    { name: 'Revisão de logs do servidor',         category: 'Manutenção Proativa',    xpBase: 20, slaMinutes: 30  },
    { name: 'Auditoria de contas no AD',           category: 'Manutenção Proativa',    xpBase: 25, slaMinutes: 60  },
    { name: 'Otimização de disco/memória',         category: 'Manutenção Proativa',    xpBase: 20, slaMinutes: 45  },

    // Manutenção Preditiva (análise antes da falha)
    { name: 'Análise S.M.A.R.T. de discos',       category: 'Manutenção Preditiva',   xpBase: 20, slaMinutes: 30  },
    { name: 'Monitorar temperatura de servidores', category: 'Manutenção Preditiva',   xpBase: 15, slaMinutes: 20  },
  ];

  let created = 0;
  for (const t of fieldTasks) {
    const exists = await prisma.fieldTask.findFirst({ where: { name: t.name } });
    if (!exists) {
      await prisma.fieldTask.create({ data: t });
      created++;
    }
  }
  console.log(`✔ FieldTask: ${created} tarefas criadas (${fieldTasks.length - created} já existiam)`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
