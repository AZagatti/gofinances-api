import { getCustomRepository } from 'typeorm';

import AppError from '../errors/AppError';

import TransactionsRepository from '../repositories/TransactionsRepository';
import Transaction from '../models/Transaction';
import CreateCategoryService from './CreateCategoryService';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
  noImport?: boolean;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
    noImport = false,
  }: Request): Promise<Transaction> {
    const transactionRepository = getCustomRepository(TransactionsRepository);

    const { total } = await transactionRepository.getBalance();

    if (type === 'outcome' && value > total && noImport) {
      throw new AppError(
        'The withdrawal amount cannot be greater than the total',
      );
    }

    const createCategoryService = new CreateCategoryService();
    const newCategory = await createCategoryService.execute(category);

    const transaction = transactionRepository.create({
      title,
      value,
      type,
      category_id: newCategory.id,
    });

    await transactionRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
