import {
  IsEmail,
  IsString,
  MinLength,
  IsIn,
  IsOptional,
  Matches,
  MaxLength,
} from 'class-validator';
import {
  PASSWORD_STRENGTH_PATTERN,
  PASSWORD_TOO_WEAK_CODE,
} from '../../../lib/password-policy';

export class RegisterDto {
  @IsEmail({}, { message: 'Veuillez fournir une adresse email valide.' })
  email: string;

  @IsString()
  @MaxLength(128)
  @Matches(PASSWORD_STRENGTH_PATTERN, {
    message: PASSWORD_TOO_WEAK_CODE,
  })
  password: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;
}

export class LoginDto {
  @IsEmail({}, { message: 'Veuillez fournir une adresse email valide.' })
  email: string;

  @IsString()
  @MinLength(8, {
    message: 'Le mot de passe doit contenir au moins 8 caractères.',
  })
  password: string;

  /** When true, issue a long-lived token (~7 days) instead of the default. */
  @IsOptional()
  rememberMe?: boolean;
}

export class UpdateUserRoleDto {
  @IsString()
  @IsIn(['customer', 'admin'], {
    message: 'Le rôle doit être "customer" ou "admin".',
  })
  role: string;
}
