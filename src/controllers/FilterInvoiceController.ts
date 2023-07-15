import {FilterInvoiceService} from '../services/FilterInvoiceService';
import {Request, Response} from 'express';

export class FilterInvoiceController {
  async handle(request: Request, response: Response) {
    const filtersInvoice = await new FilterInvoiceService().execute(
      request.query,
    );

    response.json(filtersInvoice);
  }
}
