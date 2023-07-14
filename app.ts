import express from 'express';
import {router} from './src/routes';

import {Connections} from './src/data-source';

Connections();
const app = express();
app.use(router);

app.use(express.json());
app.use(express.urlencoded({extended: true}));

const path = require('path');

const PORT = 3000;

app.listen(PORT, () => {
  console.log('server is Running');
});

app.get('/public', express.static('./uploads'));
