import Project from "../models/Project.js";
import Task from "../models/Task.js";

export const getProjects = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Extract all project IDs where this user is present in the assignees array
    const assignedProjectIds = await Task.find({ assignees: userId }).distinct(
      "project",
    );

    // 2. Fetch unique projects where the user is either the owner or an assignee
    const rawProjects = await Project.find({
      $or: [{ owner: userId }, { _id: { $in: assignedProjectIds } }],
    }).lean(); // Use lean() for maximum read performance

    // 3. Structure the output cleanly for your React frontend
    const structuredProjects = rawProjects.map(
      ({ _id, __v, owner, ...rest }) => {
        const ownerIdString = owner ? owner.toString() : "";
        return {
          id: _id.toString(),
          owner: ownerIdString,
          isOwner: ownerIdString === userId.toString(), // Easy UI permission checking on frontend
          ...rest,
        };
      },
    );

    return res.status(200).json(structuredProjects);
  } catch (error) {
    console.error("Error fetching combined user projects:", error);
    return res
      .status(500)
      .json({ error: "Failed to fetch combined user projects." });
  }
};

export const createProject = async (req, res) => {
  try {
    const { name, desc, color } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Project name is required." });
    }

    const newProject = new Project({
      owner: req.user.id,
      name,
      desc,
      color,
    });

    const savedProject = await newProject.save();

    return res.status(201).json({
      id: savedProject._id.toString(),
      owner: savedProject.owner.toString(),
      isOwner: true,
      name: savedProject.name,
      desc: savedProject.desc,
      color: savedProject.color,
      createdAt: savedProject.createdAt,
      updatedAt: savedProject.updatedAt,
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, desc, color } = req.body;

    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({ error: "Project target not found." });
    }

    if (project.owner.toString() !== req.user.id.toString()) {
      return res
        .status(403)
        .json({ error: "Not authorized to update this project." });
    }

    if (name !== undefined) project.name = name;
    if (desc !== undefined) project.desc = desc;
    if (color !== undefined) project.color = color;

    const updatedProject = await project.save();

    const { _id, __v, owner, ...rest } = updatedProject.toObject();
    return res.status(200).json({
      id: _id.toString(),
      owner: owner ? owner.toString() : "",
      ...rest,
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the target project
    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({ error: "Project target not found." });
    }

    // Security Guard: Only the core owner can delete a whole project
    if (project.owner.toString() !== req.user.id.toString()) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this project." });
    }

    // DATABASE CLEANUP (Cascade Delete)
    // Deletes all tasks referencing this project ID across all users/assignees
    await Task.deleteMany({ project: id });

    await project.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Project successfully deleted.",
    });
  } catch (error) {
    console.error("Project deletion workflow failed:", error);
    return res.status(500).json({ error: "Project deletion workflow failed." });
  }
};
