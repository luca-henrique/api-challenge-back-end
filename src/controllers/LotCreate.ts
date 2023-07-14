import {Request, Response} from 'express';

export const lotCreate = {
  create: async (req: Request, res: Response, next) => {
    let data = [];
    res.json(data);
  },
};
