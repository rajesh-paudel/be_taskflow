import Task from "../models/Task.js";
import Project from "../models/Project.js";
import User from "../models/User.js";

export const createTask = async (req, res) => {
  try {
    const {
      projectId,
      title,
      startDate,
      dueDate,
      assigneeEmails,
      status,
      priority,
    } = req.body;

    if (!projectId || !title) {
      return res
        .status(400)
        .json({ error: "Missing required fields: projectId or title." });
    }

    // Resolve string email arrays to real database User ObjectIds
    let memberIds = [];
    if (assigneeEmails && assigneeEmails.length > 0) {
      const foundUsers = await User.find({
        email: { $in: assigneeEmails },
      }).select("_id");
      memberIds = foundUsers.map((user) => user._id);
    }

    const newTask = new Task({
      project: projectId,
      title: title.trim(),
      owner: req.user.id,
      startDate: startDate || "",
      dueDate: dueDate || "",
      assigneeEmails: assigneeEmails || [],
      members: memberIds,
      status: status || "Todo",
      priority: priority || "Medium",
    });

    const savedTask = await newTask.save();

    return res.status(201).json({
      id: savedTask._id.toString(),
      projectId: savedTask.project.toString(),
      owner: savedTask.owner.toString(),
      title: savedTask.title,
      startDate: savedTask.startDate,
      dueDate: savedTask.dueDate,
      assigneeEmails: savedTask.assigneeEmails,
      members: savedTask.members.map((m) => m.toString()),
      status: savedTask.status,
      priority: savedTask.priority,
      createdAt: savedTask.createdAt,
      updatedAt: savedTask.updatedAt,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ error: error.message });
  }
};

export const getTasks = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find all project IDs where this user is the core project owner
    const ownedProjectIds = await Project.find({ owner: userId }).distinct(
      "_id",
    );

    //  Fetch all tasks that match ANY of these three conditions:
    //     The user is the creator of the task (task owner)
    //  The user is assigned to the task (task member)
    //    The task belongs to a project the user owns (project owner)
    const rawTasks = await Task.find({
      $or: [
        { owner: userId },
        { members: userId },
        { project: { $in: ownedProjectIds } },
      ],
    })
      .sort({ createdAt: -1 })
      .lean();

    const structuredTasks = rawTasks.map(
      ({ _id, __v, project, owner, members, ...rest }) => ({
        id: _id.toString(),
        projectId: project.toString(),
        owner: owner.toString(),
        members: members.map((m) => m.toString()),
        ...rest,
      }),
    );

    return res.status(200).json(structuredTasks);
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Failed to compile complete frontend task matrix." });
  }
};
export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, startDate, dueDate, assigneeEmails, status, priority } =
      req.body;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ error: "Task target not found." });
    }

    const project = await Project.findById(task.project);

    //  Establish precise workspace roles
    const isTaskOwner = task.owner.toString() === req.user.id.toString();
    const isProjectOwner =
      project && project.owner.toString() === req.user.id.toString();
    const isMember = task.members
      .map((m) => m.toString())
      .includes(req.user.id.toString());

    //  Global Safety Guard: If they aren't part of this task at all, block them completely
    if (!isTaskOwner && !isProjectOwner && !isMember) {
      return res
        .status(403)
        .json({ error: "Not authorized to access this task workspace." });
    }

    //  Conditional Privilege Rule: If they are only a regular member/assignee
    if (isMember && !isTaskOwner && !isProjectOwner) {
      // Catch any attempt to change metadata fields and block it
      if (
        title !== undefined ||
        startDate !== undefined ||
        dueDate !== undefined ||
        assigneeEmails !== undefined ||
        priority !== undefined
      ) {
        return res
          .status(403)
          .json({ error: "Assignees are restricted to status updates only." });
      }
    }

    // Status can be updated by anyone who passed the validation layer above (Owners + Members)
    if (status !== undefined) task.status = status;

    // Administrative fields - only editable if execution flow belongs to an owner
    if (isTaskOwner || isProjectOwner) {
      if (title !== undefined) task.title = title.trim();
      if (startDate !== undefined) task.startDate = startDate;
      if (dueDate !== undefined) task.dueDate = dueDate;
      if (priority !== undefined) task.priority = priority;

      // Re-resolve email pointers to true user ObjectIds
      if (assigneeEmails !== undefined) {
        task.assigneeEmails = assigneeEmails;
        const foundUsers = await User.find({
          email: { $in: assigneeEmails },
        }).select("_id");
        task.members = foundUsers.map((user) => user._id);
      }
    }

    // Save changes safely to MongoDB
    const updatedTask = await task.save();

    //  Return standardized response JSON payload structure
    return res.status(200).json({
      id: updatedTask._id.toString(),
      projectId: updatedTask.project.toString(),
      owner: updatedTask.owner.toString(),
      title: updatedTask.title,
      startDate: updatedTask.startDate,
      dueDate: updatedTask.dueDate,
      assigneeEmails: updatedTask.assigneeEmails,
      members: updatedTask.members.map((m) => m.toString()),
      status: updatedTask.status,
      priority: updatedTask.priority,
      createdAt: updatedTask.createdAt,
      updatedAt: updatedTask.updatedAt,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ error: error.message });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ error: "Task target not found." });
    }

    const project = await Project.findById(task.project);

    const isTaskOwner = task.owner.toString() === req.user.id.toString();
    const isProjectOwner =
      project && project.owner.toString() === req.user.id.toString();

    // Guard: Only task creator or global project creator can trigger deletion
    if (!isTaskOwner && !isProjectOwner) {
      return res
        .status(403)
        .json({ error: "Not authorized to drop this task." });
    }

    await task.deleteOne();
    return res
      .status(200)
      .json({ success: true, message: "Task dropped successfully." });
  } catch (error) {
    return res.status(500).json({ error: "Task deletion sequence failed." });
  }
};
