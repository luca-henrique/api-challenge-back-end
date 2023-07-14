import express, {Request, Response} from 'express';
const pdfjs = require('pdfjs-dist');

import fs from 'fs';

const PDFDocument = require('pdf-lib').PDFDocument;
import multer from 'multer';

import {Lot} from './entity/Lot';
import {Invoice} from './entity/Invoice';

import {entityManager} from './data-source';

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

router.get('/invoices', async (req: Request, res: Response) => {
  try {
    const {nome, valor_final, valor_inicial, id_lote} = req.params;

    console.log(nome);

    var files = fs.readdirSync('./uploads');

    res.json(files);
  } catch (error) {}
});

router.get(
  '/invoices/:nome&:valor_inicial&:valor_final&:id_lote',
  async (req: Request, res: Response) => {
    try {
      const {nome, valor_final, valor_inicial, id_lote} = req.params;
      console.log(nome);
      console.log(valor_final);

      var files = fs.readdirSync('./uploads');

      res.json(files);
    } catch (error) {}
  },
);

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

export {router};
