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
      assignees,
      status,
      priority,
    } = req.body;

    // Validate required fields
    if (!projectId || !title) {
      return res
        .status(400)
        .json({ error: "Missing required fields: projectId or title." });
    }

    // Instantiating the new task model
    const newTask = new Task({
      project: projectId,
      title: title.trim(),
      owner: req.user.id,
      startDate: startDate || "",
      dueDate: dueDate || "",
      assignees: assignees || [],
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
      assignees: savedTask.assignees.map((id) => id.toString()),
      status: savedTask.status,
      priority: savedTask.priority,
      createdAt: savedTask.createdAt,
      updatedAt: savedTask.updatedAt,
    });
  } catch (error) {
    console.error("Error creating task:", error);
    return res.status(400).json({ error: error.message });
  }
};

export const getTasks = async (req, res) => {
  try {
    const userId = req.user.id;

    const ownedProjectIds = await Project.find({ owner: userId }).distinct(
      "_id",
    );

    const rawTasks = await Task.find({
      $or: [
        { owner: userId },
        { assignees: userId },
        { project: { $in: ownedProjectIds } },
      ],
    })
      .sort({ createdAt: -1 })

      .populate("assignees", "_id name email avatar")
      .lean();

    const structuredTasks = rawTasks.map(
      ({ _id, __v, project, owner, assignees, ...rest }) => ({
        id: _id.toString(),
        projectId: project.toString(),
        owner: owner.toString(),

        assignees: (assignees || []).map((user) => ({
          _id: user._id.toString(),
          name: user.name,
          email: user.email,
          avatar: user.avatar || "",
        })),
        ...rest,
      }),
    );

    return res.status(200).json(structuredTasks);
  } catch (error) {
    console.error("Error compiling task matrix:", error);
    return res
      .status(500)
      .json({ error: "Failed to compile complete frontend task matrix." });
  }
};
export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, startDate, dueDate, assignees, status, priority } = req.body;
    const currentUserId = req.user.id.toString();

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ error: "Task target not found." });
    }

    const project = await Project.findById(task.project);

    const isTaskOwner = task.owner.toString() === currentUserId;
    const isProjectOwner =
      project && project.owner.toString() === currentUserId;
    const isAssignee = (task?.assignees || [])
      .filter((a) => a !== null && a !== undefined)
      .map((a) => a.toString())
      .includes(currentUserId);

    // Global Safety Guard: If they aren't part of this task at all, block them completely
    if (!isTaskOwner && !isProjectOwner && !isAssignee) {
      return res
        .status(403)
        .json({ error: "Not authorized to access this task workspace." });
    }

    if (isAssignee && !isTaskOwner && !isProjectOwner) {
      if (
        title !== undefined ||
        startDate !== undefined ||
        dueDate !== undefined ||
        assignees !== undefined ||
        priority !== undefined
      ) {
        return res
          .status(403)
          .json({ error: "Assignees are restricted to status updates only." });
      }
    }

    if (status !== undefined) task.status = status;

    if (isTaskOwner || isProjectOwner) {
      if (title !== undefined) task.title = title.trim();
      if (startDate !== undefined) task.startDate = startDate;
      if (dueDate !== undefined) task.dueDate = dueDate;
      if (priority !== undefined) task.priority = priority;

      if (assignees !== undefined) {
        task.assignees = assignees;
      }
    }

    const updatedTask = await task.save();

    return res.status(200).json({
      id: updatedTask._id.toString(),
      projectId: updatedTask.project.toString(),
      owner: updatedTask.owner.toString(),
      title: updatedTask.title,
      startDate: updatedTask.startDate,
      dueDate: updatedTask.dueDate,
      assignees: updatedTask.assignees.map((a) => a.toString()), // Return clean ID strings
      status: updatedTask.status,
      priority: updatedTask.priority,
      createdAt: updatedTask.createdAt,
      updatedAt: updatedTask.updatedAt,
    });
  } catch (error) {
    console.error("Error updating task:", error);
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
