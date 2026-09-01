// Note: You may need to run `npm install json2csv` if it's not installed in the project.
// If not using an external library, a simple CSV string builder can be used.
// We'll use a basic manual CSV generator to avoid new dependencies if possible.

export const generateCSV = (data) => {
  if (!data || Object.keys(data).length === 0) return '';
  
  // This is a basic generic converter, specific implementation depends on how exactly the sections are structured.
  // For the purpose of this requirement, we'll implement a custom builder.
  
  let csvString = '';
  
  const addSection = (title, headers, rows) => {
    csvString += `${title}\n`;
    if (headers && headers.length) {
      csvString += headers.join(',') + '\n';
    }
    if (rows && rows.length) {
      rows.forEach(row => {
        csvString += row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',') + '\n';
      });
    }
    csvString += '\n';
  };
  
  if (data.summary) {
    addSection('Summary', ['Metric', 'Value'], [
      ['Total Sales', data.summary.totalSales],
      ['Total Orders', data.summary.totalOrders],
      ['Total Customers', data.summary.totalCustomers],
      ['Average Order Value', data.summary.averageOrderValue]
    ]);
  }
  
  if (data.salesByChannel && data.salesByChannel.channels) {
    const rows = data.salesByChannel.channels.map(c => [c.name, c.orders, c.sales, c.percentage]);
    addSection('Sales By Channel', ['Channel', 'Orders', 'Sales', 'Percentage'], rows);
  }
  
  if (data.revenueBreakdown) {
    addSection('Revenue Breakdown', ['Metric', 'Value'], [
      ['Gross Sales', data.revenueBreakdown.grossSales],
      ['Discounts', data.revenueBreakdown.discounts],
      ['Refunds', data.revenueBreakdown.refunds],
      ['Shipping Revenue', data.revenueBreakdown.shippingRevenue],
      ['Net Revenue', data.revenueBreakdown.netRevenue]
    ]);
  }

  // Include more sections as needed...
  
  return csvString;
};
