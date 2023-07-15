import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  BaseEntity,
} from 'typeorm';
import {Lot} from './Lot';

@Entity({name: 'invoices'})
export class Invoice extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({name: 'name_drawn'})
  nameDrawn: string;

  @OneToOne(() => Lot)
  @JoinColumn({name: 'id_lot'})
  idLot: Lot;

  @Column('decimal', {precision: 5, scale: 2})
  value: number;

  @Column({name: 'digitable_line'})
  digitableLine: string;

  @CreateDateColumn()
  create_at: Date;
}
