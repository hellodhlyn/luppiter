import * as protoLoader from "@grpc/proto-loader";
import * as grpc from "grpc";
import { Certificate } from "../models/certs/certificate";
import { CertificateProvision } from "../models/certs/certificate-provision";

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

  private async registerClient(call: any, callback: any) {
    const { uuid } = call.request;
    const cert = await Certificate.findOne({ uuid });
    callback(null, { email: cert.email });
  }

  private async fetchDomains(call: any, callback: any) {
    const { uuid } = call.request;
    const cert = await Certificate.findOne({ uuid });
    callback(null, { domains: cert.domains, dnsToken: cert.dnsToken });
  }

  private async verifiedCallback(call: any, callback: any) {
    const { uuid, csr, privKey, certificate } = call.request;

    const cert = await Certificate.findOne({ where: { uuid }, relations: ["provisions"] });

    const provision = new CertificateProvision();
    provision.certificateModel = cert;
    provision.revision = cert.lastRevision() + 1;
    provision.csr = csr;
    provision.privateKey = privKey;
    provision.certificate = certificate;
    provision.expireAt = new Date(new Date().getTime() + 90 * 24 * 60 * 60 * 1000);

    callback(null, {});
  }
}
