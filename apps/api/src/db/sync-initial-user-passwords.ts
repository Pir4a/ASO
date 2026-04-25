/**
 * Met à jour (ou crée) uniquement les comptes définis dans `seed-initial-users.ts`
 * avec le mot de passe seed actuel — utile après changement de politique MDP,
 * sans réexécuter tout le seed (catégories / produits / etc.).
 */
import bcrypt from 'bcryptjs';
import { AppDataSource } from './data-source';
import { User } from '../infrastructure/persistence/typeorm/entities/user.entity';
import { getInitialSeedUsers } from './seed-initial-users';

async function main() {
  await AppDataSource.initialize();
  const userRepo = AppDataSource.getRepository(User);
  const rows = getInitialSeedUsers();

  for (const u of rows) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    const existing = await userRepo.findOne({ where: { email: u.email } });
    if (existing) {
      existing.passwordHash = passwordHash;
      existing.role = u.role;
      existing.firstName = u.firstName;
      existing.lastName = u.lastName;
      existing.isVerified = true;
      existing.isActive = true;
      await userRepo.save(existing);
      console.log(`✓ Compte initial mis à jour : ${u.email}`);
    } else {
      await userRepo.save({
        email: u.email,
        passwordHash,
        role: u.role,
        firstName: u.firstName,
        lastName: u.lastName,
        isVerified: true,
        isActive: true,
      });
      console.log(`✓ Compte initial créé : ${u.email}`);
    }
  }

  await AppDataSource.destroy();
  console.log('\n✓ sync-initial-user-passwords terminé.');
}

main().catch((err: unknown) => {
  console.error(err);
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes('ENOTFOUND') && msg.includes('postgres')) {
    console.error(
      '\nAstuce : depuis ta machine (hors Docker), DATABASE_URL doit viser localhost, pas le hostname « postgres ».\n' +
        'Exemple : postgres://postgres:postgres@127.0.0.1:5432/althea\n' +
        'Puis : npm run sync-initial-user-passwords --workspace api\n',
    );
  }
  process.exit(1);
});
