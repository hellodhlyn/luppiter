import { Request, Response } from "express";
import expressContext from "express-http-context";

import { ApiKey } from "../../models/auth/api_key";
import { Certificate } from "../../models/certs/certificate";

// GET /vulcan/certs/certificates
//
// Required permission: `Certs::Read`
async function listCertificates(_: Request, res: Response) {
  const apiKey: ApiKey = expressContext.get("request:api_key");
  const certs = await Certificate.find({ member: apiKey.member });
  res.json(certs.map((cert) => cert.toJson()));
}

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
  listCertificates,
  createCertificate,
};
