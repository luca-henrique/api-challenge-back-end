import express, {Request, Response} from 'express';
const pdfjs = require('pdfjs-dist');

import fs from 'fs';

const PDFDocument = require('pdf-lib').PDFDocument;
import multer from 'multer';

import {Lot} from './entity/Lot';
import {Invoice} from './entity/Invoice';

import {entityManager} from './data-source';
import {Between, ILike} from 'typeorm';

const papa = require('papaparse');

const results = [];
const options = {header: true, dynamicTyping: true};

const externalFinancialSystem = [
  {nome_unidade: 17},
  {nome_unidade: 18},
  {nome_unidade: 19},
];

const internalOrdinanceSystem = [
  {id: 3, nome_lote: '0017'},
  {id: 6, nome_lote: '0018'},
  {id: 7, nome_lote: '0019'},
];

const findLotByIdUnitInFinancialSystem = (id) => {
  const filterLotUnit = externalFinancialSystem.filter(
    (item) => item.nome_unidade === id,
  );
  return filterLotUnit[0];
};

const findByNameLotIdOrdinanceSystem = (id) => {
  const lotUnit = findLotByIdUnitInFinancialSystem(id);

  if (!lotUnit) {
    return null;
  }

  const ordinance = internalOrdinanceSystem.filter((item) => {
    let formatNameLot = parseInt(item.nome_lote);
    return formatNameLot === lotUnit.nome_unidade;
  });

  if (ordinance.length < 1) {
    return null;
  }

  return ordinance[0];
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({storage: storage});

const router = express.Router();

router.get('/invoice', async (req: Request, res: Response) => {
  try {
    const invoices = await readInvoice();
    return res.json(invoices);
  } catch (error) {}
});

router.post(
  '/read-invoice-csv',
  upload.single('files'),
  async (req: Request, res: Response) => {
    await fs
      .createReadStream(`${req.file.path}`, {encoding: 'utf-8'})
      .pipe(papa.parse(papa.NODE_STREAM_INPUT, options))
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        for (let index = 0; index < results.length; index++) {
          const invoice = results[index];

          let lot = findByNameLotIdOrdinanceSystem(invoice.unidade);

          if (!lot) {
            return;
          }

          let newLot = await addLot(invoice.unidade, invoice.nome);

          await addInvoice(
            invoice.nome,
            newLot.id,
            invoice.valor,
            invoice.linha_digitavel,
          );
        }

        return res.json({data: 'Feito'});
      });
  },
);

const addLot = async (id, name) => {
  const lotRepository = entityManager.getRepository(Lot);

  let newLot = await lotRepository.save({
    id,
    name,
    active: true,
  });

  return newLot;
};

const addInvoice = async (name_drawn, id_lot, value, digitable_line) => {
  const invoiceRepository = entityManager.getRepository(Invoice);

  let newInvoice = await invoiceRepository.save({
    nameDrawn: name_drawn,
    idLot: id_lot,
    value,
    digitableLine: digitable_line,
  });

  return newInvoice;
};

router.post(
  '/read-invoice-pdf',
  upload.single('files'),
  async (req: Request, res: Response) => {
    const {file} = req;

    await lerPDF(file.path);

    return res.json({data: 'foi'});
  },
);

function writePdfBytesToFile(fileName, pdfBytes) {
  return fs.promises.writeFile(fileName, pdfBytes);
}

const readInvoice = async () => {
  const invoiceRepository = await entityManager
    .getRepository(Invoice)
    .createQueryBuilder('lots')
    .leftJoinAndSelect('lots.idLot', 'invoices')
    .getMany();

  return invoiceRepository;
};

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

router.get('/invoices', async (req: Request, res: Response) => {
  try {
    var files = fs.readdirSync('./uploads');
    res.json(files);
  } catch (error) {}
});

router.get('/invoices/filters', async (req, res) => {
  const {nome, valor_inicial, valor_final, id_lote} = JSON.parse(
    JSON.stringify(req.query),
  );

  const invoiceRepository = await entityManager.getRepository(Invoice).find({
    where: {
      nameDrawn: ILike(`%${nome}%`),
      value: Between(valor_inicial, valor_final),
    },
    relations: {
      idLot: true,
    },
  });

  let invoicesByLotId = [];

  invoiceRepository.map((invoice) => {
    if (invoice.idLot.id == id_lote) {
      invoicesByLotId.push(invoice);
    }
  });

  var files = fs.readdirSync('./uploads');

  var filesFiltersByInvoiceId = [];

  files.map((file) => {
    let filesSplit = file.split('.');

    for (let index = 0; index < invoicesByLotId.length; index++) {
      const invoiceByLotId = invoicesByLotId[index];

      for (
        let positionFile = 0;
        positionFile < filesSplit.length;
        positionFile++
      ) {
        const fileSplit = filesSplit[positionFile];

        if (fileSplit == invoiceByLotId.id) {
          filesFiltersByInvoiceId.push(`${fileSplit}.pdf`);
        }
      }
    }
  });
  res.json(filesFiltersByInvoiceId);
});

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

var PdfPrinter = require('pdfmake');

const documentPdf = require('pdfkit-table');

router.get(
  '/invoice/report',
  upload.single('files'),
  async (req: Request, res: Response) => {
    const invoices = await readInvoice();

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

    let file = fs.createWriteStream('./document.pdf');

    let doc = new documentPdf({margin: 30, size: 'A4'});

    doc.pipe(file);

    // table
    const table = {
      title: 'Title',
      subtitle: 'Subtitle',
      headers: ['Country', 'Conversion rate', 'Trend'],
      rows: [
        ['Switzerland', '12%', '+1.12%'],
        ['France', '67%', '-0.98%'],
        ['England', '33%', '+4.44%'],
      ],
    };
    // A4 595.28 x 841.89 (portrait) (about width sizes)
    // width
    await doc.table(table, {
      width: 300,
    });
    // or columnsSize
    await doc.table(table, {
      columnsSize: [200, 100, 100],
    });
    // done!
    doc.pipe(res);

    doc.end();
  },
);

router.get('/gerar-pdf', async (req, res) => {
  const subDocument = await PDFDocument.create();

  const page = subDocument.addPage();

  const invoices = await readInvoice();

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
    page.drawText(`${invoice.value}`, {x: 240, y: 770 - 20 * index, size: 12});
    page.drawText(invoice.digitableLine, {
      x: 290,
      y: 770 - 20 * index,
      size: 12,
    });
  });

  const pdfBytes = await subDocument.save();

  res.type('application/pdf');
  res.header('Content-Disposition', `attachment; filename="${1}.pdf"`);
  res.send(Buffer.from(pdfBytes, 'base64'));
});

export {router};
