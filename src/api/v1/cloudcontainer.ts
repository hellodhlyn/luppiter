import { Request, Response } from "express";
import expressContext from "express-http-context";

import { ApiKey } from "../../models/auth/api_key";
import { CloudContainerTask } from "../../models/cloudcontainer/task";

// GET /vulcan/cloudcontainer/tasks
//
// Required permission: `CloudContainer::Write`
async function listTasks(_: Request, res: Response) {
  const apiKey: ApiKey = expressContext.get("request:api_key");
  const tasks = await CloudContainerTask.find({ member: apiKey.member });
  res.json(tasks.map((task) => task.toJson()));
}

// POST /vulcan/cloudcontainer/tasks
//
// Required permission: `CloudContainer::Write`
// Request Body:
// {
//   "name": "string",
//   "image": "string",
//   "commands": ["string"],
//   "envs": ["string"]
// }
async function createTask(req: Request, res: Response) {
  const apiKey: ApiKey = expressContext.get("request:api_key");

  const task = new CloudContainerTask();
  task.member = apiKey.member;
  task.name = req.body.name;
  task.dockerImage = req.body.image;
  task.dockerCommands = req.body.commands;
  task.dockerEnvs = req.body.envs;
  await task.save();

  res.json(task.toJson());
}

// PUT /vulcan/cloudcontainer/tasks/:uuid
//
// Required permission: `CloudContainer::Write`
// Request Body:
// {
//   "name": "string?",
//   "image": "string?",
//   "commands": ["string"]?,
//   "envs": ["string"]?
// }
async function updateTask(req: Request, res: Response) {
  const apiKey: ApiKey = expressContext.get("request:api_key");
  const task = await CloudContainerTask.findOne({ where: { uuid: req.params.uuid }, relations: ["member"] });
  if (!task || apiKey.member.id !== task.member.id) {
    res.status(401).json({ error: "invalid_uuid" });
    return;
  }

  if (req.body.name) {
    task.name = req.body.name;
  }
  if (req.body.image) {
    task.dockerImage = req.body.image;
  }
  if (req.body.commands) {
    task.dockerCommands = req.body.commands;
  }
  if (req.body.envs) {
    task.dockerEnvs = req.body.envs;
  }
  await task.save();

  res.json(task.toJson());
}

// DELETE /vulcan/cloudcontainer/tasks/:uuid
//
// Required permission: `CloudContainer::Write`
async function deleteTask(req: Request, res: Response) {
  const apiKey: ApiKey = expressContext.get("request:api_key");
  const task = await CloudContainerTask.findOne({ where: { uuid: req.params.uuid }, relations: ["member"] });
  if (!task || apiKey.member.id !== task.member.id) {
    res.status(401).json({ error: "invalid_uuid" });
    return;
  }

  await task.remove();

  res.json(task.toJson());
}

// POST /vulcan/cloudcontainer/tasks/:uuid/run
//
// Required permission: `CloudContainer::Write`
// Request Body:
// {
//   "envs": ["string"]?
// }
async function runTask(req: Request, res: Response) {
  const apiKey: ApiKey = expressContext.get("request:api_key");
  const task = await CloudContainerTask.findOne({ where: { uuid: req.params.uuid }, relations: ["member"] });
  if (!task || apiKey.member.id !== task.member.id) {
    res.status(401).json({ error: "invalid_uuid" });
    return;
  }

  try {
    await task.run();
    res.sendStatus(201);
  } catch (e) {
    res.status(500).json({ error: "start_task_failed" });
  }
}

export default {
  listTasks,
  createTask,
  updateTask,
  deleteTask,
  runTask,
};
