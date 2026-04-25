/**
 * Politique de force du mot de passe (inscription, changement de mot de passe).
 * Les connexions restent possibles avec les anciens mots de passe tant qu’ils ne sont pas renouvelés.
 */

/** Code stable pour que le front affiche la politique dans la langue de l’utilisateur. */
export const PASSWORD_TOO_WEAK_CODE = 'PASSWORD_TOO_WEAK';

/** ASCII, 12–128 caractères : majuscule + chiffre + symbole (plafond 128 silencieux côté regex) */
export const PASSWORD_STRENGTH_PATTERN =
  /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,128}$/;

export function passwordMeetsPolicy(password: string): boolean {
  return PASSWORD_STRENGTH_PATTERN.test(password);
}
