function tokenize(input) {
  const tokens = [];
  let cur = "";
  let inQ = false;
  let qChar = "";
  for (const ch of input) {
    if (!inQ && (ch === '"' || ch === "'")) {
      inQ = true;
      qChar = ch;
    } else if (inQ && ch === qChar) {
      inQ = false;
    } else if (!inQ && ch === " ") {
      if (cur) tokens.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  if (cur) tokens.push(cur);
  return tokens;
}

async function cmdLs(args, fs, cwd) {
  const showAll = args.includes("-a") || args.includes("-la") || args.includes("-al");
  const showLong = args.includes("-l") || args.includes("-la") || args.includes("-al");
  const target = args.find((a) => !a.startsWith("-")) || cwd;
  const path = fs.resolvePath(target, cwd);
  const node = fs.getNode(path);
  if (!node) return `ls: cannot access '${target}': No such file or directory`;
  if (node.type === "file") return node.name;
  const children = [...(node.children || [])];
  if (showAll) children.unshift(".", "..");
  if (showLong) {
    const lines = children.map((c) => {
      if (c === "." || c === "..") return `drwxr-xr-x  user user  4096  ${c}`;
      const child = fs.getNode(path === "/" ? "/" + c : path + "/" + c);
      if (!child) return c;
      const perm = child.permissions || (child.type === "dir" ? "drwxr-xr-x" : "-rw-r--r--");
      const size = child.size || 4096;
      return `${perm}  user user  ${String(size).padStart(5)}  ${c}`;
    });
    return lines.join("\n");
  }
  return children.join("  ");
}

function cmdCd(args, fs, cwd) {
  const target = args[0] || "~";
  const path = fs.resolvePath(target, cwd);
  const node = fs.getNode(path);
  if (!node) return { output: `bash: cd: ${target}: No such file or directory`, newCwd: cwd };
  if (node.type !== "dir") return { output: `bash: cd: ${target}: Not a directory`, newCwd: cwd };
  return { output: "", newCwd: path };
}

async function cmdCat(args, fs, cwd) {
  if (args.length === 0) return "";
  const results = [];
  for (const a of args) {
    const path = fs.resolvePath(a, cwd);
    const content = await fs.readFile(path);
    if (content === null) {
      results.push(`cat: ${a}: No such file or directory`);
    } else {
      results.push(content);
    }
  }
  return results.join("\n");
}

async function cmdMkdir(args, fs, cwd) {
  if (args.length === 0) return "mkdir: missing operand";
  const results = [];
  for (const a of args.filter((x) => !x.startsWith("-"))) {
    const path = fs.resolvePath(a, cwd);
    const ok = await fs.mkdir(path);
    if (!ok) results.push(`mkdir: cannot create directory '${a}': File exists or invalid path`);
  }
  return results.join("\n");
}

async function cmdTouch(args, fs, cwd) {
  if (args.length === 0) return "touch: missing file operand";
  for (const a of args) {
    const path = fs.resolvePath(a, cwd);
    if (!fs.exists(path)) {
      await fs.writeFile(path, "");
    }
  }
  return "";
}

async function cmdRm(args, fs, cwd) {
  const recursive = args.includes("-r") || args.includes("-rf") || args.includes("-fr");
  const files = args.filter((a) => !a.startsWith("-"));
  if (files.length === 0) return "rm: missing operand";
  const results = [];
  for (const a of files) {
    const path = fs.resolvePath(a, cwd);
    const node = fs.getNode(path);
    if (!node) {
      results.push(`rm: cannot remove '${a}': No such file or directory`);
    } else if (node.type === "dir" && !recursive) {
      results.push(`rm: cannot remove '${a}': Is a directory`);
    } else {
      await fs.rm(path);
    }
  }
  return results.join("\n");
}

async function cmdCp(args, fs, cwd) {
  const files = args.filter((a) => !a.startsWith("-"));
  if (files.length < 2) return "cp: missing destination";
  const src = fs.resolvePath(files[0], cwd);
  const dst = fs.resolvePath(files[1], cwd);
  const ok = await fs.cp(src, dst);
  return ok ? "" : `cp: cannot copy '${files[0]}'`;
}

async function cmdMv(args, fs, cwd) {
  const files = args.filter((a) => !a.startsWith("-"));
  if (files.length < 2) return "mv: missing destination";
  const src = fs.resolvePath(files[0], cwd);
  const dst = fs.resolvePath(files[1], cwd);
  const ok = await fs.mv(src, dst);
  return ok ? "" : `mv: cannot move '${files[0]}'`;
}

function cmdGrep(args, pipeInput) {
  if (args.length === 0) return "Usage: grep PATTERN [FILE]";
  const pattern = args[0];
  const input = pipeInput || "";
  try {
    const regex = new RegExp(pattern, "i");
    return input
      .split("\n")
      .filter((line) => regex.test(line))
      .join("\n");
  } catch {
    return input
      .split("\n")
      .filter((line) => line.includes(pattern))
      .join("\n");
  }
}

async function cmdFind(args, fs, cwd) {
  const startPath = args[0] && !args[0].startsWith("-") ? fs.resolvePath(args[0], cwd) : cwd;
  const nameIdx = args.indexOf("-name");
  const pattern = nameIdx >= 0 && args[nameIdx + 1] ? args[nameIdx + 1].replace(/\*/g, ".*") : null;
  const results = [];
  const walk = (path) => {
    const node = fs.getNode(path);
    if (!node) return;
    if (!pattern || new RegExp(pattern, "i").test(node.name)) {
      results.push(path);
    }
    if (node.type === "dir" && node.children) {
      for (const child of node.children) {
        walk(path === "/" ? "/" + child : path + "/" + child);
      }
    }
  };
  walk(startPath);
  return results.join("\n");
}

function cmdUname(args) {
  if (args.includes("-a")) return "Linux debian 6.1.0-debian #1 SMP x86_64 GNU/Linux";
  if (args.includes("-r")) return "6.1.0-debian";
  return "Linux";
}

function cmdAptGet(args) {
  if (args.length === 0) return "Usage: apt-get [install|remove|update|upgrade] [package]";
  const subcmd = args[0];
  const pkg = args[1] || "";
  if (subcmd === "update") {
    return `Hit:1 http://deb.debian.org/debian bookworm InRelease\nGet:2 http://security.debian.org bookworm-security InRelease [48.0 kB]\nReading package lists... Done`;
  }
  if (subcmd === "upgrade") {
    return "Reading package lists... Done\nCalculating upgrade... Done\n0 upgraded, 0 newly installed, 0 to remove.";
  }
  if (subcmd === "install" && pkg) {
    return `Reading package lists... Done\nBuilding dependency tree... Done\nThe following NEW packages will be installed:\n  ${pkg}\n0 upgraded, 1 newly installed, 0 to remove.\nSetting up ${pkg}... Done`;
  }
  if (subcmd === "remove" && pkg) {
    return `Reading package lists... Done\nThe following packages will be REMOVED:\n  ${pkg}\nRemoving ${pkg}... Done`;
  }
  return `E: Invalid operation ${subcmd}`;
}

function cmdChmod(args) {
  if (args.length < 2) return "chmod: missing operand";
  return "";
}

function cmdPs(args) {
  const processes = [
    { pid: 1, user: "root", cpu: 0.0, mem: 0.1, cmd: "init" },
    { pid: 42, user: "root", cpu: 0.0, mem: 0.3, cmd: "[kthreadd]" },
    { pid: 156, user: "root", cpu: 0.1, mem: 0.5, cmd: "NetworkManager" },
    { pid: 203, user: "user", cpu: 2.1, mem: 3.2, cmd: "gnome-shell" },
    { pid: 301, user: "user", cpu: 0.5, mem: 1.4, cmd: "gnome-terminal-server" },
    { pid: 412, user: "user", cpu: 0.0, mem: 0.8, cmd: "dbus-daemon" },
    { pid: 521, user: "user", cpu: 1.2, mem: 2.1, cmd: "nautilus" },
    { pid: 634, user: "user", cpu: 0.3, mem: 1.8, cmd: "node [browser-vm]" },
  ];
  const long = args.some((a) => a === "aux" || a === "-ef" || a === "-e" || a === "-A");
  if (long) {
    const header = "USER         PID  %CPU  %MEM COMMAND";
    const rows = processes.map((p) =>
      `${p.user.padEnd(12)} ${String(p.pid).padEnd(5)} ${String(p.cpu.toFixed(1)).padEnd(5)} ${String(p.mem.toFixed(1)).padEnd(4)} ${p.cmd}`
    );
    return [header, ...rows].join("\n");
  }
  const header = "  PID TTY          TIME CMD";
  const rows = processes
    .filter((p) => p.user === "user")
    .map((p) => `${String(p.pid).padStart(5)} pts/0    00:00:0${Math.floor(p.cpu)} ${p.cmd}`);
  return [header, ...rows].join("\n");
}

function cmdDf(args) {
  const human = args.includes("-h") || args.includes("-H");
  if (human) {
    return `Filesystem      Size  Used Avail Use% Mounted on
/dev/sda1        63G  8.2G   52G  14% /
tmpfs           2.0G  1.2M  2.0G   1% /tmp
/dev/sda2       512M   55M  458M  11% /boot
tmpfs           2.0G   16M  2.0G   1% /run`;
  }
  return `Filesystem      1K-blocks     Used Available Use% Mounted on
/dev/sda1        65536000  8601600  53411840  14% /
tmpfs             2048000     1200   2046800   1% /tmp
/dev/sda2          524288    56320    467968  11% /boot`;
}

function cmdFree(args) {
  const human = args.includes("-h") || args.includes("-H");
  if (human) {
    return `              total        used        free      shared  buff/cache   available
Mem:            3.8G        1.2G        1.8G         64M        800M        2.3G
Swap:           2.0G           0        2.0G`;
  }
  return `              total        used        free      shared  buff/cache   available
Mem:        3932160     1258496     1884160       65536      789504     2408448
Swap:       2097152           0     2097152`;
}

function cmdIfconfig() {
  return `eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 192.168.1.100  netmask 255.255.255.0  broadcast 192.168.1.255
        inet6 fe80::a00:27ff:fe8d:c04d  prefixlen 64  scopeid 0x20<link>
        ether 08:00:27:8d:c0:4d  txqueuelen 1000  (Ethernet)
        RX packets 12543  bytes 9823456 (9.4 MiB)
        TX packets 8921  bytes 1234567 (1.1 MiB)

lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536
        inet 127.0.0.1  netmask 255.0.0.0
        inet6 ::1  prefixlen 128  scopeid 0x10<host>
        loop  txqueuelen 1000  (Local Loopback)`;
}

function cmdPing(args) {
  const host = args.find((a) => !a.startsWith("-")) || "localhost";
  const countIdx = args.indexOf("-c");
  const count = countIdx >= 0 && args[countIdx + 1] ? parseInt(args[countIdx + 1], 10) : 4;
  const n = Math.min(count, 6);
  const lines = [`PING ${host} (192.168.1.1) 56(84) bytes of data.`];
  for (let i = 0; i < n; i++) {
    const ms = (8 + Math.random() * 35).toFixed(3);
    lines.push(`64 bytes from ${host} (192.168.1.1): icmp_seq=${i + 1} ttl=64 time=${ms} ms`);
  }
  lines.push(`\n--- ${host} ping statistics ---`);
  lines.push(`${n} packets transmitted, ${n} received, 0% packet loss, time ${n * 1000}ms`);
  return lines.join("\n");
}

function cmdTop() {
  const t = new Date().toLocaleTimeString();
  return `top - ${t}  up 3:42,  1 user,  load average: 0.12, 0.08, 0.05
Tasks:  87 total,   1 running,  86 sleeping,   0 stopped,   0 zombie
%Cpu(s):  3.2 us,  1.1 sy,  0.0 ni, 95.4 id,  0.0 wa,  0.3 hi
MiB Mem :   3840.0 total,   1840.0 free,   1220.0 used,    780.0 buff/cache
MiB Swap:   2048.0 total,   2048.0 free,      0.0 used.   2360.0 avail Mem

  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND
  203 user      20   0  612432  65792  42240 S   2.1   1.7   0:12.34 gnome-shell
  521 user      20   0  456240  43200  28160 S   1.2   1.1   0:03.21 nautilus
  301 user      20   0  256880  28480  18432 S   0.5   0.7   0:01.45 gnome-terminal
  634 user      20   0  832640  87040  56320 S   0.3   2.2   0:05.67 node
  412 user      20   0   98240   8192   6144 S   0.0   0.2   0:00.23 dbus-daemon`;
}

function cmdEnv() {
  return `HOME=/home/user
USER=user
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
LANG=en_US.UTF-8
TERM=xterm-256color
DISPLAY=:0
DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/1000/bus
XDG_RUNTIME_DIR=/run/user/1000
XDG_SESSION_TYPE=x11
DESKTOP_SESSION=gnome
GNOME_DESKTOP_SESSION_ID=this-is-deprecated
GTK_MODULES=gail:atk-bridge`;
}

function cmdCurl(args) {
  const url = args.find((a) => !a.startsWith("-")) || "";
  if (!url) return "curl: try 'curl --help' for more information";
  return `  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100  1234    0  1234    0     0  12340      0 --:--:-- --:--:-- --:--:-- 12340
{"status":"ok","url":"${url}","message":"Simulated response"}`;
}

function cmdPython(args) {
  if (args.length === 0) {
    return `Python 3.11.2 (main, Mar 13 2023, 12:18:29) [GCC 12.2.0]
Type "help", "copyright", "credits" or "license" for more information.
>>> (interactive Python REPL not available — use a .py file)`;
  }
  return `python3: can't open file '${args[0]}': [Errno 2] No such file or directory`;
}

function cmdNode(args) {
  if (args.length === 0) {
    return `Welcome to Node.js v18.19.0.
Type ".help" for more information.
> (interactive REPL not available — run a .js file instead)`;
  }
  return `node: ${args[0]}: No such file or directory`;
}

function cmdKill(args) {
  const pid = args.find((a) => !a.startsWith("-"));
  if (!pid) return "kill: usage: kill [-s sigspec] pid | jobspec";
  return "";
}

function cmdSsh(args) {
  const host = args.find((a) => !a.startsWith("-")) || "remote";
  return `ssh: connect to host ${host} port 22: Connection refused`;
}

function cmdAlias() {
  return `alias grep='grep --color=auto'
alias l='ls -CF'
alias la='ls -A'
alias ll='ls -alF'`;
}

function cmdHelp() {
  return `Available commands:
  ls [-l] [-a] [path]       List directory contents
  cd [path]                 Change directory
  pwd                       Print working directory
  cat [file]                Display file contents
  echo [text]               Display text
  mkdir [dir]               Create directory
  touch [file]              Create empty file
  rm [-r] [path]            Remove file or directory
  cp [src] [dst]            Copy file
  mv [src] [dst]            Move/rename
  grep [pattern]            Search text (supports pipes)
  find [path] -name [p]     Find files
  chmod [mode] [file]       Change permissions
  apt-get [cmd] [pkg]       Package management
  uname [-a]                System information
  whoami                    Current user
  hostname                  System hostname
  date                      Current date/time
  ps [aux]                  Process status
  df [-h]                   Disk usage
  free [-h]                 Memory usage
  top                       Running processes snapshot
  ifconfig                  Network interfaces
  ip addr                   IP address info
  ping [-c N] [host]        Ping a host
  env                       Environment variables
  kill [pid]                Kill a process
  curl [url]                HTTP request (simulated)
  python3 / python          Python (simulated)
  node                      Node.js (simulated)
  ssh [host]                SSH (simulated)
  alias                     Show aliases
  head / tail / wc          Text processing
  clear                     Clear terminal
  help                      Show this help`;
}

async function runSingle(cmd, args, fs, cwd, pipeInput, username) {
  switch (cmd) {
    case "ls": return { output: await cmdLs(args, fs, cwd) };
    case "cd": return cmdCd(args, fs, cwd);
    case "pwd": return { output: cwd };
    case "cat": return { output: await cmdCat(args, fs, cwd) };
    case "echo": return { output: args.join(" ") };
    case "mkdir": return { output: await cmdMkdir(args, fs, cwd) };
    case "touch": return { output: await cmdTouch(args, fs, cwd) };
    case "rm": return { output: await cmdRm(args, fs, cwd) };
    case "cp": return { output: await cmdCp(args, fs, cwd) };
    case "mv": return { output: await cmdMv(args, fs, cwd) };
    case "grep": return { output: cmdGrep(args, pipeInput) };
    case "find": return { output: await cmdFind(args, fs, cwd) };
    case "chmod": return { output: cmdChmod(args) };
    case "uname": return { output: cmdUname(args) };
    case "whoami": return { output: username || "user" };
    case "hostname": return { output: "debian" };
    case "date": return { output: new Date().toString() };
    case "clear": return { output: "__CLEAR__" };
    case "help": return { output: cmdHelp() };
    case "apt-get":
    case "apt": return { output: cmdAptGet(args) };
    case "sudo": {
      if (args.length === 0) return { output: "usage: sudo command" };
      return runSingle(args[0], args.slice(1), fs, cwd, pipeInput, "root");
    }
    case "history": return { output: "History not available in this session." };
    case "exit": return { output: "__EXIT__" };
    case "man": return { output: args[0] ? `No manual entry for ${args[0]}` : "What manual page do you want?" };
    case "which": return { output: args[0] ? `/usr/bin/${args[0]}` : "which: missing argument" };
    case "head": {
      const n = 10;
      const text = pipeInput || (args[0] ? await fs.readFile(fs.resolvePath(args[0], cwd)) : "");
      return { output: (text || "").split("\n").slice(0, n).join("\n") };
    }
    case "tail": {
      const n = 10;
      const text = pipeInput || (args[0] ? await fs.readFile(fs.resolvePath(args[0], cwd)) : "");
      return { output: (text || "").split("\n").slice(-n).join("\n") };
    }
    case "wc": {
      const text = pipeInput || (args[0] ? await fs.readFile(fs.resolvePath(args[0], cwd)) : "");
      if (!text) return { output: "0 0 0" };
      const lines = text.split("\n").length;
      const words = text.split(/\s+/).filter(Boolean).length;
      return { output: `${lines} ${words} ${text.length}` };
    }
    case "ps": return { output: cmdPs(args) };
    case "df": return { output: cmdDf(args) };
    case "free": return { output: cmdFree(args) };
    case "ifconfig": return { output: cmdIfconfig() };
    case "ip": return { output: args[0] === "addr" || args[0] === "a" ? cmdIfconfig() : `ip: object "${args[0]}" is unknown, try "ip help".` };
    case "ping": return { output: cmdPing(args) };
    case "top": return { output: cmdTop() };
    case "env": return { output: cmdEnv() };
    case "curl": return { output: cmdCurl(args) };
    case "python3":
    case "python": return { output: cmdPython(args) };
    case "node": return { output: cmdNode(args) };
    case "kill": return { output: cmdKill(args) };
    case "ssh": return { output: cmdSsh(args) };
    case "alias": return { output: cmdAlias() };
    case "export":
    case "source":
    case ".":
    case "sleep":
    case "true": return { output: "" };
    case "false": return { output: "", exitCode: 1 };
    case "lsb_release": return { output: args.includes("-a") ? "Distributor ID: Debian\nDescription: Debian GNU/Linux 12 (bookworm)\nRelease: 12\nCodename: bookworm" : "Debian" };
    case "dpkg": return { output: args.includes("--version") ? "Debian dpkg version 1.21.22" : `dpkg: ${args.join(" ")}: operation not implemented in this VM` };
    case "systemctl": return { output: `● ${args[1] || "service"}: loaded and active` };
    case "journalctl": return { output: "-- Journal begins at Mon 2026-01-01 00:00:00 UTC --\nNo entries in journal matching filter." };
    default:
      return { output: `bash: ${cmd}: command not found` };
  }
}

export async function executeCommand(input, filesystem, cwd, username = "user") {
  if (!input.trim()) return { output: "", newCwd: cwd };

  const segments = input.split("|").map((s) => s.trim()).filter(Boolean);
  let pipeOutput = "";
  let currentCwd = cwd;

  for (const seg of segments) {
    const tokens = tokenize(seg);
    if (tokens.length === 0) continue;
    const result = await runSingle(tokens[0], tokens.slice(1), filesystem, currentCwd, pipeOutput, username);
    pipeOutput = result.output || "";
    if (result.newCwd) currentCwd = result.newCwd;
    if (pipeOutput === "__CLEAR__" || pipeOutput === "__EXIT__") break;
  }

  return { output: pipeOutput, newCwd: currentCwd };
}
