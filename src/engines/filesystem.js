import { get, set } from "idb-keyval";

const FS_KEY = "debian-filesystem";

const defaultNodes = {
  "/": { type: "dir", name: "/", children: ["home", "etc", "tmp", "var", "usr", "bin"], permissions: "drwxr-xr-x", modified: Date.now() },
  "/home": { type: "dir", name: "home", children: ["user"], permissions: "drwxr-xr-x", modified: Date.now() },
  "/home/user": { type: "dir", name: "user", children: ["Documents", "Downloads", "Desktop", "Pictures", "Music", "Notes"], permissions: "drwxr-xr-x", modified: Date.now() },
  "/home/user/Documents": { type: "dir", name: "Documents", children: ["readme.txt", "welcome.md"], permissions: "drwxr-xr-x", modified: Date.now() },
  "/home/user/Documents/readme.txt": { type: "file", name: "readme.txt", content: "Welcome to Debian Desktop!\nThis is a browser-based Debian VM simulation.\nFeel free to explore the filesystem and applications.", permissions: "-rw-r--r--", modified: Date.now(), size: 120 },
  "/home/user/Documents/welcome.md": { type: "file", name: "welcome.md", content: "# Welcome\n\nThis is a **Debian Desktop** running in your browser.\n\n## Features\n- Terminal with Linux commands\n- File Manager\n- Text Editor\n- And more!", permissions: "-rw-r--r--", modified: Date.now(), size: 150 },
  "/home/user/Downloads": { type: "dir", name: "Downloads", children: [], permissions: "drwxr-xr-x", modified: Date.now() },
  "/home/user/Desktop": { type: "dir", name: "Desktop", children: [], permissions: "drwxr-xr-x", modified: Date.now() },
  "/home/user/Pictures": { type: "dir", name: "Pictures", children: ["sample.txt"], permissions: "drwxr-xr-x", modified: Date.now() },
  "/home/user/Pictures/sample.txt": { type: "file", name: "sample.txt", content: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800", permissions: "-rw-r--r--", modified: Date.now(), size: 70 },
  "/home/user/Music": { type: "dir", name: "Music", children: [], permissions: "drwxr-xr-x", modified: Date.now() },
  "/home/user/Notes": { type: "dir", name: "Notes", children: ["Getting Started.txt"], permissions: "drwxr-xr-x", modified: Date.now() },
  "/home/user/Notes/Getting Started.txt": { type: "file", name: "Getting Started.txt", content: "Welcome to Notes!\nUse this app to jot down your thoughts.\nYou can create, edit, and delete notes.", permissions: "-rw-r--r--", modified: Date.now(), size: 100 },
  "/etc": { type: "dir", name: "etc", children: ["hostname", "os-release"], permissions: "drwxr-xr-x", modified: Date.now() },
  "/etc/hostname": { type: "file", name: "hostname", content: "debian", permissions: "-rw-r--r--", modified: Date.now(), size: 6 },
  "/etc/os-release": { type: "file", name: "os-release", content: 'PRETTY_NAME="Debian GNU/Linux 12 (bookworm)"\nNAME="Debian GNU/Linux"\nVERSION_ID="12"\nVERSION="12 (bookworm)"\nID=debian', permissions: "-rw-r--r--", modified: Date.now(), size: 140 },
  "/tmp": { type: "dir", name: "tmp", children: [], permissions: "drwxrwxrwt", modified: Date.now() },
  "/var": { type: "dir", name: "var", children: ["log"], permissions: "drwxr-xr-x", modified: Date.now() },
  "/var/log": { type: "dir", name: "log", children: ["syslog"], permissions: "drwxr-xr-x", modified: Date.now() },
  "/var/log/syslog": { type: "file", name: "syslog", content: "Jan  1 00:00:00 debian kernel: Linux version 6.1.0-debian\nJan  1 00:00:01 debian systemd[1]: Started.\n", permissions: "-rw-r-----", modified: Date.now(), size: 100 },
  "/usr": { type: "dir", name: "usr", children: ["bin", "lib", "share"], permissions: "drwxr-xr-x", modified: Date.now() },
  "/usr/bin": { type: "dir", name: "bin", children: [], permissions: "drwxr-xr-x", modified: Date.now() },
  "/usr/lib": { type: "dir", name: "lib", children: [], permissions: "drwxr-xr-x", modified: Date.now() },
  "/usr/share": { type: "dir", name: "share", children: [], permissions: "drwxr-xr-x", modified: Date.now() },
  "/bin": { type: "dir", name: "bin", children: ["bash", "ls", "cat"], permissions: "drwxr-xr-x", modified: Date.now() },
  "/bin/bash": { type: "file", name: "bash", content: "", permissions: "-rwxr-xr-x", modified: Date.now(), size: 0 },
  "/bin/ls": { type: "file", name: "ls", content: "", permissions: "-rwxr-xr-x", modified: Date.now(), size: 0 },
  "/bin/cat": { type: "file", name: "cat", content: "", permissions: "-rwxr-xr-x", modified: Date.now(), size: 0 },
};

class FileSystem {
  constructor() {
    this.nodes = null;
    this.ready = false;
  }

  async init() {
    const stored = await get(FS_KEY);
    if (stored) {
      this.nodes = stored;
    } else {
      this.nodes = JSON.parse(JSON.stringify(defaultNodes));
      await this.save();
    }
    this.ready = true;
  }

  async save() {
    await set(FS_KEY, this.nodes);
  }

  resolvePath(path, cwd = "/home/user") {
    if (!path) return cwd;
    if (path === "~") return "/home/user";
    if (path.startsWith("~/")) path = "/home/user/" + path.slice(2);
    if (!path.startsWith("/")) path = cwd + "/" + path;
    const parts = path.split("/").filter(Boolean);
    const resolved = [];
    for (const part of parts) {
      if (part === ".") continue;
      if (part === "..") {
        resolved.pop();
        continue;
      }
      resolved.push(part);
    }
    return "/" + resolved.join("/") || "/";
  }

  getNode(path) {
    if (!this.nodes) return null;
    return this.nodes[path] || null;
  }

  async readDir(path) {
    const node = this.getNode(path);
    if (!node || node.type !== "dir") return null;
    return node.children || [];
  }

  async readFile(path) {
    const node = this.getNode(path);
    if (!node || node.type !== "file") return null;
    return node.content;
  }

  async writeFile(path, content) {
    const parentPath = path.substring(0, path.lastIndexOf("/")) || "/";
    const name = path.split("/").pop();
    const parent = this.getNode(parentPath);
    if (!parent || parent.type !== "dir") return false;
    if (!this.nodes[path]) {
      parent.children = [...(parent.children || []), name];
    }
    this.nodes[path] = {
      type: "file",
      name,
      content: content || "",
      permissions: "-rw-r--r--",
      modified: Date.now(),
      size: (content || "").length,
    };
    await this.save();
    return true;
  }

  async mkdir(path) {
    const parentPath = path.substring(0, path.lastIndexOf("/")) || "/";
    const name = path.split("/").pop();
    const parent = this.getNode(parentPath);
    if (!parent || parent.type !== "dir") return false;
    if (this.nodes[path]) return false;
    parent.children = [...(parent.children || []), name];
    this.nodes[path] = {
      type: "dir",
      name,
      children: [],
      permissions: "drwxr-xr-x",
      modified: Date.now(),
    };
    await this.save();
    return true;
  }

  async rm(path) {
    if (path === "/" || path === "/home" || path === "/home/user") return false;
    const node = this.getNode(path);
    if (!node) return false;
    const parentPath = path.substring(0, path.lastIndexOf("/")) || "/";
    const parent = this.getNode(parentPath);
    if (parent) {
      parent.children = (parent.children || []).filter((c) => c !== node.name);
    }
    if (node.type === "dir" && node.children) {
      for (const child of [...node.children]) {
        await this.rm(path + "/" + child);
      }
    }
    delete this.nodes[path];
    await this.save();
    return true;
  }

  async cp(src, dst) {
    const srcNode = this.getNode(src);
    if (!srcNode) return false;
    if (srcNode.type === "file") {
      await this.writeFile(dst, srcNode.content);
    } else {
      await this.mkdir(dst);
      for (const child of srcNode.children || []) {
        await this.cp(src + "/" + child, dst + "/" + child);
      }
    }
    return true;
  }

  async mv(src, dst) {
    const ok = await this.cp(src, dst);
    if (ok) await this.rm(src);
    return ok;
  }

  exists(path) {
    return !!this.nodes[path];
  }

  stat(path) {
    return this.getNode(path);
  }
}

export const fs = new FileSystem();
export default fs;
