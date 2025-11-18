// lib/gemini-service.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Transaction } from './database';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const SYSTEM_PROMPT = `You are UPISensei, a friendly AI financial agent for the UPISensei platform. 

ABOUT YOU:
- You are UPISensei AI Agent, created by the UPISensei team
- You help users understand their spending patterns and manage finances
- You analyze transaction data to provide personalized insights
- You are NOT Gemini, you are UPISensei's proprietary AI

PLATFORM KNOWLEDGE:
- UPISensei is a financial tracking and analysis platform
- Users can upload bank statements and transaction files
- The platform categorizes transactions automatically
- We support UPI, credit cards, debit cards, and bank transactions

RESPONSE GUIDELINES:
- Be conversational but professional
- Provide specific insights based on transaction data
- Suggest actionable financial advice
- If you don't know something, admit it and guide them to relevant features
- Always represent yourself as UPISensei AI
- Never claim to be Gemini or any other AI

DATA ANALYSIS:
When analyzing transactions, look for:
- Spending patterns by category
- Monthly trends
- High-value transactions
- Recurring subscriptions
- Potential savings opportunities
- Budget optimization suggestions`;

export class GeminiService {
  private model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    systemInstruction: SYSTEM_PROMPT
  });

  async chatWithUser(userMessage: string, userTransactions: Transaction[], fileContext?: string): Promise<string> {
    const transactionContext = this.formatTransactionContext(userTransactions);
    const fileContextStr = fileContext ? `\n\nUPLOADED FILE CONTEXT:\n${fileContext}` : '';

    const prompt = `
${SYSTEM_PROMPT}

CURRENT USER TRANSACTION DATA:
${transactionContext}
${fileContextStr}

USER MESSAGE: ${userMessage}

Please respond as UPISensei AI Agent:`;

    try {
      const result = await this.model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error('Gemini API error:', error);
      return "I apologize, but I'm having trouble processing your request right now. Please try again in a moment.";
    }
  }

  async analyzeTransactions(transactions: Transaction[]): Promise<string> {
    const transactionContext = this.formatTransactionContext(transactions);
    
    const prompt = `
${SYSTEM_PROMPT}

ANALYZE THESE TRANSACTIONS:
${transactionContext}

Please provide a comprehensive analysis of these transactions including:
1. Spending patterns by category
2. Notable trends or observations
3. Potential areas for savings
4. Budget recommendations

Respond as UPISensei AI Agent:`;

    try {
      const result = await this.model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error('Gemini API error:', error);
      return "I've processed your transactions but encountered an issue with detailed analysis. I can still answer specific questions about your spending data.";
    }
  }

  private formatTransactionContext(transactions: Transaction[]): string {
    if (transactions.length === 0) {
      return "No transaction data available.";
    }

    const sortedTransactions = transactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 50); // Limit to recent 50 transactions

    const transactionsStr = sortedTransactions.map(t => 
      `- ${t.date.toISOString().split('T')[0]} | ${t.description} | ${t.amount} | ${t.category} | ${t.type}`
    ).join('\n');

    const summary = this.getTransactionSummary(transactions);

    return `TRANSACTION SUMMARY:
Total Transactions: ${summary.total}
Total Spent: ${summary.totalSpent}
Total Income: ${summary.totalIncome}
Categories: ${Object.keys(summary.categories).join(', ')}

RECENT TRANSACTIONS:
${transactionsStr}`;
  }

  private getTransactionSummary(transactions: Transaction[]) {
    const total = transactions.length;
    const totalSpent = transactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalIncome = transactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const categories: { [key: string]: number } = {};
    transactions.forEach(t => {
      categories[t.category] = (categories[t.category] || 0) + t.amount;
    });

    return { total, totalSpent, totalIncome, categories };
  }
}