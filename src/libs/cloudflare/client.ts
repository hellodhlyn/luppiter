import axios from "axios";
import queryString from "query-string";

interface CFOutput<T> {
  success: boolean;
  result?: T;
  result_info?: CFResultInfo;
  messages?: CFOutputMessage[];
  errors?: any[];
}

interface CFOutputMessage {
  code: number;
  message: string;
  type: any;
}

interface CFResultInfo {
  page: number;
  per_page: number;
  total_pages: number;
  count: number;
  total_count: number;
}

interface DeleteResult {
  id: string;
}

///
/// User token verify responses
///
interface GetUserTokensVerifyResult {
  id: string;
  status: string;
}

interface GetUserTokensVerifyOutput extends CFOutput<GetUserTokensVerifyResult> {}

///
/// Zone DNS record apis
///
interface DNSRecord {
  id: string;
  type: string;
  name: string;
  content: string;
  proxiable: boolean;
  proxied: boolean;
  ttl: number;
  locked: boolean;
  zone_id: string;
  zone_name: string;
  created_on: string;
  modified_on: string;
  data: object;
}

interface GetZonesDNSRecordsInput {
  type?: string;
  name?: string;
  content?: string;
  page?: number;
  per_page?: number;
  order?: string;
  direction?: string;
  match?: string;
}

interface PostZonesDNSRecordInput {
  type: string;
  name: string;
  content: string;
  ttl?: number;
  priority?: number;
  proxied?: boolean;
}

interface GetZonesDNSRecordsOutput extends CFOutput<DNSRecord[]> {}
interface PostZonesDNSRecordOutput extends CFOutput<DNSRecord> {}
interface DeleteZonesDNSRecordOutput extends CFOutput<DeleteResult> {}

export class CloudflareClient {

  private static endpoint = "https://api.cloudflare.com/client/v4";

  constructor(private readonly apiToken: string) {}

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
