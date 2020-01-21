import Docker from 'dockerode';

export class DockerClient {
  public static getInstance(): Docker {
    if (!DockerClient.instance) {
      DockerClient.instance = new Docker({
        host: process.env.DOCKER_REMOTE_HOST || '127.0.0.1',
        port: process.env.DOCKER_REMOTE_PORT || 2375,
        version: 'v1.39',
      });
    }

    return DockerClient.instance;
  }

  private static instance: Docker;
}
