import * as protoLoader from "@grpc/proto-loader";
import * as grpc from "grpc";
import CloudflareClient from "../libs/cloudflare";
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
        registerChallenges: this.registerChallenges,
        verifiedCallback: this.verifiedCallback,
      });
    }

    return this.server;
  }

  private async registerClient(call: any, callback: any) {
    const { uuid } = call.request;
    const cert = await Certificate.findOne({ uuid });
    if (!cert) {
      callback(Error(`no such certificate: ${uuid}`));
      return;
    }

    cert.state = "initializing";
    await cert.save();

    callback(null, { email: cert.email });
  }

  private async fetchDomains(call: any, callback: any) {
    const { uuid } = call.request;
    const cert = await Certificate.findOne({ uuid });
    if (!cert) {
      callback(Error(`no such certificate: ${uuid}`));
      return;
    }

    cert.state = "verifying";
    await cert.save();

    callback(null, { domains: cert.domains, dnsToken: cert.dnsToken });
  }

  private async registerChallenges(call: any, callback: any) {
    const { uuid, records } = call.request;
    const cert = await Certificate.findOne({ uuid });
    if (!cert) {
      callback(Error(`no such certificate: ${uuid}`));
      return;
    }

    const cfToken = process.env.CLOUDFLARE_API_TOKEN;
    const cfZoneId = process.env.CLOUDFLARE_ZONE_ID;
    const cf = CloudflareClient.getInstance(cfToken);
    records.forEach(async (record: string) => {
      await cf.postZonesDnsRecord(cfZoneId, {
        type: "TXT",
        name: `${cert.dnsToken}.luppiter.dev`,
        content: record,
      });
    });

    callback(null, {});
  }

  private async verifiedCallback(call: any, callback: any) {
    const { uuid, csr, privKey, certificate } = call.request;
    const cert = await Certificate.findOne({ where: { uuid }, relations: ["provisions"] });
    if (!cert) {
      callback(Error(`no such certificate: ${uuid}`));
      return;
    }

    const provision = new CertificateProvision();
    provision.certificateModel = cert;
    provision.revision = cert.lastRevision() + 1;
    provision.csr = csr;
    provision.privateKey = privKey;
    provision.certificate = certificate;
    provision.expireAt = new Date(new Date().getTime() + 90 * 24 * 60 * 60 * 1000);
    await provision.save();

    try {
      cert.state = "issued";
      await cert.save();
    } catch (_) {
      // Ignore some buggy action.
      // https://github.com/typeorm/typeorm/issues/3801
    }

    callback(null, {});
  }
}
