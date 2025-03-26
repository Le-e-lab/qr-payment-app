// Mock transaction data - in a real app, this would come from an API
const mockTransactions = [
    {
        id: 'txn_1',
        amount: 50.00,
        currency: 'USD',
        merchant: 'Amazon',
        type: 'debit',
        status: 'completed',
        timestamp: '2023-05-15T10:30:00Z',
        description: 'Online purchase at Amazon'
    },
    {
        id: 'txn_2',
        amount: 1200.00,
        currency: 'USD',
        merchant: 'Salary',
        type: 'credit',
        status: 'completed',
        timestamp: '2023-05-01T00:00:00Z',
        description: 'Monthly salary'
    },
    // Add more mock transactions as needed
];

// Load transactions with limit
export async function loadTransactions(limit = 10) {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Sort by timestamp (newest first)
    const sorted = [...mockTransactions].sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp));
    
    return sorted.slice(0, limit);
}

// Add a new transaction
export async function addTransaction(transaction) {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    mockTransactions.unshift(transaction);
    return transaction;
}

// In a real app, you would have more functions like:
// - getTransactionById
// - filterTransactions
// - getBalance, etc.