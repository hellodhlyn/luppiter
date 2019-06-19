import axios from "axios";
import { Request, Response } from "express";
import { Agent } from "https";

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

export default {
  getMe,
};
