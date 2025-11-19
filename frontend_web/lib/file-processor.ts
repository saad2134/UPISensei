// lib/file-processor.ts - Enhanced with demo data fallback
import { parse } from 'csv-parse/sync';
import { Transaction } from './database';
import { OCRService } from './ocr-service';

// Demo transaction data for fallback
const DEMO_TRANSACTIONS: Partial<Transaction>[] = [
  {
    description: "Swiggy Food Order",
    amount: 450.00,
    type: "debit" as const,
    category: "Food & Dining",
    merchant: "Swiggy"
  },
  {
    description: "Amazon Shopping",
    amount: 2499.00,
    type: "debit" as const,
    category: "Shopping",
    merchant: "Amazon"
  },
  {
    description: "Salary Credit",
    amount: 75000.00,
    type: "credit" as const,
    category: "Income",
    merchant: "Company"
  },
  {
    description: "Uber Ride",
    amount: 320.00,
    type: "debit" as const,
    category: "Transportation",
    merchant: "Uber"
  },
  {
    description: "Netflix Subscription",
    amount: 649.00,
    type: "debit" as const,
    category: "Entertainment",
    merchant: "Netflix"
  },
  {
    description: "BigBasket Groceries",
    amount: 1850.00,
    type: "debit" as const,
    category: "Groceries",
    merchant: "Bigbasket"
  },
  {
    description: "Zomato Food Delivery",
    amount: 680.00,
    type: "debit" as const,
    category: "Food & Dining",
    merchant: "Zomato"
  },
  {
    description: "Electricity Bill Payment",
    amount: 1200.00,
    type: "debit" as const,
    category: "Utilities",
    merchant: "Electricity"
  },
  {
    description: "Medical Checkup",
    amount: 1500.00,
    type: "debit" as const,
    category: "Healthcare",
    merchant: "Hospital"
  },
  {
    description: "Freelance Payment",
    amount: 12000.00,
    type: "credit" as const,
    category: "Income",
    merchant: "Client"
  }
];

export class FileProcessor {
  private ocrService = new OCRService();
  private useDemoData = false;

  async processPDF(fileBuffer: Buffer, filename: string): Promise<Transaction[]> {
    try {
      console.log('Processing PDF with production OCR:', filename);
      
      // Extract text from PDF using OCR
      const text = await this.ocrService.extractTextFromPDF(fileBuffer, filename);
      
      console.log('OCR text extracted, length:', text.length);
      
      if (!text.trim()) {
        console.warn('No text extracted from PDF, using demo data');
        return this.generateDemoTransactions(filename, 'pdf');
      }
      
      // Parse transactions from OCR text
      const transactions = this.parseTransactionsFromOCRText(text, filename);
      console.log('Parsed transactions from PDF:', transactions.length);
      
      if (transactions.length === 0) {
        console.warn('No transactions found in PDF, using demo data');
        return this.generateDemoTransactions(filename, 'pdf');
      }
      
      return transactions;
    } catch (error: any) {
      console.error('PDF processing error, using demo data:', error);
      return this.generateDemoTransactions(filename, 'pdf');
    }
  }

  async processCSV(fileBuffer: Buffer, filename: string): Promise<Transaction[]> {
    try {
      console.log('Processing CSV file:', filename);
      const content = fileBuffer.toString('utf8');
      
      // Check if file has minimal content
      if (content.length < 10) {
        console.warn('CSV file too small, using demo data');
        return this.generateDemoTransactions(filename, 'csv');
      }
      
      const records = parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_quotes: true,
        relax_column_count: true,
        bom: true
      });

      console.log('CSV records parsed:', records.length);
      
      if (records.length === 0) {
        console.warn('No records found in CSV, trying without headers');
        const transactions = this.parseCSVWithoutHeaders(content, filename);
        if (transactions.length > 0) {
          return transactions;
        }
        console.warn('Using demo data as fallback');
        return this.generateDemoTransactions(filename, 'csv');
      }
      
      const transactions = this.parseCSVRecords(records, filename);
      console.log('Processed transactions from CSV:', transactions.length);
      
      if (transactions.length === 0) {
        console.warn('No valid transactions found in CSV, using demo data');
        return this.generateDemoTransactions(filename, 'csv');
      }
      
      return transactions;
    } catch (error: any) {
      console.error('CSV processing error, using demo data:', error);
      return this.generateDemoTransactions(filename, 'csv');
    }
  }

  private generateDemoTransactions(filename: string, source: 'pdf' | 'csv'): Transaction[] {
    console.log('Generating demo transactions for:', filename);
    this.useDemoData = true;
    
    const now = new Date();
    const transactions: Transaction[] = [];
    
    DEMO_TRANSACTIONS.forEach((demo, index) => {
      const transactionDate = new Date(now);
      transactionDate.setDate(transactionDate.getDate() - (DEMO_TRANSACTIONS.length - index));
      
      transactions.push({
        id: `${source}_demo_${Date.now()}_${index}`,
        userId: 'demo-user',
        date: transactionDate,
        description: demo.description || 'Demo Transaction',
        amount: demo.amount || 0,
        category: demo.category || 'Other',
        type: demo.type || 'debit',
        merchant: demo.merchant || 'Unknown',
        bank: this.extractBankName(filename),
        isDemo: true
      });
    });
    
    console.log('Generated demo transactions:', transactions.length);
    return transactions;
  }

  private parseCSVWithoutHeaders(content: string, filename: string): Transaction[] {
    try {
      console.log('Trying to parse CSV without headers');
      
      const records = parse(content, {
        skip_empty_lines: true,
        trim: true,
        relax_quotes: true,
        relax_column_count: true,
        skip_records_with_error: true
      });

      console.log('Raw records found (no headers):', records.length);
      
      const transactions: Transaction[] = [];
      const now = new Date();

      records.forEach((record: any[], index: number) => {
        try {
          if (!record || record.length === 0) return;

          let description = 'Transaction';
          let amount = 0;
          let dateStr = '';

          for (let i = 0; i < record.length; i++) {
            const cell = String(record[i] || '').trim();
            if (!cell) continue;

            const amountMatch = cell.match(/-?\d+\.?\d*/);
            if (amountMatch && !amount) {
              const potentialAmount = parseFloat(amountMatch[0]);
              if (!isNaN(potentialAmount) && Math.abs(potentialAmount) > 0.01) {
                amount = Math.abs(potentialAmount);
                continue;
              }
            }

            const dateMatch = cell.match(/\d{1,4}[\/\-\.]\d{1,4}[\/\-\.]\d{1,4}/);
            if (dateMatch && !dateStr) {
              dateStr = cell;
              continue;
            }

            if (cell.length > description.length && cell.length > 5) {
              description = cell;
            }
          }

          if (amount > 0.01) {
            let transactionDate: Date;
            
            try {
              if (dateStr) {
                transactionDate = new Date(dateStr);
                if (isNaN(transactionDate.getTime())) {
                  throw new Error('Invalid date');
                }
              } else {
                transactionDate = new Date(now);
                transactionDate.setDate(transactionDate.getDate() - (records.length - index));
              }
            } catch {
              transactionDate = new Date(now);
              transactionDate.setDate(transactionDate.getDate() - (records.length - index));
            }

            transactions.push({
              id: `csv_${Date.now()}_${index}`,
              userId: 'demo-user',
              date: transactionDate,
              description: description.substring(0, 200),
              amount: parseFloat(amount.toFixed(2)),
              category: this.categorizeTransaction(description),
              type: amount > 0 ? 'debit' : 'credit',
              merchant: this.extractMerchant(description),
              bank: this.extractBankName(filename)
            });
          }
        } catch (error) {
          console.warn('Failed to parse CSV record without headers:', record, error);
        }
      });

      console.log('Transactions parsed without headers:', transactions.length);
      return transactions.slice(0, 100);
    } catch (error) {
      console.error('Failed to parse CSV without headers:', error);
      return [];
    }
  }

  private parseTransactionsFromOCRText(text: string, filename: string): Transaction[] {
    const lines = text.split('\n').filter(line => {
      const trimmed = line.trim();
      return trimmed.length > 10 && 
             !trimmed.startsWith('--- Page') && 
             !trimmed.match(/^\d+\s*$/);
    });
    
    const transactions: Transaction[] = [];
    const transactionsMap = new Map();
    
    console.log('OCR lines to process:', lines.length);

    const transactionPatterns = [
      /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\s+(.*?)\s+([₹$]?\s*-?\s*\d{1,3}(?:,\d{3})*\.?\d{0,2})/i,
      /(UPI[\/\-].*?[\/\-].*?[\/\-].*?)\s+([₹$]?\s*-?\s*\d{1,3}(?:,\d{3})*\.?\d{0,2})/i,
      /(POS\s+\d+\s+.*?)\s+([₹$]?\s*-?\s*\d{1,3}(?:,\d{3})*\.?\d{0,2})/i,
      /((?:NEFT|IMPS|RTGS).*?)\s+([₹$]?\s*-?\s*\d{1,3}(?:,\d{3})*\.?\d{0,2})/i,
    ];

    lines.forEach((line, lineIndex) => {
      let transactionFound = false;
      
      for (const pattern of transactionPatterns) {
        const match = line.match(pattern);
        if (match) {
          const description = match[2] ? match[2].trim() : match[1].trim();
          const amountStr = match[3] || match[2];
          
          if (description && amountStr) {
            const cleanAmount = this.parseAmount(amountStr);
            
            if (!isNaN(cleanAmount) && Math.abs(cleanAmount) > 0.1 && description.length > 5) {
              const key = `${description}-${cleanAmount}-${lineIndex}`;
              
              if (!transactionsMap.has(key)) {
                const type = this.determineTransactionTypeFromText(description, cleanAmount);
                const category = this.categorizeTransaction(description);
                const merchant = this.extractMerchant(description);
                
                transactionsMap.set(key, {
                  description,
                  amount: Math.abs(cleanAmount),
                  type,
                  category,
                  merchant,
                  lineIndex
                });
                transactionFound = true;
                break;
              }
            }
          }
        }
      }
      
      if (!transactionFound) {
        const amountMatches = line.match(/([₹$]?\s*-?\s*\d{1,3}(?:,\d{3})*\.?\d{0,2})/g);
        if (amountMatches && amountMatches.length > 0) {
          const amounts = amountMatches.map(amt => Math.abs(this.parseAmount(amt)));
          const maxAmount = Math.max(...amounts);
          const maxAmountIndex = amounts.indexOf(maxAmount);
          const amountStr = amountMatches[maxAmountIndex];
          
          if (maxAmount > 0.1) {
            const description = line.replace(amountStr, '').trim();
            if (description.length > 5) {
              const key = `${description}-${maxAmount}-${lineIndex}`;
              if (!transactionsMap.has(key)) {
                const type = this.determineTransactionTypeFromText(description, this.parseAmount(amountStr));
                const category = this.categorizeTransaction(description);
                const merchant = this.extractMerchant(description);
                
                transactionsMap.set(key, {
                  description,
                  amount: maxAmount,
                  type,
                  category,
                  merchant,
                  lineIndex
                });
              }
            }
          }
        }
      }
    });

    const transactionList = Array.from(transactionsMap.values())
      .sort((a, b) => a.lineIndex - b.lineIndex);

    const now = new Date();
    transactionList.forEach((txn, index) => {
      const transactionDate = new Date(now);
      transactionDate.setDate(transactionDate.getDate() - (transactionList.length - index));
      
      transactions.push({
        id: `pdf_${Date.now()}_${index}`,
        userId: 'demo-user',
        date: transactionDate,
        description: txn.description.substring(0, 200),
        amount: parseFloat(txn.amount.toFixed(2)),
        category: txn.category,
        type: txn.type,
        merchant: txn.merchant,
        bank: this.extractBankName(filename)
      });
    });

    console.log('Final transactions found:', transactions.length);
    return transactions.slice(0, 100);
  }

  private parseCSVRecords(records: any[], filename: string): Transaction[] {
    const transactions: Transaction[] = [];
    const now = new Date();
    
    console.log('Available columns in CSV:', records.length > 0 ? Object.keys(records[0]) : 'none');

    records.forEach((record, index) => {
      try {
        if (index === 0) {
          console.log('First record structure:', record);
        }

        const possibleDescriptionFields = [
          'description', 'Description', 'DESCRIPTION', 'narration', 'Narration', 'NARRATION',
          'remarks', 'Remarks', 'REMARKS', 'particulars', 'Particulars', 'PARTICULARS',
          'transaction', 'Transaction', 'TRANSACTION', 'detail', 'Detail', 'DETAIL'
        ];

        const possibleAmountFields = [
          'amount', 'Amount', 'AMOUNT', 'transaction_amount', 'Transaction_Amount', 'TRANSACTION_AMOUNT',
          'debit', 'Debit', 'DEBIT', 'credit', 'Credit', 'CREDIT', 'withdrawal', 'Withdrawal', 'WITHDRAWAL'
        ];

        const possibleDateFields = [
          'date', 'Date', 'DATE', 'transaction_date', 'Transaction_Date', 'TRANSACTION_DATE',
          'txn_date', 'Txn_Date', 'TXN_DATE', 'value_date', 'Value_Date', 'VALUE_DATE'
        ];

        let description = 'Transaction';
        let amountStr = '0';
        let dateStr = now.toISOString().split('T')[0];
        
        for (const field of possibleDescriptionFields) {
          if (record[field] !== undefined && record[field] !== null && record[field] !== '') {
            description = String(record[field]);
            break;
          }
        }
        
        for (const field of possibleAmountFields) {
          if (record[field] !== undefined && record[field] !== null && record[field] !== '') {
            amountStr = String(record[field]);
            break;
          }
        }
        
        for (const field of possibleDateFields) {
          if (record[field] !== undefined && record[field] !== null && record[field] !== '') {
            dateStr = String(record[field]);
            break;
          }
        }

        const cleanAmountStr = amountStr.toString()
          .replace(/[₹$,]/g, '')
          .replace(/\s/g, '')
          .replace(/\(.*\)/, '')
          .trim();

        const amount = Math.abs(parseFloat(cleanAmountStr));
        const type = this.determineTransactionType(record, amountStr);
        
        if (!isNaN(amount) && amount > 0.01) {
          let transactionDate: Date;
          
          try {
            transactionDate = new Date(dateStr);
            if (isNaN(transactionDate.getTime())) {
              transactionDate = new Date(now);
              transactionDate.setDate(transactionDate.getDate() - (records.length - index));
            }
          } catch {
            transactionDate = new Date(now);
            transactionDate.setDate(transactionDate.getDate() - (records.length - index));
          }
          
          transactions.push({
            id: `csv_${Date.now()}_${index}`,
            userId: 'demo-user',
            date: transactionDate,
            description: description.substring(0, 200),
            amount: parseFloat(amount.toFixed(2)),
            category: this.categorizeTransaction(description),
            type: type,
            merchant: this.extractMerchant(description),
            bank: this.extractBankName(filename)
          });
        }
      } catch (error) {
        console.warn(`Failed to parse CSV record ${index}:`, record, error);
      }
    });
    
    console.log(`Successfully parsed ${transactions.length} transactions from CSV`);
    return transactions.slice(0, 100);
  }

  // Helper methods remain the same
  private parseAmount(amountStr: string): number {
    const cleanStr = amountStr.replace(/[₹$,]/g, '').replace(/\s/g, '').trim();
    return parseFloat(cleanStr);
  }

  private determineTransactionTypeFromText(description: string, amount: number): 'debit' | 'credit' {
    const desc = description.toLowerCase();
    
    if (desc.includes('credit') || desc.includes('salary') || desc.includes('deposit') || 
        desc.includes('refund') || desc.includes('interest')) {
      return 'credit';
    }
    
    if (desc.includes('debit') || desc.includes('payment') || desc.includes('withdrawal') ||
        desc.includes('purchase') || desc.includes('pos') || desc.includes('upi')) {
      return 'debit';
    }
    
    return amount < 0 ? 'debit' : 'credit';
  }

  private categorizeTransaction(description: string): string {
    const desc = description.toLowerCase();
    
    if (desc.includes('swiggy') || desc.includes('zomato') || desc.includes('food') || desc.includes('restaurant')) {
      return 'Food & Dining';
    } else if (desc.includes('amazon') || desc.includes('flipkart') || desc.includes('myntra') || desc.includes('shopping')) {
      return 'Shopping';
    } else if (desc.includes('uber') || desc.includes('ola') || desc.includes('taxi') || desc.includes('fuel')) {
      return 'Transportation';
    } else if (desc.includes('bigbasket') || desc.includes('grocery')) {
      return 'Groceries';
    } else if (desc.includes('netflix') || desc.includes('prime') || desc.includes('movie')) {
      return 'Entertainment';
    } else if (desc.includes('electricity') || desc.includes('water') || desc.includes('bill')) {
      return 'Utilities';
    } else if (desc.includes('salary') || desc.includes('credit') || desc.includes('income')) {
      return 'Income';
    } else if (desc.includes('medical') || desc.includes('hospital')) {
      return 'Healthcare';
    } else {
      return 'Other';
    }
  }

  private extractMerchant(description: string): string {
    const desc = description.toLowerCase();
    const merchants = ['swiggy', 'zomato', 'amazon', 'flipkart', 'myntra', 'uber', 'ola', 'netflix', 'bigbasket'];
    
    for (const merchant of merchants) {
      if (desc.includes(merchant)) {
        return merchant.charAt(0).toUpperCase() + merchant.slice(1);
      }
    }
    
    return 'Unknown';
  }

  private extractBankName(filename: string): string {
    const name = filename.toLowerCase();
    if (name.includes('hdfc')) return 'HDFC Bank';
    if (name.includes('icici')) return 'ICICI Bank';
    if (name.includes('sbi')) return 'SBI';
    if (name.includes('axis')) return 'Axis Bank';
    return 'Bank';
  }

  private determineTransactionType(record: any, amountStr: string): 'debit' | 'credit' {
    const str = amountStr.toString().toLowerCase();
    
    if (record.type === 'debit' || record.debit || str.includes('debit') || str.includes('dr')) {
      return 'debit';
    }
    if (record.type === 'credit' || record.credit || str.includes('credit') || str.includes('cr')) {
      return 'credit';
    }
    
    const cleanStr = str.replace(/[₹$,]/g, '').replace(/\s/g, '').trim();
    if (cleanStr.startsWith('-') || cleanStr.includes('(')) {
      return 'debit';
    }
    
    return 'debit';
  }

  public isUsingDemoData(): boolean {
    return this.useDemoData;
  }
}