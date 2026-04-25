import type { UserRole } from '../infrastructure/persistence/typeorm/entities/user.entity';

/**
 * Comptes créés / mis à jour par le seed (`npm run seed`).
 * Mot de passe conforme à la politique de force — à changer en production réelle.
 */
export const INITIAL_SEED_PASSWORD = 'AltheaDemo2026!';

export type InitialSeedUser = {
  email: string;
  password: string;
  role: UserRole;
  firstName: string;
  lastName: string;
};

export function getInitialSeedUsers(): InitialSeedUser[] {
  const p = INITIAL_SEED_PASSWORD;
  return [
    {
      email: 'admin@althea.local',
      password: p,
      role: 'admin',
      firstName: 'Admin',
      lastName: 'Althea',
    },
    {
      email: 'demo@althea.local',
      password: p,
      role: 'customer',
      firstName: 'Marie',
      lastName: 'Dupont',
    },
    {
      email: 'admin@admin.com',
      password: p,
      role: 'admin',
      firstName: 'Admin',
      lastName: 'Backoffice',
    },
    {
      email: 'user@user.com',
      password: p,
      role: 'customer',
      firstName: 'Jane',
      lastName: 'Doe',
    },
  ];
}
