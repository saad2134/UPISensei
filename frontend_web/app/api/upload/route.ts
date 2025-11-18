// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { FileProcessor } from '@/lib/file-processor';
import { database } from '@/lib/database';

const fileProcessor = new FileProcessor();

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.name.match(/\.(pdf|csv)$/i)) {
      return NextResponse.json({ error: 'Only PDF and CSV files are allowed' }, { status: 400 });
    }

    // Validate file size (7MB max for PDF with OCR)
    const maxSize = file.name.toLowerCase().endsWith('.pdf') ? 7 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: `File size must be less than ${maxSize / 1024 / 1024}MB` }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    let transactions;
    
    try {
      if (file.name.toLowerCase().endsWith('.pdf')) {
        transactions = await fileProcessor.processPDF(buffer, file.name);
      } else {
        transactions = await fileProcessor.processCSV(buffer, file.name);
      }

      if (transactions.length === 0) {
        return NextResponse.json({ error: 'No transactions found in the file' }, { status: 400 });
      }
    } catch (processingError: any) {
      return NextResponse.json(
        { 
          error: 'File processing failed',
          details: processingError.message,
          suggestion: file.name.toLowerCase().endsWith('.pdf') 
            ? 'Try uploading a CSV file for more reliable processing.' 
            : 'Please check your CSV format and try again.'
        }, 
        { status: 400 }
      );
    }

    // Save to database
    const userId = 'demo-user';
    database.addTransactions(transactions);
    
    const fileId = database.saveProcessedFile({
      userId,
      filename: file.name,
      originalName: file.name,
      fileType: file.type,
      processedData: transactions,
      uploadedAt: new Date()
    });

    return NextResponse.json({ 
      fileId,
      message: `Successfully processed ${transactions.length} transactions from ${file.name}`,
      transactionCount: transactions.length,
      fileType: file.name.toLowerCase().endsWith('.pdf') ? 'PDF (OCR)' : 'CSV'
    });
    
  } catch (error: any) {
    console.error('Upload API error:', error);
    
    if (error.message.includes('password protected')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json(
      { error: 'Failed to process file', details: error.message },
      { status: 500 }
    );
  }
}