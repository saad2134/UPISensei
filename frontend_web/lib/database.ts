// lib/database.ts
export interface Transaction {
  id: string;
  userId: string;
  date: Date;
  description: string;
  amount: number;
  category: string;
  type: 'debit' | 'credit';
  merchant?: string;
  bank?: string;
}

export interface ProcessedFile {
  id: string;
  userId: string;
  filename: string;
  originalName: string;
  fileType: string;
  processedData: Transaction[];
  uploadedAt: Date;
}

// Demo user data
const demoTransactions: Transaction[] = [
  {
    id: '1',
    userId: 'demo-user',
    date: new Date('2024-01-15'),
    description: 'SWIGGY INSTAMART',
    amount: 845.50,
    category: 'Food & Dining',
    type: 'debit',
    merchant: 'Swiggy'
  },
  {
    id: '2',
    userId: 'demo-user',
    date: new Date('2024-01-14'),
    description: 'AMAZON IN',
    amount: 2499.00,
    category: 'Shopping',
    type: 'debit',
    merchant: 'Amazon'
  },
  {
    id: '3',
    userId: 'demo-user',
    date: new Date('2024-01-13'),
    description: 'UBER TRIP',
    amount: 356.00,
    category: 'Transportation',
    type: 'debit',
    merchant: 'Uber'
  },
  {
    id: '4',
    userId: 'demo-user',
    date: new Date('2024-01-12'),
    description: 'SALARY CREDIT',
    amount: 75000.00,
    category: 'Income',
    type: 'credit',
    merchant: 'Company'
  },
  {
    id: '5',
    userId: 'demo-user',
    date: new Date('2024-01-11'),
    description: 'NETFLIX SUBSCRIPTION',
    amount: 649.00,
    category: 'Entertainment',
    type: 'debit',
    merchant: 'Netflix'
  },
  {
    id: '6',
    userId: 'demo-user',
    date: new Date('2024-01-10'),
    description: 'ZOMATO ORDER',
    amount: 1200.00,
    category: 'Food & Dining',
    type: 'debit',
    merchant: 'Zomato'
  },
  {
    id: '7',
    userId: 'demo-user',
    date: new Date('2024-01-09'),
    description: 'MYNTRA FASHION',
    amount: 3500.00,
    category: 'Shopping',
    type: 'debit',
    merchant: 'Myntra'
  },
  {
    id: '8',
    userId: 'demo-user',
    date: new Date('2024-01-08'),
    description: 'BIGBASKET GROCERIES',
    amount: 2800.00,
    category: 'Groceries',
    type: 'debit',
    merchant: 'BigBasket'
  }
];

// In-memory storage for demo (replace with real DB in production)
let transactions: Transaction[] = [...demoTransactions];
let processedFiles: ProcessedFile[] = [];

export const database = {
  // Transaction methods
  getTransactions: (userId: string): Transaction[] => {
    return transactions.filter(t => t.userId === userId);
  },
  
  addTransactions: (newTransactions: Transaction[]): void => {
    transactions.push(...newTransactions);
  },
  
  // File methods
  saveProcessedFile: (file: Omit<ProcessedFile, 'id'>): string => {
    const id = `file_${Date.now()}`;
    const newFile: ProcessedFile = { ...file, id };
    processedFiles.push(newFile);
    return id;
  },
  
  getProcessedFile: (fileId: string): ProcessedFile | undefined => {
    return processedFiles.find(f => f.id === fileId);
  },
  
  getUserFiles: (userId: string): ProcessedFile[] => {
    return processedFiles.filter(f => f.userId === userId);
  }
};