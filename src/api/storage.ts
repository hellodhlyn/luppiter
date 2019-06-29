import { Request, Response } from "express";
import { UploadedFile } from "express-fileupload";
import fileType from "file-type";
import fs from "fs";

import { StorageBucket } from "../models/storage/bucket";
import StorageService from "../services/storage";

const service = new StorageService();
const cachePath = process.env.LUPPITER_STORAGE_CACHE_PATH || "/tmp";

async function readFile(req: Request, res: Response) {
  const { namespace, key } = req.params;
  const cacheFile = `${cachePath}/${namespace}/${key}`;

  const bucket = await StorageBucket.findOne({ name: namespace });
  if (!bucket || (!bucket.isPublic && bucket.member)) {
    res.sendStatus(401);
    return;
  }

  let fileBody: Buffer;
  if (!fs.existsSync(cacheFile)) {
    try {
      const result = await service.read(req.params.namespace, req.params.key);
      fileBody = result.Body as Buffer;
    } catch (e) {
      res.sendStatus((e.code === "NoSuchKey") ? 404 : 500);
      return;
    }

    if (!fs.existsSync(`${cachePath}/${namespace}`)) {
      fs.mkdirSync(`${cachePath}/${namespace}`, { recursive: true, mode: 0o700 });
    }
    fs.writeFileSync(cacheFile, fileBody, { mode: 0o600 });
  } else {
    fileBody = fs.readFileSync(cacheFile);
  }

  res.header("Content-Type", fileType(fileBody).mime).send(fileBody);
}

async function writeFile(req: Request, res: Response) {
  const file = req.files.file as UploadedFile;
  try {
    await service.write(req.params.namespace, req.params.key, file.data, file.mimetype);
    res.sendStatus(201);
  } catch (e) {
    res.sendStatus(500);
  }
}

export default { readFile, writeFile };
