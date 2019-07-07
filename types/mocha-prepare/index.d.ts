declare module "mocha-prepare" {
  export default function prepare(
    onPrepare: (done: (e?: any) => void) => void,
    onUnprepare?: (done: (e?: any) => void) => void,
  ): void;
}
