import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "sepehrni@yahoo.com";
  const plainPassword = "@dmin3128"; // default admin password
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  // 1️⃣ Define module-level permissions
  const permissions = [
    { name: "contacts" },
    { name: "users" },
    { name: "organizations" },
  ];

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: perm,
    });
  }

  // 2️⃣ Create ADMIN role with all permissions
  const adminRole = await prisma.role.upsert({
    where: { name: "ADMIN" },
    update: {},
    create: {
      name: "ADMIN",
      description: "Full access to all modules",
      permissions: {
        connect: permissions.map((p) => ({ name: p.name })),
      },
    },
  });

  // 3️⃣ Create an organization if not exists
  const org = await prisma.organization.upsert({
    where: { name: "rouginedarou" },
    update: {},
    create: { name: "rouginedarou" },
  });

  // 4️⃣ Create admin user if not exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        name: "Admin",
        email: adminEmail,
        password: hashedPassword,
        extension: "000",
        role: { connect: { id: adminRole.id } },
        organization: { connect: { id: org.id } },
      },
    });

    console.log("✅ Admin user created with password:", plainPassword);
  } else {
    console.log("ℹ️ Admin already exists. Skipping user creation.");
  }

  console.log("✅ Roles and base permissions seeded successfully.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
