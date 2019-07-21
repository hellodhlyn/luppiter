import axios from "axios";
import queryString from "query-string";

import {
  CFOutput,
  DeleteZonesDNSRecordOutput,
  GetUserTokensVerifyOutput,
  GetZonesDNSRecordsInput,
  GetZonesDNSRecordsOutput,
  PostZonesDNSRecordInput,
  PostZonesDNSRecordOutput,
} from "./responses";

export default class CloudflareClient {

  public static getInstance(apiToken: string) {
    if (!CloudflareClient.instanceStore.has(apiToken)) {
      const instance = new CloudflareClient(apiToken);
      CloudflareClient.instanceStore.set(apiToken, instance);
    }

    return CloudflareClient.instanceStore.get(apiToken);
  }
  private static endpoint = "https://api.cloudflare.com/client/v4";
  private static instanceStore: Map<string, CloudflareClient> = new Map();

  private apiToken: string;

  private constructor(apiToken: string) {
    this.apiToken = apiToken;
  }

  public async userTokensVerify(): Promise<GetUserTokensVerifyOutput> {
    return this.get<GetUserTokensVerifyOutput>("/user/tokens/verify");
  }

  public async listZonesDnsRecords(zoneId: string, params: GetZonesDNSRecordsInput): Promise<GetZonesDNSRecordsOutput> {
    return this.get<GetZonesDNSRecordsOutput>(`/zones/${zoneId}/dns_records`, params);
  }

  public async postZonesDnsRecord(zoneId: string, data: PostZonesDNSRecordInput): Promise<PostZonesDNSRecordOutput> {
    return this.post<PostZonesDNSRecordOutput>(`/zones/${zoneId}/dns_records`, data);
  }

  public async deleteZonesDnsRecord(zoneId: string, identifier: string): Promise<DeleteZonesDNSRecordOutput> {
    return this.delete<DeleteZonesDNSRecordOutput>(`/zones/${zoneId}/dns_records/${identifier}`);
  }

  private get<T>(path: string, params?: object): Promise<T> {
    const opts = {
      headers: {
        "Authorization": `Bearer ${this.apiToken}`,
        "Content-Type": "application/json; charset=utf-8",
      },
    };

    return new Promise((resolve, reject) => {
      axios.get(`${CloudflareClient.endpoint}${path}?${params ? queryString.stringify(params) : ""}`, opts)
        .then((res) => resolve(res.data))
        .catch((e) => reject(e));
    });
  }

  private post<T>(path: string, data?: any): Promise<T> {
    const opts = {
      headers: {
        "Authorization": `Bearer ${this.apiToken}`,
        "Content-Type": "application/json; charset=utf-8",
      },
    };

    return new Promise((resolve, reject) => {
      axios.post(`${CloudflareClient.endpoint}${path}`, data, opts)
        .then((res) => resolve(res.data))
        .catch((e) => reject(e));
    });
  }

  private delete<T>(path: string): Promise<T> {
    const opts = {
      headers: {
        "Authorization": `Bearer ${this.apiToken}`,
        "Content-Type": "application/json; charset=utf-8",
      },
    };

    return new Promise((resolve, reject) => {
      axios.delete(`${CloudflareClient.endpoint}${path}`, opts)
        .then((res) => resolve(res.data))
        .catch((e) => reject(e));
    });
  }

}
