const MenuItem = require('../models/MenuItem');

// Create new menu item
const createMenuItem = async (req, res) => {
  try {
    const { name, description, price, category, image, available } = req.body;

    const menuItem = new MenuItem({
      name,
      description,
      price,
      category,
      image,
      available: available !== undefined ? available : true
    });

    await menuItem.save();

    res.status(201).json({
      message: 'Menu item created successfully',
      menuItem
    });
  } catch (error) {
    console.error('Create menu item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all menu items
const getAllMenuItems = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, available } = req.query;

    let query = {};
    if (category) query.category = category;
    if (available !== undefined) query.available = available === 'true';

    const menuItems = await MenuItem.find(query)
      .sort({ name: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await MenuItem.countDocuments(query);

    res.json({
      menuItems,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('Get all menu items error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get single menu item
const getMenuItem = async (req, res) => {
  try {
    const { id } = req.params;

    const menuItem = await MenuItem.findById(id);
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    res.json({ menuItem });
  } catch (error) {
    console.error('Get menu item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update menu item
const updateMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, category, image, available } = req.body;

    const menuItem = await MenuItem.findById(id);
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    menuItem.name = name || menuItem.name;
    menuItem.description = description || menuItem.description;
    menuItem.price = price !== undefined ? price : menuItem.price;
    menuItem.category = category || menuItem.category;
    menuItem.image = image || menuItem.image;
    menuItem.available = available !== undefined ? available : menuItem.available;

    await menuItem.save();

    res.json({
      message: 'Menu item updated successfully',
      menuItem
    });
  } catch (error) {
    console.error('Update menu item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete menu item
const deleteMenuItem = async (req, res) => {
  try {
    const { id } = req.params;

    const menuItem = await MenuItem.findById(id);
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    await MenuItem.findByIdAndDelete(id);

    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error('Delete menu item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get menu items by category
const getMenuByCategory = async (req, res) => {
  try {
    const menuItems = await MenuItem.find({ available: true }).sort({ category: 1, name: 1 });

    // Group by category
    const groupedMenu = menuItems.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {});

    res.json({ menu: groupedMenu });
  } catch (error) {
    console.error('Get menu by category error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Public menu list (available items only)
const getPublicMenuItems = async (req, res) => {
  try {
    const menuItems = await MenuItem.find({ available: true }).sort({ name: 1 });
    res.json(menuItems);
  } catch (error) {
    console.error('Get public menu items error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createMenuItem,
  getAllMenuItems,
  getMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getMenuByCategory,
  getPublicMenuItems
};
