// Використання:
//   npm run make-admin -- <username>              (зробити існуючого юзера адміном)
//   npm run make-admin -- <username> <password>   (створити нового адміна, якщо немає)
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const [username, password] = process.argv.slice(2);
  if (!username) {
    console.error("Вкажи username: npm run make-admin -- <username> [password]");
    process.exit(1);
  }
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    await prisma.user.update({ where: { id: existing.id }, data: { role: "admin" } });
    console.log(`${username} (id ${existing.id}) тепер admin`);
    return;
  }
  if (!password) {
    console.error("Такого юзера немає. Додай пароль, щоб створити: npm run make-admin -- <username> <password>");
    process.exit(1);
  }
  const hash = await bcrypt.hash(password, 12);
  const u = await prisma.user.create({ data: { username, password: hash, role: "admin" } });
  console.log(`Створено admin ${username} (id ${u.id})`);
}

main().finally(() => prisma.$disconnect());
