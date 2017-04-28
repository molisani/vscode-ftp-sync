
import { RemoteClient } from "../remote-client";

import { RemoteSyncConfig, validateConfig } from "../sync-config";

export function syncDirectory(upload: boolean, config: RemoteSyncConfig, client: RemoteClient): Promise<void> {


  return client.listRemoteFiles(".");

}

export function uploadDirectory(config: RemoteSyncConfig, client: RemoteClient): Promise<void> {
  return syncDirectory(true, config, client);
}

export function downloadDirectory(config: RemoteSyncConfig, client: RemoteClient): Promise<void> {
  return syncDirectory(false, config, client);
}
