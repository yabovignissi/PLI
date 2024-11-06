require('dotenv').config({ path: '.env.test' });

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const tablesToTest = ['user', 'trip', 'comment', 'step', 'location', 'photo'];

describe('Vérification de l’existence des tables de la base de données', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  tablesToTest.forEach((table) => {
    test(`La table ${table.charAt(0).toUpperCase() + table.slice(1)} est bien créée`, async () => {
      await expect(prisma[table].findFirst()).resolves.toBeDefined();
    });
  });
});
