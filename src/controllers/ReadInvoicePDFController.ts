import {Request, Response} from 'express';
import {ReadInvoicePdfService} from '../services/ReadInvoicePDF';

export class ReadInvoicePDFController {
  async handle(request: Request, response: Response) {
    await new ReadInvoicePdfService().execute(request.file.path);

    return response.json({data: 'Foi'});
  }
}
