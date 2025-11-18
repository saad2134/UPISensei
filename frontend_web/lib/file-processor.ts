// lib/file-processor.ts - Enhanced for production
import { parse } from 'csv-parse/sync';
import { Transaction } from './database';
import { OCRService } from './ocr-service';

export class FileProcessor {
  private ocrService = new OCRService();

  async processPDF(fileBuffer: Buffer, filename: string): Promise<Transaction[]> {
    try {
      console.log('Processing PDF with production OCR:', filename);
      
      // Extract text from PDF using OCR
      const text = await this.ocrService.extractTextFromPDF(fileBuffer, filename);
      
      console.log('OCR text extracted, length:', text.length);
      
      if (!text.trim()) {
        throw new Error('No text could be extracted from the PDF. The file might be scanned or image-based.');
      }
      
      // Parse transactions from OCR text
      const transactions = this.parseTransactionsFromOCRText(text, filename);
      console.log('Parsed transactions from PDF:', transactions.length);
      
      if (transactions.length === 0) {
        throw new Error('No transactions found in the PDF. Please ensure it contains readable transaction data.');
      }
      
      return transactions;
    } catch (error: any) {
      console.error('PDF processing error:', error);
      if (error.message?.includes('Password') || error.message?.includes('encrypted')) {
        throw new Error('PDF is password protected. Please provide the password or upload an unprotected PDF.');
      }
      if (error.message?.includes('size')) {
        throw new Error('PDF file is too large. Please try a smaller file or split it into multiple files.');
      }
      throw new Error(`Failed to process PDF: ${error.message}`);
    }
  }

  private parseTransactionsFromOCRText(text: string, filename: string): Transaction[] {
    const lines = text.split('\n').filter(line => {
      const trimmed = line.trim();
      // Filter out page markers and very short lines
      return trimmed.length > 10 && 
             !trimmed.startsWith('--- Page') && 
             !trimmed.match(/^\d+\s*$/);
    });
    
    const transactions: Transaction[] = [];
    const transactionsMap = new Map();
    
    console.log('OCR lines to process:', lines.length);

    // Enhanced patterns for bank statement OCR
    const transactionPatterns = [
      // Pattern: Date Description Amount
      /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\s+(.*?)\s+([₹$]?\s*-?\s*\d{1,3}(?:,\d{3})*\.?\d{0,2})/i,
      // Pattern: UPI transactions
      /(UPI[\/\-].*?[\/\-].*?[\/\-].*?)\s+([₹$]?\s*-?\s*\d{1,3}(?:,\d{3})*\.?\d{0,2})/i,
      // Pattern: POS transactions
      /(POS\s+\d+\s+.*?)\s+([₹$]?\s*-?\s*\d{1,3}(?:,\d{3})*\.?\d{0,2})/i,
      // Pattern: NEFT/IMPS transactions
      /((?:NEFT|IMPS|RTGS).*?)\s+([₹$]?\s*-?\s*\d{1,3}(?:,\d{3})*\.?\d{0,2})/i,
    ];

    lines.forEach((line, lineIndex) => {
      let transactionFound = false;
      
      // Try each transaction pattern
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
      
      // Fallback: look for amount patterns in any line
      if (!transactionFound) {
        const amountMatches = line.match(/([₹$]?\s*-?\s*\d{1,3}(?:,\d{3})*\.?\d{0,2})/g);
        if (amountMatches && amountMatches.length > 0) {
          // Use the largest amount in the line (most likely transaction amount)
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

    // Convert to Transaction objects with proper dates
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
    return transactions.slice(0, 100); // Limit to reasonable number
  }

  private parseAmount(amountStr: string): number {
    // Remove currency symbols, commas, and spaces
    const cleanStr = amountStr.replace(/[₹$,]/g, '').replace(/\s/g, '').trim();
    return parseFloat(cleanStr);
  }

  private determineTransactionTypeFromText(description: string, amount: number): 'debit' | 'credit' {
    const desc = description.toLowerCase();
    
    // Credit indicators
    if (desc.includes('credit') || desc.includes('salary') || desc.includes('deposit') || 
        desc.includes('refund') || desc.includes('interest')) {
      return 'credit';
    }
    
    // Debit indicators
    if (desc.includes('debit') || desc.includes('payment') || desc.includes('withdrawal') ||
        desc.includes('purchase') || desc.includes('pos') || desc.includes('upi')) {
      return 'debit';
    }
    
    // Default based on amount (negative amounts are usually debits)
    return amount < 0 ? 'debit' : 'credit';
  }

  // ... keep all your existing CSV processing methods and helper functions
  async processCSV(fileBuffer: Buffer, filename: string): Promise<Transaction[]> {
    try {
      console.log('Processing CSV file:', filename);
      const content = fileBuffer.toString('utf8');
      
      const records = parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_quotes: true,
        relax_column_count: true
      });

      console.log('CSV records parsed:', records.length);
      const transactions = this.parseCSVRecords(records, filename);
      console.log('Processed transactions from CSV:', transactions.length);
      
      if (transactions.length === 0) {
        throw new Error('No valid transactions found in CSV. Please check the file format.');
      }
      
      return transactions;
    } catch (error: any) {
      console.error('CSV processing error:', error);
      throw new Error(`Failed to process CSV: ${error.message}`);
    }
  }

  private parseCSVRecords(records: any[], filename: string): Transaction[] {
    // ... your existing CSV parsing logic
    const transactions: Transaction[] = [];
    const now = new Date();
    
    records.forEach((record, index) => {
      try {
        const possibleDescriptionFields = ['description', 'Description', 'narration', 'Narration', 'remarks', 'Remarks'];
        const possibleAmountFields = ['amount', 'Amount', 'transaction_amount', 'Transaction_Amount', 'debit', 'Debit', 'credit', 'Credit'];
        const possibleDateFields = ['date', 'Date', 'transaction_date', 'Transaction_Date'];
        
        let description = 'Unknown Transaction';
        let amountStr = '0';
        let dateStr = now.toISOString().split('T')[0];
        
        for (const field of possibleDescriptionFields) {
          if (record[field] !== undefined && record[field] !== '') {
            description = record[field].toString();
            break;
          }
        }
        
        for (const field of possibleAmountFields) {
          if (record[field] !== undefined && record[field] !== '') {
            amountStr = record[field].toString();
            break;
          }
        }
        
        for (const field of possibleDateFields) {
          if (record[field] !== undefined && record[field] !== '') {
            dateStr = record[field].toString();
            break;
          }
        }
        
        const cleanAmountStr = amountStr.toString().replace(/,/g, '').replace(/\s/g, '');
        const amount = Math.abs(parseFloat(cleanAmountStr));
        const type = this.determineTransactionType(record, amountStr);
        
        if (!isNaN(amount) && amount > 0) {
          let transactionDate: Date;
          
          try {
            transactionDate = new Date(dateStr);
            if (isNaN(transactionDate.getTime())) {
              transactionDate = new Date(now);
              transactionDate.setDate(transactionDate.getDate() - (index + 1));
            }
          } catch {
            transactionDate = new Date(now);
            transactionDate.setDate(transactionDate.getDate() - (index + 1));
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
        console.warn('Failed to parse CSV record:', record, error);
      }
    });
    
    return transactions.slice(0, 100);
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
    const str = amountStr.toString();
    const cleanStr = str.replace(/,/g, '').replace(/\s/g, '');
    
    if (record.type === 'debit' || record.debit) return 'debit';
    if (record.type === 'credit' || record.credit) return 'credit';
    
    return cleanStr.startsWith('-') ? 'debit' : 'credit';
  }
}