const Inventory = require('./inventory');
const Sales = require('./sales');
const SaleItem = require('./SaleItems');

// Define relationships
Sales.hasMany(SaleItem, { foreignKey: 'saleId' });
SaleItem.belongsTo(Sales, { foreignKey: 'saleId' });

Inventory.hasMany(SaleItem, { foreignKey: 'itemId' });
SaleItem.belongsTo(Inventory, { foreignKey: 'itemId' });

module.exports = { Inventory, Sales, SaleItem };  
