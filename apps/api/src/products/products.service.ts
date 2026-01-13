import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity';
import { Category } from '../entities/category.entity'; // Import de l'entité Category
import { CreateProductDto } from './dto/create-product.dto';
import { v4 as uuidv4 } from 'uuid'; // Import de uuid pour la génération de SKU
import slugify from 'slugify';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product) private readonly productsRepository: Repository<Product>,
    @InjectRepository(Category) // Injection du repository Category
    private readonly categoriesRepository: Repository<Category>,
  ) {}

  findAll() {
    return this.productsRepository.find({ order: { name: 'ASC' } });
  }

  async findOneBySlug(slug: string) {
    const product = await this.productsRepository.findOne({ where: { slug } });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const { name, slug, categoryId, price, stock, description } = createProductDto;

    // Vérifier si la catégorie existe
    const category = await this.categoriesRepository.findOne({ where: { id: categoryId } });
    if (!category) {
      throw new NotFoundException(`Category with ID "${categoryId}" not found.`);
    }

    const productSlug = slug || slugify(name, { lower: true, strict: true });

    const existingProduct = await this.productsRepository.findOne({ where: { slug: productSlug } });
    if (existingProduct) {
      throw new ConflictException(`Un produit avec le slug "${productSlug}" existe déjà.`);
    }

    // Générer un SKU unique (UUID pour l'instant)
    const generatedSku = uuidv4();

    const product = this.productsRepository.create({
      name,
      slug: productSlug,
      description,
      price, // Utilise directement le prix du DTO
      stock, // Utilise directement le stock du DTO
      sku: generatedSku, // Assigne le SKU généré
      currency: 'EUR', // Devise par défaut
      status: 'new', // Statut par défaut
      category,
    });

    return this.productsRepository.save(product);
  }
}
