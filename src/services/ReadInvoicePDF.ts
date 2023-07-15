import {entityManager} from '../data-source';
import {Invoice} from '../entity/Invoice';
const pdfjs = require('pdfjs-dist');

const PDFDocument = require('pdf-lib').PDFDocument;
import fs from 'fs';

export class ReadInvoicePdfService {
  async execute(file) {
    await lerPDF(file);
  }
}

async function lerPDF(arquivoPDF) {
  const data = new Uint8Array(fs.readFileSync(arquivoPDF));

  const docmentAsBytes = await fs.promises.readFile(arquivoPDF);
  const pdfDoc = await PDFDocument.load(docmentAsBytes);

  const loadingTask = pdfjs.getDocument(data);
  const pdf = await loadingTask.promise;

  const numPages = pdf.numPages;

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map((item) => item.str).join(' ');

    let digitableLine = '';
    text.split(' ').map((item) => {
      if (isOnlyNumbers(item)) {
        digitableLine = item;
      }
    });

    const invoiceRepository = await entityManager
      .getRepository(Invoice)
      .findBy({
        digitableLine,
      });

    const subDocument = await PDFDocument.create();

    const [copiedPage] = await subDocument.copyPages(pdfDoc, [i - 1]);
    subDocument.addPage(copiedPage);
    const pdfBytes = await subDocument.save();
    await writePdfBytesToFile(
      `./uploads/${invoiceRepository[0].id}.pdf`,
      pdfBytes,
    );
  }
}

function isOnlyNumbers(string) {
  return /^\d+$/.test(string);
}

function writePdfBytesToFile(fileName, pdfBytes) {
  return fs.promises.writeFile(fileName, pdfBytes);
}
