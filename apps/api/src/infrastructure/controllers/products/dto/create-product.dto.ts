import { IsString, IsNotEmpty, IsNumber, IsPositive, IsInt, Min, MaxLength } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty({ message: 'Le nom du produit ne peut pas être vide.' })
  @MaxLength(255, { message: 'Le nom du produit ne peut pas dépasser 255 caractères.' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Le slug du produit ne peut pas être vide.' })
  @MaxLength(255, { message: 'Le slug du produit ne peut pas dépasser 255 caractères.' })
  // TODO: Ajouter un validateur personnalisé pour un slug unique
  slug: string;

  @IsString()
  @IsNotEmpty({ message: 'La description du produit ne peut pas être vide.' })
  description: string;

  @IsNumber({}, { message: 'Le prix doit être un nombre.' })
  @IsPositive({ message: 'Le prix doit être un nombre positif.' })
  price: number;

  @IsInt({ message: 'Le stock doit être un entier.' })
  @Min(0, { message: 'Le stock ne peut pas être négatif.' })
  stock: number;

  @IsString()
  @IsNotEmpty({ message: 'La catégorie est requise.' })
  categoryId: string; // L'ID de la catégorie à laquelle le produit appartient
}