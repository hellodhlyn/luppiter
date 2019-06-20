import axios from "axios";
import crypto from "crypto";
import { Request, Response } from "express";
import { Agent } from "https";

import { ApiKey } from "../../models/auth/api_key";
import { Member } from "../../models/auth/member";

async function authenticate(token: string) {
  const config = {
    headers: { Authorization: `Bearer ${token}` },
    httpsAgent: new Agent({ rejectUnauthorized: false }),
  };
  const res = await axios.get("https://auth.lynlab.co.kr/apis/v1/me", config);
  return res.data;
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
  const token = req.headers.authorization.split(" ").pop();
  let member;
  try {
    const me = await authenticate(token);
    member = await Member.findOne({ uuid: me.uuid });
    if (!member) {
      throw Error("unauthorized");
    }
  } catch (e) {
    res.sendStatus(401);
    return;
  }

  const keys = await ApiKey.find({ member });
  res.json(keys.map((key) => key.toJson()));
}

// POST /vulcan/auth/api_keys
//
// Request Body:
// {
//   "memo": "string"
// }
async function createApiKey(req: Request, res: Response) {
  const token = req.headers.authorization.split(" ").pop();
  let member;
  try {
    const me = await authenticate(token);
    member = await Member.findOne({ uuid: me.uuid });
    if (!member) {
      throw Error("unauthorized");
    }
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

export default {
  getMe,
  listApiKeys,
  createApiKey,
};
