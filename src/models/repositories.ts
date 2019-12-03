import { Connection, createConnection, EntitySchema, ObjectType, Repository } from "typeorm";
import ormconfig from "../ormconfig";

let connection: Connection;

async function getRepository<T>(target: ObjectType<T> | EntitySchema<T> | string): Promise < Repository < T >> {
  if (!connection) {
    connection = await createConnection(ormconfig);
  }

  return await connection.getRepository(target);
}

export default {
  getRepository,
};
