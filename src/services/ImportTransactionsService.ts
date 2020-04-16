import csvParse from 'csv-parse';
import { promisify } from 'util';

import CreateTransactionService from './CreateTransactionService';
import CreateCategoryService from './CreateCategoryService';
import Transaction from '../models/Transaction';
import AppError from '../errors/AppError';

interface Request {
  file: Express.Multer.File;
}

interface TransactionCsv {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class ImportTransactionsService {
  async execute({ file }: Request): Promise<Transaction[]> {
    const createTransactionService = new CreateTransactionService();
    const createCategoryService = new CreateCategoryService();

    const parser = promisify(csvParse);
    const parsedTransactions: TransactionCsv[] = await parser(file.buffer, {
      delimiter: ',',
      columns: true,
      trim: true,
    });

    if (!parsedTransactions) {
      throw new AppError('Error reading CSV');
    }

    const categories = Array.from(
      new Set(parsedTransactions.map(transac => transac.category)),
    );

    await Promise.all(
      categories.map(async category => createCategoryService.execute(category)),
    );

    const transactions = await Promise.all(
      parsedTransactions.map(async transac => {
        const { title, type, value, category } = transac;

        return createTransactionService.execute({
          title,
          type,
          value,
          category: (category as unknown) as string,
        });
      }),
    );

    return transactions;
  }
}

export default ImportTransactionsService;
