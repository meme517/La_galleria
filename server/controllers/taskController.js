const Task = require('../models/Task');
const User = require('../models/User');
const mongoose = require('mongoose');
const { createNotification } = require('../utils/notificationHelper');

// Admin: Create and assign task
const createTask = async (req, res) => {
    try {
        const { assignedTo, title, description, priority, dueDate, dueTime, notes } = req.body;

        if (!assignedTo || !title || !dueDate) {
            return res.status(400).json({ message: 'assignedTo, title, and dueDate are required' });
        }

        // Verify assigned user exists and is a service provider
        const assignee = await User.findById(assignedTo);
        if (!assignee || assignee.role !== 'serviceProvider') {
            return res.status(400).json({ message: 'Invalid service provider' });
        }

        const task = new Task({
            title,
            description: description || '',
            assignedTo,
            assignedBy: req.user.id,
            priority: priority || 'medium',
            dueDate: new Date(dueDate),
            dueTime: dueTime || '',
            notes: notes || ''
        });

        await task.save();
        await task.populate('assignedTo', 'name email department');
        await task.populate('assignedBy', 'name email');

        // Notify service provider about new task assignment
        await createNotification({
            title: 'New Task Assigned',
            message: `You have been assigned a new task: ${task.title}${task.dueDate ? ` (Due: ${new Date(task.dueDate).toLocaleDateString()}${task.dueTime ? ` at ${task.dueTime}` : ''})` : ''}`,
            type: 'task',
            recipientRole: 'serviceProvider',
            recipientId: task.assignedTo._id,
            relatedId: task._id,
            relatedType: 'task'
        });

        res.status(201).json({
            message: 'Task created and assigned successfully',
            task
        });
    } catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all tasks (Admin sees all, Service Provider sees assigned)
const getTasks = async (req, res) => {
    try {
        let query = {};

        if (req.user.role === 'serviceProvider') {
            query.assignedTo = req.user.id;
        } else if (req.user.role === 'admin') {
            // Admin sees all tasks
        } else {
            return res.status(403).json({ message: 'Access denied' });
        }

        const tasks = await Task.find(query)
            .populate('assignedTo', 'name email department')
            .populate('assignedBy', 'name email')
            .sort({ createdAt: -1 });

        res.json({ tasks });
    } catch (error) {
        console.error('Get tasks error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get single task
const getTask = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ message: 'Invalid task id' });
        }

        const task = await Task.findById(id)
            .populate('assignedTo', 'name email department')
            .populate('assignedBy', 'name email');

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Service provider can only see their own tasks
        if (req.user.role === 'serviceProvider' && task.assignedTo._id.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.json({ task });
    } catch (error) {
        console.error('Get task error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Service Provider: Update task status
const updateTaskStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, completedNotes } = req.body;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ message: 'Invalid task id' });
        }

        if (!['pending', 'in-progress', 'completed', 'cancelled'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const task = await Task.findById(id);
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Service provider can only update their own tasks
        if (req.user.role === 'serviceProvider' && task.assignedTo.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const oldStatus = task.status;
        task.status = status;
        if (status === 'completed') {
            task.completedAt = new Date();
            task.completedNotes = completedNotes || task.completedNotes || '';
        }

        await task.save();
        await task.populate('assignedTo', 'name email department');
        await task.populate('assignedBy', 'name email');

        // Notify admin when task is completed
        if (oldStatus !== 'completed' && status === 'completed') {
            await createNotification({
                title: 'Task Completed',
                message: `${task.assignedTo.name} has completed the task: ${task.title}`,
                type: 'task',
                recipientRole: 'admin',
                recipientId: task.assignedBy._id,
                relatedId: task._id,
                relatedType: 'task'
            });
        }

        res.json({
            message: 'Task status updated successfully',
            task
        });
    } catch (error) {
        console.error('Update task status error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Admin: Update task
const updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, priority, dueDate, dueTime, notes, assignedTo } = req.body;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ message: 'Invalid task id' });
        }

        const task = await Task.findById(id);
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        if (title !== undefined) task.title = title;
        if (description !== undefined) task.description = description;
        if (priority !== undefined) task.priority = priority;
        if (dueDate !== undefined) task.dueDate = new Date(dueDate);
        if (dueTime !== undefined) task.dueTime = dueTime;
        if (notes !== undefined) task.notes = notes;
        if (assignedTo !== undefined) {
            const assignee = await User.findById(assignedTo);
            if (!assignee || assignee.role !== 'serviceProvider') {
                return res.status(400).json({ message: 'Invalid service provider' });
            }
            task.assignedTo = assignedTo;
        }

        await task.save();
        await task.populate('assignedTo', 'name email department');
        await task.populate('assignedBy', 'name email');

        res.json({
            message: 'Task updated successfully',
            task
        });
    } catch (error) {
        console.error('Update task error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Admin: Delete task
const deleteTask = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ message: 'Invalid task id' });
        }

        const task = await Task.findByIdAndDelete(id);
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error('Delete task error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    createTask,
    getTasks,
    getTask,
    updateTaskStatus,
    updateTask,
    deleteTask
};

