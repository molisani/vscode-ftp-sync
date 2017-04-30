import filesize = require("filesize");
import path = require("path");

import { showQuickPick } from "../output";
import { ListEntry, RemoteClient } from "../remote-client";
import { downloadSelected } from "./sync-selected";

function byDirectoryByName(a: ListEntry, b: ListEntry): number {
  if (a.isDirectory !== b.isDirectory) {
    return (a.isDirectory) ? -1 : 1;
  } else {
    return (a.name < b.name) ? -1 : 1;
  }
}

function selectEntry(entries: ListEntry[], directoryPath: string): Promise<ListEntry> {
  entries.sort(byDirectoryByName);
  return showQuickPick<ListEntry>(entries.map((entry) => {
    entry.name = path.join(directoryPath, entry.name);
    return {
      "label": entry.name,
      "description": entry.isDirectory ? "Download entire directory or browse contents." : filesize(entry.size),
      "value": entry,
    };
  }), "Select a file or subdirectory to download.");
}

function selectEntryFromDirectory(client: RemoteClient, directoryPath: string = "."): Promise<ListEntry> {
  return client.listContents(directoryPath).then((entries) => {
    return selectEntry(entries, directoryPath);
  });
}

type DirectoryAction = "download-safe" | "download-force" | "browse";

function selectDirectoryAction(): Promise<DirectoryAction> {
  return showQuickPick<DirectoryAction>([
    {
      "label": "Download",
      "description": "Download contents of this directory, obeying path matching rules.",
      "value": "download-safe",
    },
    {
      "label": "Download All",
      "description": "Download all contents of this directory.",
      "value": "download-force",
    },
    {
      "label": "Browse",
      "description": "Recurse into directory to browse contents.",
      "value": "browse",
    },
  ], "Select action for this directory.");
}

function processEntry(client: RemoteClient, entry: ListEntry): Promise<any> {
  if (entry.isDirectory) {
    return selectDirectoryAction().then((action) => {
      if (action === "browse") {
        return selectEntryFromDirectory(client, entry.name).then((subentry) => {
          return processEntry(client, subentry);
        });
      } else {
        const force = (action === "download-force");
        return client.downloadDirectory(entry.name, force);
      }
    });
  } else {
    return client.downloadFile(entry.name);
  }
}

export function browseRemote(client: RemoteClient): Promise<any> {
  return selectEntryFromDirectory(client).then((entry) => {
    return processEntry(client, entry);
  });
}
