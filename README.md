# Remote-Sync extension for VS Code

This extension is a TypeScript fork of the **[Ftp-sync](https://github.com/lukasz-wronski/vscode-ftp-sync)** extension.

This extension allows you to easily synchronise your local workspace (project files) with an FTP server. It also has several advanced features such as  __automatic upload on save__.

## Usage
The exposed functionality can be accessed from the command palette (Ctrl+Shift+P) or by right-clicking a file/directory in the explorer.

### Command Palette > Remote-Sync: Initialize Workspace
Initializes a default Remote-Sync configuration file in the `.vscode` directory if one does not already exist. Once created, it can be modified (changes are applied to next action). Required properties are **bolded**.

- **`remotePath`** - Absolute path of workspace on remote, defaults to `"./"`
- **`connection`** - Connection specification for remote server, currently supports FTP, SFTP, and local (for testing)
  - **`protocol`** - Specifies which protocol this specification is for, must be one of `"ftp"`, `"sftp"`, or `"local"`.
  - Other properties are dependent on the underlying protocol implementations
    - SFTP
      - `host` - Hostname or IP address of the server
      - `port` - Port number of the server
      - `forceIPv4` - Only connect via resolved IPv4 for `host`
      - `forceIPv6` - Only connect via resolved IPv6 for `host`
      - `username` - Username for authentication
      - `password` - Password for password-based user authentication
      - `agent` - Path to ssh-agent's UNIX socket for ssh-agent-based authentication (or 'pageant' when using Pageant on Windows)
      - `privateKeyPath` - Absolute path to private key for either key-based or hostbased user authentication (OpenSSH format)
      - `passphrase` - For an encrypted private key, this is the passphrase used to decrypt it
      - `localHostname` - Along with `localUsername` and `privateKeyPath`, set this to a non-empty string for hostbased user authentication
      - `localUsername` - Along with `localHostname` and `privateKey`, set this to a non-empty string for hostbased user authentication
      - `keepAliveInterval` - How often (in milliseconds) to send SSH-level keepalive packets to the server (0 disables)
      - `keepAliveCountMax` - How many consecutive, unanswered SSH-level keepalive packets that can be sent to the server before disconnection
      - `readyTimeout` - How long (in milliseconds) to wait for the SSH handshake to complete
      - `strictVendor` - Performs a strict server vendor check before sending vendor-specific requests
      - `agentForward` - Set to `true` to use OpenSSH agent forwarding (`auth-agent@openssh.com`) for the life of the connection
    - FTP
      - `host` - The hostname or IP address of the FTP server
      - `port` - The port of the FTP server
      - `secure` - Set to true for both control and data connection encryption, 'control' for control connection encryption only, or 'implicit' for implicitly encrypted control connection (this mode is deprecated in modern times, but usually uses port 990)
      - `user` - Username for authentication
      - `password` - Password for authentication
      - `connTimeout` - How long (in milliseconds) to wait for the control connection to be established
      - `pasvTimeout` - How long (in milliseconds) to wait for a PASV data connection to be established
      - `keepalive` - How often (in milliseconds) to send a 'dummy' (NOOP) command to keep the connection alive
- **`preferences`** - Preferences for how to perform syncs
  - `uploadOnSave` - When enabled, saving a file will also upload it to the remote server
  - `safety` - Safety-level to be used when syncing workspace, if undefined extension will prompt on sync
  - `remotePathMatching` / `localPathMatching` - Path matching specification for what gets sync'd
    - **`type`** - Whether to `"include"` or `"exclude"` the files that match any globs
    - **`globs`** - Array of globs to match against, see [minimatch](https://github.com/isaacs/minimatch) for documentation
  - `remoteRecursiveRemoveDirectory` / `localRecursiveRemoveDirectory` - Specifies whether removing a directory should also recursively remove all of that directory's contents
- `debug` - Enables additional logging to console

### Command Palette > Sync Workspace From Remote
Prompts for safety level if one was not specified in the configuration. Builds a diff from the remote server to the local filesystem for the entire workspace (following path matching rules). Then prompts for review before executing.

### Command Palette > Sync Workspace to Remote
Prompts for safety level if one was not specified in the configuration. Builds a diff from the local filesystem to the remote server for the entire workspace (following path matching rules). Then prompts for review before executing.

### Command Palette > Download Current File
Downloads file from remote server at path matching current file. This will ignore all path matching rules defined in the configuration.

### Command Palette > Upload Current File
Uploads file to remote server at path matching current file. This will ignore all path matching rules defined in the configuration.

### Command Palette > Browse Remote
Prompts user to select list entry of workspace on remote server. If a file is selected, downloads file to local filesystem. If a directory is selected, user can choose to download entire directory or browser contents for specific file.

### Right Click File > Download Selected File
Downloads file from remote server at path matching selected file. This will ignore all path matching rules defined in the configuration.

### Right Click File > Upload Selected File
Uploads file to remote server at path matching selected file. This will ignore all path matching rules defined in the configuration.

### Right Click File > Remove Selected File
Removes file from remote server at path matching selected file. This will ignore all path matching rules defined in the configuration. Once completed, removes file from local filesystem as well.

### Right Click Directory > Download Selected Directory
Downloads entire directory from remote server at path matching selected directory. This will follow all path matching rules defined in the configuration.

### Right Click Directory > Upload Selected Directory
Uploads entire directory to remote server at path matching selected file. This will follow all path matching rules defined in the configuration.

### Right Click Directory > Remove Selected Directory
Removes entire directory from remote server at path matching selected directory. This will follow all path matching rules defined in the configuration. Once completed, removes directory from local filesystem as well.

------

Use at your own risk - I do not guarantee that it will work correctly!
