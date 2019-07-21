export interface CFOutput<T> {
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

export interface GetUserTokensVerifyOutput extends CFOutput<GetUserTokensVerifyResult> {}

///
/// Zone DNS record apis
///
export interface DNSRecord {
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

export interface GetZonesDNSRecordsInput {
  type?: string;
  name?: string;
  content?: string;
  page?: number;
  per_page?: number;
  order?: string;
  direction?: string;
  match?: string;
}

export interface PostZonesDNSRecordInput {
  type: string;
  name: string;
  content: string;
  ttl?: number;
  priority?: number;
  proxied?: boolean;
}

export interface GetZonesDNSRecordsOutput extends CFOutput<DNSRecord[]> {}
export interface PostZonesDNSRecordOutput extends CFOutput<DNSRecord> {}
export interface DeleteZonesDNSRecordOutput extends CFOutput<DeleteResult> {}
