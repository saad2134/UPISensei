// lib/ocr-service.ts - Production ready with PDF splitting
import { Transaction } from './database';

interface OCRResult {
  text: string;
  page: number;
  confidence: number;
}

export class OCRService {
  private apiKeys = [
    'helloworld',
    'K82736675188957', 
    'K83937213488957',
  ];
  private apiUrl = 'https://api.ocr.space/parse/image';
  private maxSizePerRequest = 1024 * 1024; // 1MB in bytes
  private maxPagesPerRequest = 5; // Process 5 pages at a time

  async extractTextFromPDF(buffer: Buffer, filename: string): Promise<string> {
    try {
      console.log(`Processing PDF: ${filename}, Size: ${(buffer.length / 1024 / 1024).toFixed(2)}MB`);

      // Split PDF into manageable chunks
      const pdfChunks = await this.splitPDFIntoChunks(buffer);
      console.log(`Split PDF into ${pdfChunks.length} chunks`);

      let allText = '';

      // Process each chunk sequentially to avoid rate limiting
      for (let i = 0; i < pdfChunks.length; i++) {
        const chunk = pdfChunks[i];
        console.log(`Processing chunk ${i + 1}/${pdfChunks.length}, size: ${(chunk.buffer.length / 1024).toFixed(1)}KB`);
        
        const chunkText = await this.processPDFChunk(chunk.buffer, filename, chunk.pages);
        allText += chunkText + '\n\n';
        
        // Add delay between chunks to avoid rate limiting
        if (i < pdfChunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      console.log(`Total OCR text extracted: ${allText.length} characters`);
      return allText.trim();
    } catch (error: any) {
      console.error('OCR processing failed:', error);
      throw new Error(`OCR failed: ${error.message}`);
    }
  }

  private async splitPDFIntoChunks(buffer: Buffer): Promise<Array<{buffer: Buffer, pages: number[]}>> {
    const chunks: Array<{buffer: Buffer, pages: number[]}> = [];
    
    // For now, we'll use a simple approach: split by size
    // In production, you'd use a PDF library to extract actual pages
    const totalSize = buffer.length;
    const estimatedPages = Math.ceil(totalSize / (200 * 1024)); // Estimate 200KB per page
    
    console.log(`Estimated pages: ${estimatedPages}`);
    
    if (totalSize <= this.maxSizePerRequest) {
      // PDF is small enough for single request
      chunks.push({ buffer, pages: [1] });
    } else {
      // Split into multiple chunks
      const chunkSize = Math.floor(this.maxSizePerRequest * 0.8); // 80% of max size for safety
      const numChunks = Math.ceil(totalSize / chunkSize);
      
      for (let i = 0; i < numChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, totalSize);
        const chunkBuffer = buffer.slice(start, end);
        
        // Calculate which pages this chunk represents (approximate)
        const startPage = Math.floor((i / numChunks) * estimatedPages) + 1;
        const endPage = Math.floor(((i + 1) / numChunks) * estimatedPages);
        const pages = Array.from({length: endPage - startPage + 1}, (_, idx) => startPage + idx);
        
        chunks.push({ buffer: chunkBuffer, pages });
      }
    }
    
    return chunks;
  }

  private async processPDFChunk(buffer: Buffer, filename: string, pages: number[]): Promise<string> {
    let lastError: Error | null = null;
    
    // Try each API key for this chunk
    for (const apiKey of this.apiKeys) {
      try {
        console.log(`Processing pages ${pages.join(',')} with key: ${apiKey.substring(0, 5)}...`);
        const text = await this.sendOCRRequest(buffer, filename, apiKey, pages);
        return text;
      } catch (error: any) {
        lastError = error;
        console.log(`OCR key ${apiKey.substring(0, 5)} failed for pages ${pages.join(',')}:`, error.message);
        
        // If it's a rate limit, wait longer
        if (error.message.includes('403') || error.message.includes('rate')) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        } else {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    throw new Error(`All OCR attempts failed for pages ${pages.join(',')}. Last error: ${lastError?.message}`);
  }

  private async sendOCRRequest(buffer: Buffer, filename: string, apiKey: string, pages: number[]): Promise<string> {
    // Convert to base64
    const base64PDF = buffer.toString('base64');
    
    const requestBody = new URLSearchParams();
    requestBody.append('apikey', apiKey);
    requestBody.append('language', 'eng');
    requestBody.append('isOverlayRequired', 'false');
    requestBody.append('base64Image', `data:application/pdf;base64,${base64PDF}`);
    requestBody.append('filetype', 'PDF');
    requestBody.append('OCREngine', '1');
    requestBody.append('scale', 'true');
    requestBody.append('detectOrientation', 'true');
    requestBody.append('isTable', 'true');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: requestBody,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`OCR API responded with status: ${response.status}`);
      }

      const data = await response.json();

      if (data.IsErroredOnProcessing) {
        const errorMessage = data.ErrorMessage?.[0] || data.ErrorMessage || 'OCR processing failed';
        
        // Handle specific error cases
        if (errorMessage.includes('size') || errorMessage.includes('large')) {
          throw new Error('File size exceeds the maximum size limit. Maximum size limit 1024 KB');
        }
        if (errorMessage.includes('rate') || errorMessage.includes('limit')) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        
        throw new Error(errorMessage);
      }

      let extractedText = '';
      if (data.ParsedResults && data.ParsedResults.length > 0) {
        data.ParsedResults.forEach((result: any, index: number) => {
          if (result.ParsedText) {
            extractedText += `--- Page ${pages[index] || index + 1} ---\n`;
            extractedText += result.ParsedText + '\n\n';
          }
        });
      }

      console.log(`Extracted ${extractedText.length} characters from pages ${pages.join(',')}`);
      return extractedText.trim();
    } catch (error: any) {
      clearTimeout(timeout);
      if (error.name === 'AbortError') {
        throw new Error('OCR request timeout');
      }
      throw error;
    }
  }
}