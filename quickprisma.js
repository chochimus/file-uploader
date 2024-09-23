const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function clearDatabase() {
  try {
    const files = await prisma.file.deleteMany({});
    const folders = await prisma.folder.deleteMany({});
    const users = await prisma.user.deleteMany({});
    const sessions = await prisma.session.deleteMany({});
    console.log(files, folders, users, sessions);
  } catch (error) {
    console.error("Error clearing database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

clearDatabase();
