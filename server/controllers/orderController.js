const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const { createNotification, createNotificationForRole } = require('../utils/notificationHelper');

// Create new order
const createOrder = async (req, res) => {
  try {
    const { items, orderType, tableNumber, deliveryAddress, requestedTime, specialInstructions } = req.body;
    const customerId = req.user.id;

    // Validate items and calculate total
    let totalAmount = 0;
    const validatedItems = [];

    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItem);
      if (!menuItem) {
        return res.status(400).json({ message: `Menu item ${item.menuItem} not found` });
      }

      const itemTotal = menuItem.price * item.quantity;
      totalAmount += itemTotal;

      validatedItems.push({
        menuItem: item.menuItem,
        quantity: item.quantity,
        price: menuItem.price
      });
    }

    const order = new Order({
      customer: customerId,
      items: validatedItems,
      totalAmount,
      orderType,
      tableNumber,
      deliveryAddress,
      requestedTime: requestedTime || '',
      specialInstructions
    });

    await order.save();
    await order.populate('customer', 'name email');
    await order.populate('items.menuItem', 'name price');

    // Notify admin about new order
    await createNotificationForRole({
      title: 'New Order Received',
      message: `New order #${order._id} from ${order.customer.name} - Total: $${order.totalAmount.toFixed(2)}${order.requestedTime ? ` - Requested: ${order.requestedTime}` : ''}`,
      type: 'order',
      recipientRole: 'admin',
      relatedId: order._id,
      relatedType: 'order'
    });

    res.status(201).json({
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get customer's orders
const getCustomerOrders = async (req, res) => {
  try {
    const customerId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;

    let query = { customer: customerId };
    if (status) query.status = status;

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('customer', 'name email')
      .populate('items.menuItem', 'name price');

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('Get customer orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all orders (admin/service provider)
const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, customer } = req.query;

    let query = {};
    if (status) query.status = status;
    if (customer) query.customer = customer;

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('customer', 'name email')
      .populate('items.menuItem', 'name price');

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update order status
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'preparing', 'ready', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const oldStatus = order.status;
    order.status = status;
    await order.save();
    await order.populate('customer', 'name email');
    await order.populate('items.menuItem', 'name price');

    // Notify customer about status change
    if (oldStatus !== status) {
      await createNotification({
        title: 'Order Status Updated',
        message: `Your order #${order._id} status has been updated to: ${status}`,
        type: 'order',
        recipientRole: 'customer',
        recipientId: order.customer._id,
        relatedId: order._id,
        relatedType: 'order'
      });
    }

    res.json({
      message: 'Order status updated successfully',
      order
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get single order
const getOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id)
      .populate('customer', 'name email')
      .populate('items.menuItem', 'name price');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user can access this order
    if (req.user.role !== 'admin' && req.user.role !== 'serviceProvider' && order.customer._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ order });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createOrder,
  getCustomerOrders,
  getAllOrders,
  updateOrderStatus,
  getOrder
};
