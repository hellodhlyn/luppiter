import S3 from "aws-sdk/clients/s3";

export default class StorageService {
  private s3: S3;
  private bucketName = "luppiter.lynlab.co.kr";

  constructor() {
    this.s3 = new S3({ region: "ap-northeast-2" });
  }

  public read(namespace: string, key: string): Promise<S3.GetObjectOutput> {
    const params = {
      Bucket: this.bucketName,
      Key: `${namespace}/${key}`,
    };

    return new Promise((resolve, reject) => {
      this.s3.getObject(params, (err, data) => {
        err ? reject(err) : resolve(data);
      });
    });
  }

  public write(namespace: string, key: string, buffer: Buffer, contentType: string): Promise<S3.PutObjectOutput> {
    const params = {
      Bucket: this.bucketName,
      Key: `${namespace}/${key}`,
      Body: buffer,
      ContentType: contentType,
    };

    return new Promise((resolve, reject) => {
      this.s3.putObject(params, (err, data) => {
        err ? reject(err) : resolve(data);
      });
    });
  }
}
