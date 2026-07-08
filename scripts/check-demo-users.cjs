const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const emails = ["admin@raseed.local", "owner@raseed.local", "cashier@raseed.local"];
  const users = await prisma.user.findMany({
    where: { email: { in: emails } },
    include: { store: true, role: true },
    orderBy: { email: "asc" },
  });

  console.log(`Found ${users.length}/${emails.length} demo users`);
  for (const email of emails) {
    const user = users.find((item) => item.email === email);
    if (!user) {
      console.log(`${email}: MISSING`);
      continue;
    }
    const expectedPassword = email === "admin@raseed.local" ? "RaseedAdmin!2026" : "hello2026";
    const passwordOk = user.passwordHash ? await bcrypt.compare(expectedPassword, user.passwordHash) : false;
    console.log(
      [
        `${email}: OK`,
        `status=${user.status}`,
        `role=${user.role?.name ?? "-"}`,
        `store=${user.store?.name ?? "platform"}`,
        `password=${passwordOk ? "OK" : "BAD"}`,
      ].join(" | "),
    );
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
