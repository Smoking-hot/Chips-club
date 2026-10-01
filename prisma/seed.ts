import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

function generateInviteCode(length = 8) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

const prisma = new PrismaClient();

// System account that owns imported catalogue data (not meant for login).
const CATALOGUE_USER_EMAIL = "catalogue@chipsklubben.local";
const CATALOGUE_USER_NAME = "Chipsklubben katalog";

// Product names as listed on https://www.estrella.se/produktfamiljer/chips/
const ESTRELLA_CHIPS: { name: string; brand: string; country: string }[] = [
  { name: "Hot Honey Cheese & Mild Jalapeno", brand: "Estrella", country: "Sweden" },
  { name: "Cream Cheese & Onion", brand: "Estrella", country: "Sweden" },
  { name: "Paprika & Havssalt", brand: "Estrella", country: "Sweden" },
  { name: "Ugnsbakade Chips Brynt Smör & Chili", brand: "Estrella", country: "Sweden" },
  { name: "Vickningschips Saltade", brand: "Estrella", country: "Sweden" },
  { name: "Potatischips Salt & Vinegar", brand: "Estrella", country: "Sweden" },
  { name: "Ranch & Sourcream", brand: "Estrella", country: "Sweden" },
  { name: "Pepparchips", brand: "Estrella", country: "Sweden" },
  { name: "Sourcream & Onion", brand: "Estrella", country: "Sweden" },
  { name: "Dillchips", brand: "Estrella", country: "Sweden" },
  { name: "Grillchips", brand: "Estrella", country: "Sweden" },
];

async function ensureCatalogueUser() {
  const existing = await prisma.user.findUnique({
    where: { email: CATALOGUE_USER_EMAIL },
  });
  if (existing) return existing;

  const passwordHash = await bcrypt.hash(randomBytes(24).toString("hex"), 10);
  return prisma.user.create({
    data: {
      name: CATALOGUE_USER_NAME,
      email: CATALOGUE_USER_EMAIL,
      passwordHash,
    },
  });
}

async function seedEstrellaChips() {
  const catalogueUser = await ensureCatalogueUser();

  for (const chip of ESTRELLA_CHIPS) {
    await prisma.crisp.upsert({
      where: { name_brand: { name: chip.name, brand: chip.brand } },
      create: { ...chip, createdById: catalogueUser.id },
      update: { country: chip.country },
    });
  }

  console.log(`Seeded ${ESTRELLA_CHIPS.length} Estrella crisps into the listing.`);
}

async function grantAdmins() {
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  if (adminEmails.length === 0) return;

  const result = await prisma.user.updateMany({
    where: { email: { in: adminEmails } },
    data: { isAdmin: true },
  });

  if (result.count > 0) {
    console.log(`Granted admin to ${result.count} user(s) listed in ADMIN_EMAILS.`);
  }

  const matchedEmails = await prisma.user.findMany({
    where: { email: { in: adminEmails } },
    select: { email: true },
  });
  const matched = new Set(matchedEmails.map((u) => u.email));
  for (const email of adminEmails) {
    if (!matched.has(email)) {
      console.log(
        `ADMIN_EMAILS lists "${email}", but no account with that email exists yet — they'll need to register first.`
      );
    }
  }
}

async function seedBootstrapInvite() {
  const realMemberCount = await prisma.user.count({
    where: { email: { not: CATALOGUE_USER_EMAIL } },
  });
  if (realMemberCount > 0) {
    console.log("Members already exist — skipping bootstrap invite creation.");
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

async function main() {
  await seedEstrellaChips();
  await grantAdmins();
  await seedBootstrapInvite();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
