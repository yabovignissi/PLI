import { exec } from 'child_process';
import dotenv from 'dotenv';
import path from 'path';


dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

function runMigration() {

  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL non définie. Assurez-vous que .env.test est configuré correctement.');
    process.exit(1);
  }
  exec('npx prisma migrate dev', (error, stdout, stderr) => {
    if (error) {
      console.error(`Erreur lors de la migration: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Erreur dans stderr: ${stderr}`);
      return;
    }
    console.log(`Migration réussie:\n${stdout}`);
  });
}
runMigration();
