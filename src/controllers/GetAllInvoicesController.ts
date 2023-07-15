import {Request, Response} from 'express';
import {GetAllInvoiceService} from '../services/GetAllInvoicesService';

export class GetAllInvoicesController {
  async handle(request: Request, response: Response) {
    const invoiceService = await new GetAllInvoiceService().execute();

    return response.json(invoiceService);
  }
}
