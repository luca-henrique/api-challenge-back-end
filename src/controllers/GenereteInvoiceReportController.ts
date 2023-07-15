const PDFDocument = require('pdf-lib').PDFDocument;
import {Request, Response} from 'express';
import {GenereteInvoiceReportService} from '../services/GenereteInvoiceReportService';
export class GenereteInvoiceController {
  async handle(request: Request, response: Response) {
    const pdfFile = await new GenereteInvoiceReportService().execute();

    response.type('application/pdf');
    response.header('Content-Disposition', `attachment; filename="${1}.pdf"`);
    response.send(Buffer.from(pdfFile, 'base64'));
  }
}
