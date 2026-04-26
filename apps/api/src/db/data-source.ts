import 'dotenv/config'; // Trigger rebuild
import { DataSource } from 'typeorm';
import { User } from '../infrastructure/persistence/typeorm/entities/user.entity';
import { Category } from '../infrastructure/persistence/typeorm/entities/category.entity';
import { Product } from '../infrastructure/persistence/typeorm/entities/product.entity';
import { ContentBlock } from '../infrastructure/persistence/typeorm/entities/content-block.entity';
import { Address } from '../infrastructure/persistence/typeorm/entities/address.entity';
import { Cart } from '../infrastructure/persistence/typeorm/entities/cart.entity';
import { CartItem } from '../infrastructure/persistence/typeorm/entities/cart-item.entity';
import { Order } from '../infrastructure/persistence/typeorm/entities/order.entity';
import { OrderItem } from '../infrastructure/persistence/typeorm/entities/order-item.entity';
import { Promotion } from '../infrastructure/persistence/typeorm/entities/promotion.entity';
import { ContactMessage } from '../infrastructure/persistence/typeorm/entities/contact-message.entity';
import { InvoiceOrm } from '../infrastructure/persistence/typeorm/entities/invoice.entity';
import { CreditNoteOrm } from '../infrastructure/persistence/typeorm/entities/credit-note.entity';
import { ChatSessionOrm } from '../infrastructure/persistence/typeorm/entities/chat-session.entity';
import { ChatMessageOrm } from '../infrastructure/persistence/typeorm/entities/chat-message.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [
    User,
    Category,
    Product,
    ContentBlock,
    Address,
    Cart,
    CartItem,
    Order,
    OrderItem,
    Promotion,
    ContactMessage,
    InvoiceOrm,
    CreditNoteOrm,
    ChatSessionOrm,
    ChatMessageOrm,
  ],
  migrations: ['src/migrations/*.ts'],
  synchronize: true,
});
