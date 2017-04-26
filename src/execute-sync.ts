
import { RemoteClient } from "./remote-client";

import { validateConfig } from "./sync-config";

export function executeSync(upload: boolean, remote: RemoteClient) {

  if (!validateConfig()) {
    return;
  }



}
