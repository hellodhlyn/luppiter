import * as grpc from "grpc";
import { createConnection } from "typeorm";

import app from "./app";
import CertificateGrpcService from "./grpc/certificate";
import { Permission } from "./models/auth/permission";
import ormconfig from "./ormconfig";

async function startServer() {
  // Establish database connection.
  await createConnection(ormconfig);
  await Permission.sync();

  // Start web server.
  const port = process.env.PORT || 8080;
  app.listen(port, () => {
    // tslint:disable-next-line:no-console
    console.log(`Server started at http://localhost:${port}`);
  });

  const certServer = new CertificateGrpcService().getServer();
  const certServerPort = process.env.GRPC_CERTIFICATE_PORT || "50051";
  certServer.bind(`0.0.0.0:${certServerPort}`, grpc.ServerCredentials.createInsecure());
  certServer.start();
}

startServer();
