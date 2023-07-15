import {Request, Response} from 'express';
import {ReadInvoiceCSVService} from '../services/ReadInvoiceCSVService';

export class ReadInvoiceCSVController {
  async handle(request: Request, response: Response) {
    await new ReadInvoiceCSVService().execute(request.file.path);

    return response.json({data: 'Foi'});
  }
}
