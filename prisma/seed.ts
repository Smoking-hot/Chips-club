import { PrismaClient } from "@prisma/client";

function generateInviteCode(length = 8) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

const prisma = new PrismaClient();

async function main() {
  const existingUsers = await prisma.user.count();
  if (existingUsers > 0) {
    console.log("Users already exist — skipping bootstrap invite creation.");
    return;
  }

  const unusedBootstrapInvites = await prisma.inviteCode.count({
    where: { createdById: null, usedAt: null },
  });
  if (unusedBootstrapInvites > 0) {
    console.log("An unused bootstrap invite already exists — skipping.");
    return;
  }

  const code = generateInviteCode();
  await prisma.inviteCode.create({ data: { code } });

  console.log("\nCreated a bootstrap invite code for the first member:\n");
  console.log(`  ${code}\n`);
  console.log(`Register at /register?code=${code}\n`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
