import {entityManager} from '../data-source';
import {Invoice} from '../entity/Invoice';

export class CreateInvoiceService {
  async execute({name_drawn, id_lot, value, digitable_line}) {
    const invoiceRepository = entityManager.getRepository(Invoice);

    let newInvoice = await invoiceRepository.save({
      nameDrawn: name_drawn,
      idLot: id_lot,
      value,
      digitableLine: digitable_line,
    });

    return newInvoice;
  }
}
