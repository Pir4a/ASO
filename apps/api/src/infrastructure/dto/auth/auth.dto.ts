import { IsEmail, IsString, MinLength, IsIn } from 'class-validator';

export class AuthDto {
  @IsEmail({}, { message: 'Veuillez fournir une adresse email valide.' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères.' })
  password: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;
}

export class UpdateUserRoleDto {
  @IsString()
  @IsIn(['user', 'admin'], { message: 'Le rôle doit être "user" ou "admin".' })
  role: string;
}