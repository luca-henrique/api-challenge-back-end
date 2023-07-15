import {Request, Response} from 'express';
import {ReadInvoiceFileService} from '../services/ReadInvoiceFileService';

export class ReadInvoiceFileController {
  async handle(request: Request, response: Response) {
    const invoices = await new ReadInvoiceFileService().execute();

    response.json(invoices);
  }
}
