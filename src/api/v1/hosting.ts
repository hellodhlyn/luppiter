import { Request, Response } from "express";
import expressContext from "express-http-context";

import { ApiKey } from "../../models/auth/api_key";
import { Certificate } from "../../models/certs/certificate";
import HostingBackend from "../../models/hosting/backend";
import LuppiterStorageBackend from "../../models/hosting/backends/luppiter-storage";
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
//   "domain": "string?",
//   "certificateUuid": "string",
//   "backendType": "storage",
//   "backendProps": {}
// }
async function createInstance(req: Request, res: Response) {
  if (await HostingInstance.findOne({ name: req.body.name })) {
    res.status(400).json({ error: "duplicated_entry" });
    return;
  }

  const apiKey: ApiKey = expressContext.get("request:api_key");
  const cert = await Certificate.findOne({ where: { uuid: req.body.certificateUuid }, relations: ["member"] });
  if (!cert || cert.member.id !== apiKey.member.id) {
    res.status(400).json({ error: "invalid_certificate" });
    return;
  }

  const instance = new HostingInstance();
  instance.member = apiKey.member;
  instance.domain = req.body.domain || null;
  instance.name = req.body.name;
  instance.certificate = cert;
  await instance.save();

  const backend = await createBackend(req.body.backendType, req.body.backendProps);
  backend.instance = instance;
  await backend.save();

  res.json(instance.toJson());
}

interface LuppiterStorageBackendOption {
  bucketName: string;
  filePrefix: string;
  redirectToIndex: boolean;
}

function createBackend(type: string, props: {}): HostingBackend {
  switch (type) {
    case "storage":
      const opts = props as LuppiterStorageBackendOption;

      const backend = new LuppiterStorageBackend();
      backend.bucketName = opts.bucketName;
      backend.filePrefix = opts.filePrefix;
      backend.redirectToIndex = opts.redirectToIndex;
      return backend;

    default:
      throw Error(`No such backend type: ${type}`);
  }
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
