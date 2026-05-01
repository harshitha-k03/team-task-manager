const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Project = require('../models/Project');
const User = require('../models/User');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

// @route   GET /api/projects
// @desc   Get all projects (admin sees all, members see their projects)
// @access Private
router.get('/', auth, async (req, res) => {
  try {
    let projects;
    
    if (req.user.role === 'admin') {
      // Admin sees all projects they created or are members of
      projects = await Project.find({
        $or: [
          { createdBy: req.user._id },
          { members: req.user._id }
        ]
      })
      .populate('createdBy', 'name email')
      .populate('members', 'name email')
      .sort({ createdAt: -1 });
    } else {
      // Members see projects they are added to
      projects = await Project.find({
        $or: [
          { createdBy: req.user._id },
          { members: req.user._id }
        ]
      })
      .populate('createdBy', 'name email')
      .populate('members', 'name email')
      .sort({ createdAt: -1 });
    }

    res.json(projects);
  } catch (error) {
    console.error('Get Projects Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/projects/:id
// @desc   Get single project by ID
// @access Private
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('members', 'name email');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is member or created the project
    const isMember = project.members.some(member => member._id.toString() === req.user._id.toString());
    const isCreator = project.createdBy._id.toString() === req.user._id.toString();

    if (!isMember && !isCreator && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(project);
  } catch (error) {
    console.error('Get Project Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/projects
// @desc   Create a new project
// @access Private (Admin only)
router.post('/', auth, role('admin'), [
  body('name').trim().notEmpty().withMessage('Project name is required'),
  body('description').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

const { name, description, members } = req.body;

    const project = new Project({
      name,
      description,
      members: members || [],
      createdBy: req.user._id
    });

    await project.save();

    // If members provided, add them
    if (members && members.length > 0) {
      await Project.findByIdAndUpdate(project._id, {
        $addToSet: { members: { $each: members } }
      });
    }

    const populatedProject = await Project.findById(project._id)
      .populate('createdBy', 'name email')
      .populate('members', 'name email');

    res.status(201).json(populatedProject);
  } catch (error) {
    console.error('Create Project Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/projects/:id
// @desc   Update a project
// @access Private (Admin only)
router.put('/:id', auth, role('admin'), async (req, res) => {
  try {
    const { name, description, members } = req.body;

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is creator
    if (project.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the project creator can update it' });
    }

    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (members) project.members = members;

    await project.save();

    const updatedProject = await Project.findById(project._id)
      .populate('createdBy', 'name email')
      .populate('members', 'name email');

    res.json(updatedProject);
  } catch (error) {
    console.error('Update Project Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/projects/:id
// @desc   Delete a project
// @access Private (Admin only)
router.delete('/:id', auth, role('admin'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is creator
    if (project.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the project creator can delete it' });
    }

    // Delete all tasks associated with the project
    const Task = require('../models/Task');
    await Task.deleteMany({ project: project._id });

    await project.deleteOne();

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete Project Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/projects/:id/members
// @desc   Add members to a project
// @access Private (Admin only)
router.post('/:id/members', auth, role('admin'), [
  body('userId').notEmpty().withMessage('User ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId } = req.body;

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is creator
    if (project.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the project creator can add members' });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Add member to project
    if (!project.members.includes(userId)) {
      project.members.push(userId);
      await project.save();
    }

    const updatedProject = await Project.findById(project._id)
      .populate('createdBy', 'name email')
      .populate('members', 'name email');

    res.json(updatedProject);
  } catch (error) {
    console.error('Add Member Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/projects/:id/members
// @desc   Get all members of a project
// @access Private
router.get('/:id/members', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('members', 'name email role');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check access
    const isMember = project.members.some(m => m._id.toString() === req.user._id.toString());
    const isCreator = project.createdBy.toString() === req.user._id.toString();

    if (!isMember && !isCreator && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(project.members);
  } catch (error) {
    console.error('Get Project Members Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/projects/:id/members/available
// @desc   Get all available users to add as members
// @access Private (Admin only)
router.get('/:id/members/available', auth, role('admin'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Get users not already members
    const availableUsers = await User.find({
      _id: { $nin: [...project.members, project.createdBy] }
    }).select('name email role');

    res.json(availableUsers);
  } catch (error) {
    console.error('Get Available Members Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/projects/my-projects
// @desc   Get projects where user is member or creator
// @access Private (Member only)
router.get('/my-projects', auth, async (req, res) => {
  try {
    // Get projects where user is a member or creator
    const projects = await Project.find({
      $or: [
        { createdBy: req.user._id },
        { members: req.user._id }
      ]
    })
    .populate('createdBy', 'name email')
    .populate('members', 'name email')
    .sort({ createdAt: -1 });

    // Get task counts for each project
    const Task = require('../models/Task');
    const projectsWithCounts = await Promise.all(
      projects.map(async (project) => {
        const taskCount = await Task.countDocuments({ project: project._id });
        return {
          ...project.toObject(),
          taskCount
        };
      })
    );

    res.json(projectsWithCounts);
  } catch (error) {
    console.error('Get My Projects Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/projects/:id/members/:userId
// @desc   Remove a member from project
// @access Private (Admin only)
router.delete('/:id/members/:userId', auth, role('admin'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is creator
    if (project.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the project creator can remove members' });
    }

    const userId = req.params.userId;

    // Prevent removing the creator
    if (userId === project.createdBy.toString()) {
      return res.status(400).json({ message: 'Cannot remove the project creator' });
    }

    // Remove member
    project.members = project.members.filter(m => m.toString() !== userId);
    await project.save();

    const updatedProject = await Project.findById(project._id)
      .populate('createdBy', 'name email')
      .populate('members', 'name email');

    res.json(updatedProject);
  } catch (error) {
    console.error('Remove Member Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
