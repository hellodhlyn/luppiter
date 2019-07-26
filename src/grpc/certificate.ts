import * as protoLoader from "@grpc/proto-loader";
import * as grpc from "grpc";

export default class CertificateGrpcService {
  private protoPath = __dirname + "../../../protos/certificate.proto";
  private server: grpc.Server;

  public getServer() {
    if (!this.server) {
      const packageDef = protoLoader.loadSync(this.protoPath, {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
      });
      const { certificate } = grpc.loadPackageDefinition(packageDef) as any;

      this.server = new grpc.Server();
      this.server.addService(certificate.Certificate.service, {
        registerClient: this.registerClient,
        fetchDomains: this.fetchDomains,
        verifiedCallback: this.verifiedCallback,
      });
    }

    return this.server;
  }

  // TODO - implement
  private registerClient(call: any, callback: any) {
    const { uuid } = call.request;
    callback(null, { email: "", privKey: "" });
  }

  // TODO - implement
  private fetchDomains(call: any, callback: any) {
    const { uuid } = call.request;
    callback(null, { domains: [""], dnsToken: "" });
  }

  // TODO - implement
  private verifiedCallback(call: any, callback: any) {
    const { uuid, csr, privKey, certificate } = call.request;
    callback(null, {});
  }
}
