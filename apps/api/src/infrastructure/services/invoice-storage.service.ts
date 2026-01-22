import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { promises as fs } from 'fs';
import path from 'path';

@Injectable()
export class InvoiceStorageService {
  private readonly basePath: string;

  constructor() {
    this.basePath = path.resolve(process.cwd(), 'storage', 'invoices');
  }

  async saveInvoicePdf(invoiceNumber: string, buffer: Buffer): Promise<string> {
    try {
      await fs.mkdir(this.basePath, { recursive: true });
      const filePath = path.join(this.basePath, `${invoiceNumber}.pdf`);
      await fs.writeFile(filePath, buffer);
      return filePath;
    } catch (error) {
      throw new InternalServerErrorException('Failed to store invoice PDF');
    }
  }

  async readInvoicePdf(filePath: string): Promise<Buffer> {
    try {
      return await fs.readFile(filePath);
    } catch (error) {
      throw new InternalServerErrorException('Invoice PDF not found');
    }
  }
}
