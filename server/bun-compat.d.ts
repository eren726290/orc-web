// Bun 1.4.2 refers to names missing from the pinned Node 22 declarations.
// Reuse the equivalent upstream types; keep full library checking enabled.
import "node:util";
import "node:tls";

declare module "node:util" {
  type TextEncoderEncodeIntoResult = import("node:util").EncodeIntoResult;
}

declare global {
  type ConnectionOptions = import("node:tls").ConnectionOptions;
  type KeyObject = import("node:crypto").KeyObject;
  type TLSSocket = import("node:tls").TLSSocket;
}
