// Import required modules
const express = require('express');
const bodyParser = require('body-parser');
const cron = require('node-cron');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());

// In-memory storage
let expenses = [];
const predefinedCategories = ["Food", "Travel", "Entertainment", "Utilities", "Other"];

// Helper functions
const generateSummary = (period) => {
  const now = new Date();
  let startDate;

  if (period === 'weekly') {
    startDate = new Date(now.setDate(now.getDate() - 7));
  } else if (period === 'monthly') {
    startDate = new Date(now.setMonth(now.getMonth() - 1));
  } else {
    startDate = new Date(now.setHours(0, 0, 0, 0));
  }

  const summary = {};
  expenses.filter(expense => new Date(expense.date) >= startDate)
    .forEach(expense => {
      const { category, amount } = expense;
      if (!summary[category]) {
        summary[category] = 0;
      }
      summary[category] += amount;
    });
  return summary;
};

const getHighestSpendingCategory = () => {
  const summary = generateSummary('all');
  let maxCategory = null;
  let maxAmount = 0;

  for (const [category, amount] of Object.entries(summary)) {
    if (amount > maxAmount) {
      maxCategory = category;
      maxAmount = amount;
    }
  }

  return { maxCategory, maxAmount };
};

// Endpoints

// Home Endpoint
app.get('/', (req, res) => {
  res.send('Welcome to the Personal Expense Tracker API!');
});

// Add Expense
app.post('/expenses', (req, res) => {
  const { category, amount, date } = req.body;

  if (!category || !amount || !date) {
    return res.status(400).json({ status: 'error', error: 'Missing required fields' });
  }

  if (!predefinedCategories.includes(category)) {
    return res.status(400).json({ status: 'error', error: 'Invalid category' });
  }

  if (amount <= 0) {
    return res.status(400).json({ status: 'error', error: 'Amount must be a positive number' });
  }

  expenses.push({ category, amount, date: new Date(date) });
  res.json({ status: 'success', data: 'Expense added successfully' });
});

// Get Expenses
app.get('/expenses', (req, res) => {
  const { category, startDate, endDate } = req.query;
  let filteredExpenses = expenses;

  if (category) {
    filteredExpenses = filteredExpenses.filter(expense => expense.category === category);
  }

  if (startDate) {
    filteredExpenses = filteredExpenses.filter(expense => new Date(expense.date) >= new Date(startDate));
  }

  if (endDate) {
    filteredExpenses = filteredExpenses.filter(expense => new Date(expense.date) <= new Date(endDate));
  }

  res.json({ status: 'success', data: filteredExpenses });
});

// Analyze Spending
app.get('/expenses/analysis', (req, res) => {
  const summary = generateSummary('all');
  const { maxCategory, maxAmount } = getHighestSpendingCategory();
  res.json({
    status: 'success',
    data: {
      summary,
      highestSpendingCategory: maxCategory,
      highestAmount: maxAmount
    }
  });
});

// Automated Summary Report
cron.schedule('0 0 * * *', () => {
  const dailySummary = generateSummary('daily');
  console.log('Daily Expense Summary:', dailySummary);
});

cron.schedule('0 0 * * 0', () => {
  const weeklySummary = generateSummary('weekly');
  console.log('Weekly Expense Summary:', weeklySummary);
});

cron.schedule('0 0 1 * *', () => {
  const monthlySummary = generateSummary('monthly');
  console.log('Monthly Expense Summary:', monthlySummary);
});

// Start the server
app.listen(port, () => {
  console.log(`Personal Expense Tracker API running on http://localhost:${port}`);
});
