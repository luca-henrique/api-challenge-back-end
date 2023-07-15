import {Between, ILike} from 'typeorm';
import {entityManager} from '../data-source';
import {Invoice} from '../entity/Invoice';
import fs from 'fs';

export class FilterInvoiceService {
  async execute(params) {
    const {nome, valor_inicial, valor_final, id_lote} = JSON.parse(
      JSON.stringify(params),
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
    return filesFiltersByInvoiceId;
  }
}
