import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function promoteUser(adUsername: string) {
  const user = await prisma.user.findUnique({ where: { adUsername } });

  if (!user) {
    console.error(`\nUsuário "${adUsername}" não encontrado no banco. Ele precisa ter feito login pelo menos uma vez via AD.\n`);
    process.exit(1);
  }

  if (user.role === 'admin') {
    console.log(`\n"${user.name}" (${adUsername}) já é admin. Nenhuma alteração.\n`);
    return user;
  }

  const updated = await prisma.user.update({
    where: { adUsername },
    data: { role: 'admin' },
  });

  console.log(`\nPromovido: ${updated.name} (${adUsername}) → admin\n`);
  return updated;
}

async function enforceSingleAdminInDept(adUsername: string, department: string) {
  const demoted = await prisma.user.updateMany({
    where: {
      department,
      role: 'admin',
      NOT: { adUsername },
    },
    data: { role: 'dept_user' },
  });

  if (demoted.count > 0) {
    console.log(`Rebaixados ${demoted.count} admin(s) em "${department}" — apenas "${adUsername}" mantém o papel.\n`);
  }
}

async function main() {
  const target = process.argv[2] ?? 'pmiranda';

  console.log(`\n=== Promoção de Administrador ===`);
  console.log(`Alvo: ${target}\n`);

  const user = await promoteUser(target);

  if (user.department) {
    await enforceSingleAdminInDept(target, user.department);
  }

  console.log('Concluído.\n');
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
