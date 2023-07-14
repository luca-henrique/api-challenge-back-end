import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  BaseEntity,
} from 'typeorm';

@Entity({name: 'lots'})
export class Lot extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id: string;

  @Column()
  name: string;

  @Column()
  active: boolean;

  @CreateDateColumn()
  create_at: Date;

  @CreateDateColumn()
  updated_at: Date;
}
