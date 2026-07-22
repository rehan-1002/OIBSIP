const cron = require('node-cron');
const Inventory = require('../models/Inventory');
const { sendEmail, getLowStockAlertTemplate } = require('./sendEmail');

let lastAlertTime = 0;

const checkAndAlertLowStock = async () => {
  try {
    const threshold = parseInt(process.env.LOW_STOCK_THRESHOLD) || 20;
    const lowStockItems = await Inventory.find({ stockQuantity: { $lt: threshold } });

    if (lowStockItems.length > 0) {
      console.log(`[Cron Job Alert] Found ${lowStockItems.length} items with low stock (< ${threshold})`);

      const adminEmail = process.env.ADMIN_EMAIL || 'admin@fuoco.com';
      const html = getLowStockAlertTemplate(lowStockItems);

      await sendEmail({
        email: adminEmail,
        subject: `⚠️ Low Stock Alert: ${lowStockItems.length} items below threshold`,
        html
      });

      console.log(`[Cron Job Alert] Sent low stock alert email to ${adminEmail}`);
    } else {
      console.log(`[Cron Job Check] All inventory items are healthy (>= ${threshold})`);
    }
  } catch (error) {
    console.error(`[Cron Job Error] Failed checking inventory low stock: ${error.message}`);
  }
};

const initCronJobs = () => {
  // Run every 10 minutes: '*/10 * * * *'
  cron.schedule('*/10 * * * *', async () => {
    console.log('[Cron Job] Executing periodic low-stock check...');
    await checkAndAlertLowStock();
  });

  console.log('[Cron Job] Initialized node-cron schedule for inventory monitoring.');
};

module.exports = { initCronJobs, checkAndAlertLowStock };
