import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import * as readline from 'readline';

const prisma = new PrismaClient();

function prompt(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, resolve));
}

async function main() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  console.log('\n=== Criar Usuário Administrador ===\n');

  const name = await prompt(rl, 'Nome: ');
  const email = await prompt(rl, 'Email: ');
  const sector = await prompt(rl, 'Setor: ');
  const password = await prompt(rl, 'Senha: ');

  rl.close();

  if (!name || !email || !sector || !password) {
    console.error('\nErro: todos os campos são obrigatórios.');
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role === 'admin') {
      console.error(`\nErro: já existe um administrador com o email "${email}".`);
    } else {
      const updated = await prisma.user.update({
        where: { email },
        data: { role: 'admin' },
      });
      console.log(`\nUsuário existente promovido a administrador: ${updated.name} (${updated.email})`);
    }
    await prisma.$disconnect();
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      sector,
      password: hashedPassword,
      role: 'admin',
    },
  });

  console.log(`\nAdministrador criado com sucesso!`);
  console.log(`  ID:    ${user.id}`);
  console.log(`  Nome:  ${user.name}`);
  console.log(`  Email: ${user.email}`);
  console.log(`  Setor: ${user.sector}`);
  console.log(`  Role:  ${user.role}\n`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
