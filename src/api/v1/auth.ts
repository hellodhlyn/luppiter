import axios from "axios";
import crypto from "crypto";
import { Request, Response } from "express";
import { Agent } from "https";
import { Like } from "typeorm";

import { ApiKey } from "../../models/auth/api_key";
import { Member } from "../../models/auth/member";
import { Permission } from "../../models/auth/permission";

async function authenticate(token: string) {
  const config = {
    headers: { Authorization: `Bearer ${token}` },
    httpsAgent: new Agent({ rejectUnauthorized: false }),
  };
  const res = await axios.get("https://auth.lynlab.co.kr/apis/v1/me", config);
  return res.data;
}

async function getMember(token: string): Promise<Member> {
  const me = await authenticate(token);
  const member = await Member.findOne({ uuid: me.uuid });
  if (!member) {
    throw Error("unauthorized");
  }

  return member;
}

// GET /vulcan/auth/me
// `Authorization` header required.
async function getMe(req: Request, res: Response) {
  const token = req.headers.authorization.split(" ").pop();
  let me;
  try {
    me = await authenticate(token);
  } catch (e) {
    res.sendStatus(401);
    return;
  }

  let member = await Member.findOne({ uuid: me.uuid });
  if (!member) {
    member = new Member();
    member.uuid = me.uuid;
    await member.save();
  }

  res.json(me);
}

// GET /vulcan/auth/api_keys
async function listApiKeys(req: Request, res: Response) {
  let member: Member;
  try {
    member = await getMember(req.headers.authorization.split(" ").pop());
  } catch (e) {
    res.sendStatus(401);
    return;
  }

  const keys = await ApiKey.find({ where: { member }, relations: ["permissions"] });
  res.json(keys.map((key) => key.toJson()));
}

// POST /vulcan/auth/api_keys
//
// Request Body:
// {
//   "memo": "string"
// }
async function createApiKey(req: Request, res: Response) {
  let member: Member;
  try {
    member = await getMember(req.headers.authorization.split(" ").pop());
  } catch (e) {
    res.sendStatus(401);
    return;
  }

  const key = new ApiKey();
  key.key = crypto.randomBytes(20).toString("hex");
  key.member = member;
  key.memo = req.body.memo;
  await key.save();

  res.json(key.toJson());
}

// DELETE /vulcan/auth/api_keys/{key}
async function deleteApiKey(req: Request, res: Response) {
  let member: Member;
  try {
    member = await getMember(req.headers.authorization.split(" ").pop());
  } catch (e) {
    res.sendStatus(401);
    return;
  }

  const key = await ApiKey.findOne({ where: { key: req.params.key }, relations: ["member", "permissions"] });
  if (!key || key.member.id !== member.id) {
    res.sendStatus(400);
  }

  await key.remove();
  res.json(key.toJson());
}

// GET /vulcan/auth/api_keys/{key}/permissions
async function listKeyPermissions(req: Request, res: Response) {
  let member: Member;
  try {
    member = await getMember(req.headers.authorization.split(" ").pop());
  } catch (e) {
    res.sendStatus(401);
    return;
  }

  const key = await ApiKey.findOne({ where: { key: req.params.key }, relations: ["member", "permissions"] });
  if (key.member.id !== member.id) {
    res.sendStatus(401);
    return;
  }

  res.json(key.permissions.map((p) => p.toJson()));
}

// POST /vulcan/auth/api_keys/{key}/permissions
//
// Request Body:
// {
//   "key": "string"
// }
async function addKeyPermission(req: Request, res: Response) {
  let member: Member;
  try {
    member = await getMember(req.headers.authorization.split(" ").pop());
  } catch (e) {
    res.sendStatus(401);
    return;
  }

  const key = await ApiKey.findOne({ where: { key: req.params.key }, relations: ["member", "permissions"] });
  if (key.member.id !== member.id) {
    res.sendStatus(401);
    return;
  }

  const permission = await Permission.findOne({ key: req.body.key });
  if (!permission) {
    res.sendStatus(400);
    return;
  }

  if (!key.permissions) {
    key.permissions = [permission];
  } else if (key.permissions.findIndex((p) => p.key === permission.key) === -1) {
    key.permissions.push(permission);
  }
  await key.save();

  res.json(key.permissions.map((p) => p.toJson()));
}

// DELETE /vulcan/auth/api_keys/{key}/permissions
//
// Request Body:
// {
//   "key": "string"
// }
async function removeKeyPermission(req: Request, res: Response) {
  let member: Member;
  try {
    member = await getMember(req.headers.authorization.split(" ").pop());
  } catch (e) {
    res.sendStatus(401);
    return;
  }

  const key = await ApiKey.findOne({ where: { key: req.params.key }, relations: ["member", "permissions"] });
  if (key.member.id !== member.id) {
    res.sendStatus(401);
    return;
  }

  key.permissions = key.permissions.filter((p) => p.key !== req.body.key);
  await key.save();

  res.sendStatus(200);
}

// GET /vulcan/auth/permissions
//
// Query params:
//   - query (string)
async function listPermissions(req: Request, res: Response) {
  const { query } = req.query;
  if (!query || query.length < 2) {
    res.json([]);
    return;
  }

  const permissions = await Permission.find({ key: Like(`%${req.query.query}%`) });
  res.json(permissions.map((p) => p.toJson()));
}

export default {
  getMe,
  listApiKeys,
  createApiKey,
  deleteApiKey,
  listKeyPermissions,
  addKeyPermission,
  removeKeyPermission,
  listPermissions,
};
