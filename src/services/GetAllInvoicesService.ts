import {entityManager} from '../data-source';
import {Invoice} from '../entity/Invoice';

export class GetAllInvoiceService {
  async execute() {
    const invoiceRepository = await entityManager
      .getRepository(Invoice)
      .createQueryBuilder('lots')
      .leftJoinAndSelect('lots.idLot', 'invoices')
      .getMany();

    return invoiceRepository;
  }
}
