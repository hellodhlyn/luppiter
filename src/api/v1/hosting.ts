import { Request, Response } from "express";
import expressContext from "express-http-context";

import { ApiKey } from "../../models/auth/api_key";
import HostingInstance from "../../models/hosting/instance";

// POST /vulcan/hosting/instances
// Required permission: `Hosting::Read`
async function listInstances(req: Request, res: Response) {
  const apiKey: ApiKey = expressContext.get("request:api_key");
  const instances = await HostingInstance.find({ member: apiKey.member });
  res.json(instances.map((i) => i.toJson()));
}

// POST /vulcan/hosting/instances
//
// Required permission: `Hosting::Write`
// Request Body:
// {
//   "name": "string"
// }
async function createInstance(req: Request, res: Response) {
  if (await HostingInstance.findOne({ name: req.body.name })) {
    res.status(400).json({ error: "duplicated_entry" });
    return;
  }

  const apiKey: ApiKey = expressContext.get("request:api_key");
  const instance = new HostingInstance();
  instance.member = apiKey.member;
  instance.name = req.body.name;
  await instance.save();

  res.json(instance.toJson());
}

// DELETE /vulcan/hosting/instances/:uuid
// Required permission: `Hosting::Write`
async function deleteInstance(req: Request, res: Response) {
  const apiKey: ApiKey = expressContext.get("request:api_key");
  const instance = await HostingInstance.findOne({ where: { uuid: req.params.uuid }, relations: ["member"] });
  if (!instance || instance.member.id !== apiKey.member.id) {
    res.sendStatus(401);
    return;
  }

  await instance.remove();
  res.json(instance.toJson());
}

export default {
  listInstances,
  createInstance,
  deleteInstance,
};
