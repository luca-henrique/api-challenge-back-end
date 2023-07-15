import fs from 'fs';

export class ReadInvoiceFileService {
  async execute() {
    var files = fs.readdirSync('./uploads');
    return files;
  }
}
