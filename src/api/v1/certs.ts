import { Request, Response } from "express";
import expressContext from "express-http-context";

import { ApiKey } from "../../models/auth/api_key";
import { Certificate } from "../../models/certs/certificate";

// POST /vulcan/certs/certificates
//
// Required permission: `Certs::Write`
// {
//   "email": "string",
//   "domains": ["string"]
// }
async function createCertificate(req: Request, res: Response) {
  const apiKey: ApiKey = expressContext.get("request:api_key");

  const cert = new Certificate();
  cert.member = apiKey.member;
  cert.email = req.body.email;
  cert.domains = req.body.domains;
  await cert.save();

  res.json(cert.toJson());
}

export default {
  createCertificate,
};
