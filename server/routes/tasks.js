const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

// @route   GET /api/tasks
// @desc   Get all tasks (for admin) or assigned tasks (for members)
// @access Private
router.get('/', auth, async (req, res) => {
  try {
    const { projectId, status } = req.query;
    let filter = {};

    // If not admin, only show tasks assigned to them or created by them
    if (req.user.role !== 'admin') {
      filter.$or = [
        { assignedTo: req.user._id },
        { createdBy: req.user._id }
      ];
    }

    if (projectId) {
      filter.project = projectId;
    }

    if (status) {
      filter.status = status;
    }

    const tasks = await Task.find(filter)
      .populate('project', 'name')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    console.error('Get Tasks Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/tasks/project/:projectId
// @desc   Get all tasks for a specific project
// @access Private
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const projectId = req.params.projectId;

    // Check if project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is member or creator
    const isMember = project.members.some(member => member.toString() === req.user._id.toString());
    const isCreator = project.createdBy.toString() === req.user._id.toString();

    if (!isMember && !isCreator && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const tasks = await Task.find({ project: projectId })
      .populate('project', 'name')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    console.error('Get Project Tasks Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/tasks/my-tasks
// @desc   Get tasks assigned to logged-in member
// @access Private (Member only)
router.get('/my-tasks', auth, async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user._id })
      .populate('project', 'name')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    console.error('Get My Tasks Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/tasks/:id
// @desc   Get single task by ID
// @access Private
router.get('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('project', 'name')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check access
    const project = await Project.findById(task.project._id);
    const isMember = project.members.some(member => member.toString() === req.user._id.toString());
    const isCreator = project.createdBy.toString() === req.user._id.toString();
    const isAssigned = task.assignedTo && task.assignedTo._id.toString() === req.user._id.toString();

    if (!isMember && !isCreator && !isAssigned && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(task);
  } catch (error) {
    console.error('Get Task Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/tasks
// @desc   Create a new task
// @access Private (Admin only)
router.post('/', auth, role('admin'), [
  body('title').trim().notEmpty().withMessage('Task title is required'),
  body('project').notEmpty().withMessage('Project is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

const { title, description, status, dueDate, project: projectId, assignedTo } = req.body;

    // Check if project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // If assigning to a user, verify they are a member of the project
    if (assignedTo) {
      const isMember = project.members.some(m => m.toString() === assignedTo) || 
                     project.createdBy.toString() === assignedTo;
      if (!isMember) {
        return res.status(400).json({ message: 'Cannot assign task to user not in this project' });
      }
    }

    // Create task
    const task = new Task({
      title,
      description,
status: status || 'pending',
      dueDate: dueDate || null,
      project: projectId,
      assignedTo: assignedTo || null,
      createdBy: req.user._id
    });

    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('project', 'name')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');

    res.status(201).json(populatedTask);
  } catch (error) {
    console.error('Create Task Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/tasks/:id
// @desc   Update a task
// @access Private
router.put('/:id', auth, async (req, res) => {
  try {
    let { title, description, status, dueDate, assignedTo } = req.body;

    // Convert 'completed' to 'done' for compatibility with DB schema
    if (status === 'completed') {
      status = 'done';
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

// Check if user has access
    const project = await Project.findById(task.project);
    const isCreator = task.createdBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    const isAssigned = task.assignedTo && task.assignedTo.toString() === req.user._id.toString();

    // Deny access if neither creator, admin, nor assigned
    if (!isCreator && !isAdmin && !isAssigned) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Assigned members can only update status
    if (!isCreator && !isAdmin) {
      if (status) {
        task.status = status;
      }
    } else {
      // Admin or creator can update all fields
      if (title) task.title = title;
      if (description !== undefined) task.description = description;
      if (status) task.status = status;
      if (dueDate !== undefined) task.dueDate = dueDate;
      if (assignedTo !== undefined) task.assignedTo = assignedTo;
    }

    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate('project', 'name')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');

    res.json(updatedTask);
  } catch (error) {
    console.error('Update Task Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/tasks/:id
// @desc   Delete a task
// @access Private (Admin or creator only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user is creator or admin
    const isCreator = task.createdBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isCreator && !isAdmin) {
      return res.status(403).json({ message: 'Only the task creator or admin can delete it' });
    }

    await task.deleteOne();

res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete Task Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/tasks/:id/status
// @desc   Update task status (only assigned user can update)
// @access Private
router.patch('/:id/status', auth, [
body('status').isIn(['pending', 'todo', 'in-progress', 'done', 'completed']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Convert 'completed' to 'done' for compatibility with DB schema
    let { status } = req.body;
    if (status === 'completed') {
      status = 'done';
    }
    
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user is assigned to this task or is admin
    const isAssigned = task.assignedTo && task.assignedTo.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isAssigned && !isAdmin) {
      return res.status(403).json({ message: 'Only the assigned user can update this task' });
    }

    task.status = status;
    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate('project', 'name')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');

    res.json(updatedTask);
  } catch (error) {
    console.error('Update Status Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/tasks/:id/update
// @desc   Add progress update/report to a task
// @access Private (Assigned user only)
router.post('/:id/update', auth, [
  body('text').trim().notEmpty().withMessage('Update text is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { text } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user is assigned to this task
    const isAssigned = task.assignedTo && task.assignedTo.toString() === req.user._id.toString();

    if (!isAssigned) {
      return res.status(403).json({ message: 'Only the assigned user can add updates' });
    }

    // Add update to task
    const update = {
      text,
      createdAt: new Date(),
      updatedBy: req.user._id
    };

    if (!task.updates) {
      task.updates = [];
    }
    task.updates.push(update);
    await task.save();

    // Populate the update with user details
    const populatedTask = await Task.findById(task._id)
      .populate('project', 'name')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('updates.updatedBy', 'name email');

    res.json(populatedTask);
  } catch (error) {
    console.error('Add Update Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/tasks/:id/updates
// @desc   Get all updates for a task
// @access Private (Assigned user or Admin)
router.get('/:id/updates', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('updates.updatedBy', 'name email');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user is assigned to this task or is admin
    const isAssigned = task.assignedTo && task.assignedTo.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isAssigned && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Return updates sorted by most recent
    const updates = task.updates ? task.updates.sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    ) : [];

    res.json(updates);
  } catch (error) {
    console.error('Get Updates Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
