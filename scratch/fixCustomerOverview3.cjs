const fs = require('fs');
const path = '../server/services/reports.service.js';
let content = fs.readFileSync(path, 'utf8');

const newGetCustomerOverview = `
export const getCustomerOverview = async (currentDates, previousDates) => {
  const totalCustomers = await User.countDocuments({ role: 'customer', createdAt: { $lte: currentDates.end } });
  const newCustomers = await User.countDocuments({ role: 'customer', createdAt: { $gte: currentDates.start, $lte: currentDates.end } });
  const returningCustomers = totalCustomers - newCustomers;

  const prevTotalCustomers = await User.countDocuments({ role: 'customer', createdAt: { $lte: previousDates.end } });
  const prevNewCustomers = await User.countDocuments({ role: 'customer', createdAt: { $gte: previousDates.start, $lte: previousDates.end } });
  const prevReturningCustomers = prevTotalCustomers - prevNewCustomers;

  const calcGrowth = (curr, prev) => prev === 0 ? (curr > 0 ? 100 : 0) : Number((((curr - prev) / prev) * 100).toFixed(1));

  return {
    newCustomers,
    returningCustomers: returningCustomers > 0 ? returningCustomers : 0,
    totalCustomers,
    newCustomersGrowth: calcGrowth(newCustomers, prevNewCustomers),
    returningCustomersGrowth: calcGrowth(returningCustomers > 0 ? returningCustomers : 0, prevReturningCustomers > 0 ? prevReturningCustomers : 0),
    totalCustomersGrowth: calcGrowth(totalCustomers, prevTotalCustomers)
  };
};
`;

content = content.replace(/export const getCustomerOverview = async[\s\S]*?return \{[\s\S]*?\};\s*\};/, newGetCustomerOverview);
fs.writeFileSync(path, content);
