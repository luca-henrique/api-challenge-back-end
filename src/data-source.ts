import 'reflect-metadata';
import {DataSource} from 'typeorm';
import {Lot} from './entity/Lot';
import {Invoice} from './entity/Invoice';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'root',
  database: 'challenge',
  synchronize: true,
  logging: true,
  entities: [Lot, Invoice],
  migrations: ['./src/migration'],
  subscribers: [],
});

export const entityManager = AppDataSource.manager;

const Connections = () => {
  AppDataSource.initialize()
    .then(() => {
      console.log('wefwefwef');
    })
    .catch((err) => {
      console.log(err);
    });
};

export {Connections};
