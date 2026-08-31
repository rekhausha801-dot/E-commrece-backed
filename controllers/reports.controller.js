import * as reportService from '../services/reports.service.js';
import { getDateRange } from '../utils/dateRange.js';
import { generateCSV } from '../utils/reportExporter.js';

// Helper to parse dates and standard period
const parseQueryParams = (req) => {
  const { startDate, endDate, period } = req.query;
  const dates = getDateRange(startDate, endDate);
  const p = ['daily', 'weekly', 'monthly', 'yearly'].includes(period) ? period : 'monthly'; // default changed to monthly depending on requirement, but UI defaults often use daily for current month
  return { ...dates, period: p };
};

export const getReports = async (req, res) => {
  try {
    const { current, previous, period } = parseQueryParams(req);
    const data = await reportService.getCompleteReport(current, previous, period);
    res.json({ success: true, data });
  } catch (error) {
    console.error('getReports Error:', error);
    res.status(500).json({ success: false, message: 'Server error generating complete reports', error: error.message, stack: error.stack });
  }
};

export const getSummary = async (req, res) => {
  try {
    const { current, previous } = parseQueryParams(req);
    const data = await reportService.getSummaryReport(current, previous);
    res.json({ success: true, data });
  } catch (error) {
    console.error('getSummary Error:', error);
    res.status(500).json({ success: false, message: 'Server error generating summary report' });
  }
};

export const getSalesOverview = async (req, res) => {
  try {
    const { current, period } = parseQueryParams(req);
    const data = await reportService.getSalesOverview(current, period);
    res.json({ success: true, data });
  } catch (error) {
    console.error('getSalesOverview Error:', error);
    res.status(500).json({ success: false, message: 'Server error generating sales overview report' });
  }
};

export const getSalesByChannel = async (req, res) => {
  try {
    const { current } = parseQueryParams(req);
    const data = await reportService.getSalesByChannel(current);
    res.json({ success: true, data });
  } catch (error) {
    console.error('getSalesByChannel Error:', error);
    res.status(500).json({ success: false, message: 'Server error generating sales by channel report' });
  }
};

export const getRevenueBreakdown = async (req, res) => {
  try {
    const { current } = parseQueryParams(req);
    const data = await reportService.getRevenueBreakdown(current);
    res.json({ success: true, data });
  } catch (error) {
    console.error('getRevenueBreakdown Error:', error);
    res.status(500).json({ success: false, message: 'Server error generating revenue breakdown report' });
  }
};

export const getProfitMargin = async (req, res) => {
  try {
    const { current } = parseQueryParams(req);
    const data = await reportService.getProfitMargin(current);
    res.json({ success: true, data });
  } catch (error) {
    console.error('getProfitMargin Error:', error);
    res.status(500).json({ success: false, message: 'Server error generating profit margin report' });
  }
};

export const getReturnsRefunds = async (req, res) => {
  try {
    const { current } = parseQueryParams(req);
    const data = await reportService.getReturnsRefunds(current);
    res.json({ success: true, data });
  } catch (error) {
    console.error('getReturnsRefunds Error:', error);
    res.status(500).json({ success: false, message: 'Server error generating returns/refunds report' });
  }
};

export const getCouponPerformance = async (req, res) => {
  try {
    const { current } = parseQueryParams(req);
    const data = await reportService.getCouponPerformance(current);
    res.json({ success: true, data });
  } catch (error) {
    console.error('getCouponPerformance Error:', error);
    res.status(500).json({ success: false, message: 'Server error generating coupon performance report' });
  }
};

export const getPaymentMethods = async (req, res) => {
  try {
    const { current } = parseQueryParams(req);
    const data = await reportService.getPaymentMethods(current);
    res.json({ success: true, data });
  } catch (error) {
    console.error('getPaymentMethods Error:', error);
    res.status(500).json({ success: false, message: 'Server error generating payment methods report' });
  }
};

export const getLowStockOverview = async (req, res) => {
  try {
    const data = await reportService.getLowStockOverview();
    res.json({ success: true, data });
  } catch (error) {
    console.error('getLowStockOverview Error:', error);
    res.status(500).json({ success: false, message: 'Server error generating low stock report' });
  }
};

export const getCustomerOverview = async (req, res) => {
  try {
    const { current, previous } = parseQueryParams(req);
    const data = await reportService.getCustomerOverview(current, previous);
    res.json({ success: true, data });
  } catch (error) {
    console.error('getCustomerOverview Error:', error);
    res.status(500).json({ success: false, message: 'Server error generating customer overview report' });
  }
};

export const getOrderStatusOverview = async (req, res) => {
  try {
    const { current } = parseQueryParams(req);
    const data = await reportService.getOrderStatusOverview(current);
    res.json({ success: true, data });
  } catch (error) {
    console.error('getOrderStatusOverview Error:', error);
    res.status(500).json({ success: false, message: 'Server error generating order status overview report' });
  }
};

export const exportReports = async (req, res) => {
  try {
    const { current, previous, period } = parseQueryParams(req);
    const data = await reportService.getCompleteReport(current, previous, period);
    
    const format = req.query.format || 'csv';
    
    if (format === 'csv') {
      const csvData = generateCSV(data);
      res.header('Content-Type', 'text/csv');
      res.attachment(`reports-${current.start.toISOString().split('T')[0]}-to-${current.end.toISOString().split('T')[0]}.csv`);
      return res.send(csvData);
    }
    
    res.json({ success: true, data });
  } catch (error) {
    console.error('exportReports Error:', error);
    res.status(500).json({ success: false, message: 'Server error exporting reports' });
  }
};
