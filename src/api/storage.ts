import { Request, Response } from "express";
import { UploadedFile } from "express-fileupload";

import StorageService from "../services/storage";

const service = new StorageService();

async function readFile(req: Request, res: Response) {
  let result;
  try {
    result = await service.read(req.params.namespace, req.params.key);
  } catch (e) {
    res.sendStatus((e.code === "NoSuchKey") ? 404 : 500);
    return;
  }

  res.header("Content-Type", result.ContentType).send(result.Body);
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
