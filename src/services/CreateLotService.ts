import {entityManager} from '../data-source';
import {Invoice} from '../entity/Invoice';
import {Lot} from '../entity/Lot';

export class CreateLotService {
  async execute({name}) {
    const lotRepository = entityManager.getRepository(Lot);

    let newLot = await lotRepository.save({
      name,
      active: true,
    });

    return newLot;
  }
}
