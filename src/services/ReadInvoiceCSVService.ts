import fs from 'fs';

import papa from 'papaparse';
import {findByNameLotIdOrdinanceSystem} from '../routes';
import {CreateInvoiceService} from './CreateInvoiceService';
import {CreateLotService} from './CreateLotService';
const options = {header: true, dynamicTyping: true};
const results = [];

export class ReadInvoiceCSVService {
  async execute(file) {
    await fs
      .createReadStream(`${file}`, {encoding: 'utf-8'})
      .pipe(papa.parse(papa.NODE_STREAM_INPUT, options))
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        for (let index = 0; index < results.length; index++) {
          const invoice = results[index];

          let lot = findByNameLotIdOrdinanceSystem(invoice.unidade);

          if (!lot) {
            return;
          }

          let newLot = await new CreateLotService().execute({
            name: invoice.nome,
          });

          await new CreateInvoiceService().execute({
            name_drawn: invoice.nome,
            id_lot: newLot.id,
            value: invoice.valor,
            digitable_line: invoice.linha_digitavel,
          });
        }
      });
  }
}
