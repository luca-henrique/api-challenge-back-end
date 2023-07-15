import {GetAllInvoiceService} from './GetAllInvoicesService';
const PDFDocument = require('pdf-lib').PDFDocument;
export class GenereteInvoiceReportService {
  async execute() {
    const subDocument = await PDFDocument.create();

    const page = subDocument.addPage();

    const invoices = await new GetAllInvoiceService().execute();

    let bodyPdfInvoiceReport = [];

    invoices.map((invoice) => {
      bodyPdfInvoiceReport.push([
        invoice.id,
        invoice.nameDrawn,
        invoice.idLot.id,
        invoice.value,
        invoice.digitableLine,
      ]);
    });

    page.drawText('id', {x: 20, y: 800, size: 18});
    page.drawText('nome_sacado', {x: 50, y: 800, size: 18});
    page.drawText('id_lote', {x: 180, y: 800, size: 18});
    page.drawText('valor', {x: 240, y: 800, size: 18});
    page.drawText('linha_digitavel', {x: 290, y: 800, size: 18});

    invoices.map((invoice, index) => {
      page.drawText(invoice.id, {x: 20, y: 770 - 20 * index, size: 12});
      page.drawText(invoice.nameDrawn, {x: 50, y: 770 - 20 * index, size: 12});
      page.drawText(`${invoice.idLot.id}`, {
        x: 180,
        y: 770 - 20 * index,
        size: 12,
      });
      page.drawText(`${invoice.value}`, {
        x: 240,
        y: 770 - 20 * index,
        size: 12,
      });
      page.drawText(invoice.digitableLine, {
        x: 290,
        y: 770 - 20 * index,
        size: 12,
      });
    });

    const pdfBytes = await subDocument.save();

    return pdfBytes;
  }
}
