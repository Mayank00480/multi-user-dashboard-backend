const express = require("express");
const workSpaceRouter = express.Router();
const Workspace = require("../models/workspace");
const User = require("../models/user");
const userAuth = require("../middleware/userAuth");

workSpaceRouter.post("/",  async (req, res) => {
  try {

    console.log(req.user)
    const { name, description } = req.body;

    const workspace = await new Workspace({
      name,
      description,

      members: [
        {
          user: req.user._id,
          role: "Admin",
        },
      ],
    });

    await workspace.save();

    res.status(201).json({
      success: true,
      workspace,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

workSpaceRouter.get("/", async (req, res) => {
  try {
    const workspaces = await Workspace.find({
      "members.user": req.user._id,
    });

    res.json({
      success: true,
      workspaces,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
})

workSpaceRouter.get("/:id", userAuth, async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id)
      .populate("members.user", "name email");

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: "Workspace not found",
      });
    }

    const isMember = workspace.members.some(
      (member) => member.user._id.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this workspace",
      });
    }

    res.status(200).json({
      success: true,
      workspace,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

workSpaceRouter.post("/:id", async (req, res) => {
  try {
    
    const { email, role } = req.body;

    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: "Workspace not found",
      });
    }

    const currentUser = workspace.members.find(
      (member) => member.user.toString() === req.user._id.toString()
    );

    if (!currentUser || currentUser.role !== "Admin") {
      return res.status(403).json({
        success: false,
        message: "Only Admin can add members",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const alreadyMember = workspace.members.some(
      (member) => member.user.toString() === user._id.toString()
    );

    if (alreadyMember) {
      return res.status(400).json({
        success: false,
        message: "User is already a member",
      });
    }

    workspace.members.push({
      user: user._id,
      role,
    });

    await workspace.save();

    res.json({
      success: true,
      message: "Member added successfully",
      workspace,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
})


workSpaceRouter.get("/:id/available-users", userAuth, async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: "Workspace not found",
      });
    }

    // Check if the logged-in user is a member
    const isMember = workspace.members.some(
      (member) => member.user.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Get all member IDs
    const memberIds = workspace.members.map((member) => member.user);

    // Find users who are not members
    const users = await User.find({
      _id: { $nin: memberIds },
    }).select("_id name email");

    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = workSpaceRouter;