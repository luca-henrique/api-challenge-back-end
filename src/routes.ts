import express from 'express';

const PDFDocument = require('pdf-lib').PDFDocument;
import multer from 'multer';

import {GetAllInvoicesController} from './controllers/GetAllInvoicesController';
import {ReadInvoiceCSVController} from './controllers/ReadInvoiceCSVController';
import {ReadInvoicePDFController} from './controllers/ReadInvoicePDFController';
import {ReadInvoiceFileController} from './controllers/ReadInvoiceFileController';
import {FilterInvoiceController} from './controllers/FilterInvoiceController';
import {GenereteInvoiceController} from './controllers/GenereteInvoiceReportController';

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

export const findByNameLotIdOrdinanceSystem = (id) => {
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

router.get('/invoice', new GetAllInvoicesController().handle);

router.post(
  '/read-invoice-csv',
  upload.single('files'),
  new ReadInvoiceCSVController().handle,
);

router.post(
  '/read-invoice-pdf',
  upload.single('files'),
  new ReadInvoicePDFController().handle,
);

router.get('/invoices', new ReadInvoiceFileController().handle);

router.get('/invoices/filters', new FilterInvoiceController().handle);

router.get('/invoice/report', new GenereteInvoiceController().handle);

export {router};
