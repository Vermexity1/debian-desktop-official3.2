import { useState, useEffect, useRef, useCallback } from "react";
import { fs } from "@/engines/filesystem";
import useDesktopStore from "@/store/desktopStore";

const PROMPT_USER = "user";
const PROMPT_HOST = "debian";

function colorize(text, color) {
  const colors = {
    red: "\x1b[31m", green: "\x1b[32m", yellow: "\x1b[33m",
    blue: "\x1b[34m", magenta: "\x1b[35m", cyan: "\x1b[36m",
    white: "\x1b[37m", bold: "\x1b[1m", reset: "\x1b[0m",
  };
  return `${colors[color] || ""}${text}${colors.reset}`;
}

function ansiToHtml(text) {
  return text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/\x1b\[1m/g, "<b>").replace(/\x1b\[31m/g, '<span style="color:#e01b24">')
    .replace(/\x1b\[32m/g, '<span style="color:#26a269">').replace(/\x1b\[33m/g, '<span style="color:#f8e45c">')
    .replace(/\x1b\[34m/g, '<span style="color:#3584e4">').replace(/\x1b\[35m/g, '<span style="color:#9141ac">')
    .replace(/\x1b\[36m/g, '<span style="color:#2190a4">').replace(/\x1b\[37m/g, '<span style="color:#eeeeec">')
    .replace(/\x1b\[0m/g, "</span></b>").replace(/\n/g, "<br/>");
}

const HELP_TEXT = `Available commands:
  ls [path]          List directory contents
  cd [path]          Change directory
  pwd                Print working directory
  mkdir <name>       Create directory
  touch <name>       Create empty file
  cat <file>         Display file contents
  echo <text>        Print text
  rm <path>          Remove file or directory
  mv <src> <dst>     Move/rename file
  cp <src> <dst>     Copy file
  clear              Clear terminal
  history            Show command history
  date               Show current date/time
  whoami             Show current user
  uname              Show system info
  uptime             Show system uptime
  ps                 List processes
  df                 Show disk usage
  free               Show memory usage
  env                Show environment variables
  export VAR=val     Set environment variable
  which <cmd>        Show command location
  man <cmd>          Show manual page
  grep <pat> <file>  Search in file
  head <file>        Show first 10 lines
  tail <file>        Show last 10 lines
  wc <file>          Word/line/char count
  find <path> <name> Find files
  ping <host>        Ping a host
  curl <url>         Fetch URL (simulated)
  apt list           List packages
  apt install <pkg>  Install package (simulated)
  neofetch           System info
  cowsay <text>      Cow says text
  fortune            Random fortune
  sl                 Steam locomotive
  yes [text]         Repeat text
  seq <n>            Print sequence
  sort               Sort input
  uniq               Remove duplicates
  help               Show this help`;

const FORTUNES = [
  "The best way to predict the future is to create it.",
  "In the middle of every difficulty lies opportunity.",
  "It always seems impossible until it's done.",
  "The only way to do great work is to love what you do.",
  "Code is like humor. When you have to explain it, it's bad.",
  "First, solve the problem. Then, write the code.",
  "Any fool can write code that a computer can understand. Good programmers write code that humans can understand.",
  "Talk is cheap. Show me the code.",
];

const PROCESSES = [
  { pid: 1, name: "systemd", cpu: 0.0, mem: 1.2, stat: "Ss" },
  { pid: 2, name: "kthreadd", cpu: 0.0, mem: 0.0, stat: "S" },
  { pid: 42, name: "gnome-shell", cpu: 3.2, mem: 8.5, stat: "Sl" },
  { pid: 87, name: "Xorg", cpu: 1.4, mem: 4.2, stat: "Ss+" },
  { pid: 124, name: "pulseaudio", cpu: 0.3, mem: 1.8, stat: "S<sl" },
  { pid: 156, name: "NetworkManager", cpu: 0.2, mem: 2.1, stat: "Ssl" },
  { pid: 203, name: "firefox-esr", cpu: 12.5, mem: 18.3, stat: "Sl" },
  { pid: 287, name: "nautilus", cpu: 0.8, mem: 3.4, stat: "Sl" },
  { pid: 301, name: "gnome-terminal", cpu: 0.5, mem: 2.8, stat: "Sl" },
  { pid: 345, name: "dbus-daemon", cpu: 0.1, mem: 0.9, stat: "Ss" },
];

export default function Terminal() {
  const [lines, setLines] = useState([]);
  const [input, setInput] = useState("");
  const [cwd, setCwd] = useState("/home/user");
  const [cmdHistory, setCmdHistory] = useState([]);
  const [histIdx, setHistIdx] = useState(-1);
  const [env, setEnv] = useState({ HOME: "/home/user", USER: "user", SHELL: "/bin/bash", TERM: "xterm-256color", PATH: "/usr/local/bin:/usr/bin:/bin" });
  const inputRef = useRef(null);
  const bottomRef = useRef(null);
  const outputRef = useRef(null);
  const { openWindow } = useDesktopStore();

  const prompt = `\x1b[32m${PROMPT_USER}@${PROMPT_HOST}\x1b[0m:\x1b[34m${cwd.replace("/home/user", "~")}\x1b[0m$ `;

  const addLine = useCallback((html, isHtml = false) => {
    setLines((l) => [...l, { html: isHtml ? html : ansiToHtml(html), id: Date.now() + Math.random() }]);
  }, []);

  useEffect(() => {
    addLine(`\x1b[32mDebian GNU/Linux 12 (bookworm)\x1b[0m — Terminal`);
    addLine(`Type \x1b[33mhelp\x1b[0m for available commands.\n`);
  }, []);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [lines]);

  // Focus input on mount and when lines change
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const resolvePath = (p) => {
    if (!p || p === "~") return "/home/user";
    if (p.startsWith("~")) return "/home/user" + p.slice(1);
    if (p.startsWith("/")) return p;
    const parts = (cwd + "/" + p).split("/").filter(Boolean);
    const resolved = [];
    for (const part of parts) {
      if (part === ".") continue;
      if (part === "..") resolved.pop();
      else resolved.push(part);
    }
    return "/" + resolved.join("/");
  };

  const execute = useCallback(async (raw) => {
    const trimmed = raw.trim();
    if (!trimmed) return;

    // Add to history
    setCmdHistory((h) => [trimmed, ...h.filter((x) => x !== trimmed).slice(0, 99)]);
    setHistIdx(-1);

    // Show prompt + command
    addLine(`\x1b[32m${PROMPT_USER}@${PROMPT_HOST}\x1b[0m:\x1b[34m${cwd.replace("/home/user", "~")}\x1b[0m$ ${trimmed}`);

    // Parse command
    const parts = trimmed.split(/\s+/);
    const cmd = parts[0];
    const args = parts.slice(1);

    switch (cmd) {
      case "clear":
        setLines([]);
        break;

      case "help":
        addLine(HELP_TEXT);
        break;

      case "pwd":
        addLine(cwd);
        break;

      case "whoami":
        addLine(PROMPT_USER);
        break;

      case "echo":
        addLine(args.join(" ").replace(/\$(\w+)/g, (_, k) => env[k] || ""));
        break;

      case "date":
        addLine(new Date().toString());
        break;

      case "uname":
        if (args.includes("-a")) {
          addLine("Linux debian 6.1.0-21-amd64 #1 SMP PREEMPT_DYNAMIC Debian 6.1.90-1 (2024-05-03) x86_64 GNU/Linux");
        } else {
          addLine("Linux");
        }
        break;

      case "uptime":
        addLine(` ${new Date().toLocaleTimeString()} up 3:42,  1 user,  load average: 0.42, 0.38, 0.31`);
        break;

      case "ls": {
        const path = resolvePath(args[0] || cwd);
        const children = await fs.readDir(path);
        if (!children) { addLine(`\x1b[31mls: cannot access '${path}': No such file or directory\x1b[0m`); break; }
        const items = await Promise.all(children.map(async (name) => {
          const fullPath = path === "/" ? "/" + name : path + "/" + name;
          const node = fs.stat(fullPath);
          return { name, type: node?.type || "file" };
        }));
        const showAll = args.includes("-a") || args.includes("-la") || args.includes("-al");
        const showLong = args.includes("-l") || args.includes("-la") || args.includes("-al");
        const displayed = showAll ? items : items.filter((i) => !i.name.startsWith("."));
        if (showLong) {
          addLine(`total ${displayed.length}`);
          displayed.forEach((item) => {
            const isDir = item.type === "dir";
            const perm = isDir ? "drwxr-xr-x" : "-rw-r--r--";
            const color = isDir ? "\x1b[34m" : "\x1b[37m";
            addLine(`${perm}  1 user user    4096 ${new Date().toLocaleDateString()} ${color}${item.name}\x1b[0m`);
          });
        } else {
          const out = displayed.map((item) => item.type === "dir" ? `\x1b[34m${item.name}/\x1b[0m` : item.name).join("  ");
          addLine(out || "(empty)");
        }
        break;
      }

      case "cd": {
        const target = resolvePath(args[0] || "/home/user");
        const node = fs.stat(target);
        if (!node && target !== "/") { addLine(`\x1b[31mcd: ${args[0]}: No such file or directory\x1b[0m`); break; }
        const children = await fs.readDir(target);
        if (children === null) { addLine(`\x1b[31mcd: ${args[0]}: Not a directory\x1b[0m`); break; }
        setCwd(target);
        break;
      }

      case "mkdir": {
        if (!args[0]) { addLine("\x1b[31mmkdir: missing operand\x1b[0m"); break; }
        const path = resolvePath(args[0]);
        const ok = await fs.mkdir(path);
        if (!ok) addLine(`\x1b[31mmkdir: cannot create directory '${args[0]}': File exists\x1b[0m`);
        break;
      }

      case "touch": {
        if (!args[0]) { addLine("\x1b[31mtouch: missing file operand\x1b[0m"); break; }
        const path = resolvePath(args[0]);
        await fs.writeFile(path, "");
        break;
      }

      case "cat": {
        if (!args[0]) { addLine("\x1b[31mcat: missing file operand\x1b[0m"); break; }
        const path = resolvePath(args[0]);
        const content = await fs.readFile(path);
        if (content === null) { addLine(`\x1b[31mcat: ${args[0]}: No such file or directory\x1b[0m`); break; }
        addLine(content || "(empty file)");
        break;
      }

      case "rm": {
        if (!args[0]) { addLine("\x1b[31mrm: missing operand\x1b[0m"); break; }
        const path = resolvePath(args[0]);
        const ok = await fs.rm(path);
        if (!ok) addLine(`\x1b[31mrm: cannot remove '${args[0]}': No such file or directory\x1b[0m`);
        break;
      }

      case "mv": {
        if (!args[0] || !args[1]) { addLine("\x1b[31mmv: missing operand\x1b[0m"); break; }
        const src = resolvePath(args[0]), dst = resolvePath(args[1]);
        await fs.mv(src, dst);
        break;
      }

      case "cp": {
        if (!args[0] || !args[1]) { addLine("\x1b[31mcp: missing operand\x1b[0m"); break; }
        const src = resolvePath(args[0]), dst = resolvePath(args[1]);
        await fs.cp(src, dst);
        break;
      }

      case "head": {
        if (!args[0]) { addLine("\x1b[31mhead: missing file operand\x1b[0m"); break; }
        const path = resolvePath(args[0]);
        const content = await fs.readFile(path);
        if (content === null) { addLine(`\x1b[31mhead: ${args[0]}: No such file\x1b[0m`); break; }
        const n = args.includes("-n") ? parseInt(args[args.indexOf("-n") + 1]) || 10 : 10;
        addLine(content.split("\n").slice(0, n).join("\n"));
        break;
      }

      case "tail": {
        if (!args[0]) { addLine("\x1b[31mtail: missing file operand\x1b[0m"); break; }
        const path = resolvePath(args[0]);
        const content = await fs.readFile(path);
        if (content === null) { addLine(`\x1b[31mtail: ${args[0]}: No such file\x1b[0m`); break; }
        const n = args.includes("-n") ? parseInt(args[args.indexOf("-n") + 1]) || 10 : 10;
        const ls2 = content.split("\n");
        addLine(ls2.slice(-n).join("\n"));
        break;
      }

      case "wc": {
        if (!args[0]) { addLine("\x1b[31mwc: missing file operand\x1b[0m"); break; }
        const path = resolvePath(args[0]);
        const content = await fs.readFile(path);
        if (content === null) { addLine(`\x1b[31mwc: ${args[0]}: No such file\x1b[0m`); break; }
        const lines2 = content.split("\n").length;
        const words = content.trim().split(/\s+/).filter(Boolean).length;
        const chars = content.length;
        addLine(`  ${lines2}  ${words}  ${chars} ${args[0]}`);
        break;
      }

      case "grep": {
        if (!args[0] || !args[1]) { addLine("\x1b[31mgrep: usage: grep <pattern> <file>\x1b[0m"); break; }
        const path = resolvePath(args[1]);
        const content = await fs.readFile(path);
        if (content === null) { addLine(`\x1b[31mgrep: ${args[1]}: No such file\x1b[0m`); break; }
        const pattern = args[0];
        const matches = content.split("\n").filter((line) => line.includes(pattern));
        if (matches.length === 0) { break; }
        addLine(matches.map((m) => m.replace(new RegExp(pattern, "g"), `\x1b[31m${pattern}\x1b[0m`)).join("\n"));
        break;
      }

      case "find": {
        const searchPath = resolvePath(args[0] || cwd);
        const name = args[args.indexOf("-name") + 1] || args[1];
        const results = [];
        const search = async (p) => {
          const children = await fs.readDir(p);
          if (!children) return;
          for (const child of children) {
            const fp = p === "/" ? "/" + child : p + "/" + child;
            if (!name || child.includes(name.replace(/\*/g, ""))) results.push(fp);
            const node = fs.stat(fp);
            if (node?.type === "dir") await search(fp);
          }
        };
        await search(searchPath);
        addLine(results.join("\n") || "(no results)");
        break;
      }

      case "history":
        cmdHistory.forEach((h, i) => addLine(`  ${cmdHistory.length - i}  ${h}`));
        break;

      case "ps": {
        addLine("  PID TTY          TIME CMD");
        PROCESSES.forEach((p) => {
          addLine(`${String(p.pid).padStart(5)} pts/0    00:00:0${p.pid % 10} ${p.name}`);
        });
        break;
      }

      case "df":
        addLine("Filesystem     1K-blocks    Used Available Use% Mounted on");
        addLine("/dev/sda1      244140625 8388608 235752017   4% /");
        addLine("tmpfs            4096000       0   4096000   0% /dev/shm");
        addLine("/dev/sda2       20971520 1048576  19922944   5% /home");
        break;

      case "free":
        addLine("               total        used        free      shared  buff/cache   available");
        addLine("Mem:         8192000     2048000     4096000      256000     2048000     5888000");
        addLine("Swap:        2097152           0     2097152");
        break;

      case "env":
        Object.entries(env).forEach(([k, v]) => addLine(`${k}=${v}`));
        break;

      case "export": {
        const match = args[0]?.match(/^(\w+)=(.*)$/);
        if (match) {
          setEnv((e) => ({ ...e, [match[1]]: match[2] }));
          addLine(`Exported: ${match[1]}=${match[2]}`);
        } else {
          addLine("\x1b[31mexport: invalid syntax. Use: export VAR=value\x1b[0m");
        }
        break;
      }

      case "which":
        if (!args[0]) { addLine("\x1b[31mwhich: missing argument\x1b[0m"); break; }
        addLine(`/usr/bin/${args[0]}`);
        break;

      case "man":
        if (!args[0]) { addLine("\x1b[31mman: missing argument\x1b[0m"); break; }
        addLine(`Manual page for ${args[0]}:\nType 'help' for built-in commands.`);
        break;

      case "ping": {
        const host = args[0] || "localhost";
        addLine(`PING ${host}: 56 data bytes`);
        for (let i = 0; i < 4; i++) {
          const ms = (10 + Math.random() * 20).toFixed(3);
          addLine(`64 bytes from ${host}: icmp_seq=${i} ttl=64 time=${ms} ms`);
        }
        addLine(`\n--- ${host} ping statistics ---\n4 packets transmitted, 4 received, 0% packet loss`);
        break;
      }

      case "curl": {
        const url = args[0];
        if (!url) { addLine("\x1b[31mcurl: no URL specified\x1b[0m"); break; }
        addLine(`\x1b[33mFetching ${url}...\x1b[0m`);
        try {
          const resp = await fetch(url);
          const text = await resp.text();
          addLine(text.slice(0, 500) + (text.length > 500 ? "\n...(truncated)" : ""));
        } catch {
          addLine(`\x1b[31mcurl: (6) Could not resolve host: ${url}\x1b[0m`);
        }
        break;
      }

      case "apt": {
        if (args[0] === "list") {
          addLine("Listing... Done\ndebian-archive-keyring/stable 2023.3+deb12u1 all\nbase-files/stable 12.4+deb12u6 amd64\nbash/stable 5.2.15-2+b7 amd64\n...(and 1847 more)");
        } else if (args[0] === "install") {
          const pkg = args[1] || "package";
          addLine(`Reading package lists... Done\nBuilding dependency tree... Done\nThe following NEW packages will be installed:\n  ${pkg}\n0 upgraded, 1 newly installed, 0 to remove and 0 not upgraded.\nNeed to get 0 B/1,234 kB of archives.\nSetting up ${pkg} ...\n\x1b[32mDone.\x1b[0m`);
        } else if (args[0] === "update") {
          addLine("Hit:1 http://deb.debian.org/debian bookworm InRelease\nHit:2 http://security.debian.org/debian-security bookworm-security InRelease\nReading package lists... Done");
        } else if (args[0] === "upgrade") {
          addLine("Reading package lists... Done\nBuilding dependency tree... Done\n0 upgraded, 0 newly installed, 0 to remove and 0 not upgraded.");
        } else {
          addLine("apt: usage: apt [list|install|update|upgrade] [package]");
        }
        break;
      }

      case "neofetch": {
        const art = `        _,met$$$$$gg.
     ,g$$$$$$$$$$$$$$$P.
   ,g$$P"        """Y$$.".
  ,$$P'              \`$$$.
',$$P       ,ggs.     \`$$b:
\`d$$'     ,$P"'   .    $$$
 $$P      d$'     ,    $$P
 $$:      $$.   -    ,d$$'
 $$;      Y$b._   _,d$P'
 Y$$.    \`.\`"Y$$$$P"'
 \`$$b      "-.__
  \`Y$$
   \`Y$$.
     \`$$b.
       \`Y$$b.
          \`"Y$b._
              \`"""`;
        addLine(`\x1b[34m${art}\x1b[0m\n\x1b[32muser@debian\x1b[0m\n-----------\n\x1b[33mOS:\x1b[0m Debian GNU/Linux 12 (bookworm)\n\x1b[33mKernel:\x1b[0m 6.1.0-21-amd64\n\x1b[33mShell:\x1b[0m bash 5.2.15\n\x1b[33mDE:\x1b[0m GNOME 43.9\n\x1b[33mCPU:\x1b[0m Intel Core i7 (4 cores)\n\x1b[33mMemory:\x1b[0m 4096 MB`);
        break;
      }

      case "cowsay": {
        const text = args.join(" ") || "Moo!";
        const line = "-".repeat(text.length + 2);
        addLine(` ${line}\n< ${text} >\n ${line}\n        \\   ^__^\n         \\  (oo)\\_______\n            (__)\\       )\\/\\\n                ||----w |\n                ||     ||`);
        break;
      }

      case "fortune":
        addLine(FORTUNES[Math.floor(Math.random() * FORTUNES.length)]);
        break;

      case "sl":
        addLine("        ====        ________                ___________\n    _D _|  |_______/        \\__I_I_____===__|_______|\n     |(_)---  |   H\\________/ |   |        =|___ ___|      _________________\n     /     |  |   H  |  |     |   |         ||_| |_||     _|                \\_____A\n    |      |  |   H  |__--------------------| [___] |   =|                        |\n    | ________|___H__/__|_____/[][]~\\_______|       |   -|                        |\n    |/ |   |-----------I_____I [][] []  D   |=======|____|________________________|\n  __/ =| o |=-~~\\  /~~\\  /~~\\  /~~\\ ____Y___________|__|__________________________|_\n |/-=|___|=    ||    ||    ||    || (_)_)_)_)_)_)_)_)   |_D_D_D_D_D_D_D_D_D|\n  \\_/      \\O=====O=====O=====O_/                       \\_/   \\_/   \\_/   \\_/");
        break;

      case "yes": {
        const text2 = args.join(" ") || "y";
        addLine(Array(20).fill(text2).join("\n") + "\n...(press Ctrl+C to stop)");
        break;
      }

      case "seq": {
        const n = parseInt(args[0]) || 10;
        addLine(Array.from({ length: n }, (_, i) => i + 1).join("\n"));
        break;
      }

      case "python3":
      case "python": {
        const script = args.join(" ");
        if (script) {
          addLine(`\x1b[33mPython 3.11 (simulated)\x1b[0m`);
          try {
            // Very simple eval for basic expressions
            const result = Function('"use strict"; return (' + script.replace(/print\((.+)\)/, "$1") + ")")();
            addLine(String(result));
          } catch {
            addLine(`\x1b[31mSyntaxError: invalid syntax\x1b[0m`);
          }
        } else {
          addLine("Python 3.11.0 (simulated)\nType 'exit()' to quit.");
        }
        break;
      }

      case "node": {
        const script = args.join(" ");
        if (script) {
          try {
            const result = Function('"use strict"; return (' + script + ")")();
            addLine(String(result));
          } catch {
            addLine(`\x1b[31mReferenceError: ${args[0]} is not defined\x1b[0m`);
          }
        } else {
          addLine("Node.js v22.13.0 (simulated)\nType '.exit' to quit.");
        }
        break;
      }

      case "exit":
        addLine("logout");
        break;

      default:
        addLine(`\x1b[31mbash: ${cmd}: command not found\x1b[0m`);
        addLine(`Type \x1b[33mhelp\x1b[0m for available commands.`);
    }
  }, [cwd, cmdHistory, env, addLine]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      execute(input);
      setInput("");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const newIdx = Math.min(histIdx + 1, cmdHistory.length - 1);
      setHistIdx(newIdx);
      setInput(cmdHistory[newIdx] || "");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const newIdx = Math.max(histIdx - 1, -1);
      setHistIdx(newIdx);
      setInput(newIdx === -1 ? "" : cmdHistory[newIdx] || "");
    } else if (e.key === "Tab") {
      e.preventDefault();
      // Basic tab completion
      const parts = input.split(" ");
      const last = parts[parts.length - 1];
      if (last) {
        const path = last.startsWith("/") ? last : cwd + "/" + last;
        const dir = path.substring(0, path.lastIndexOf("/")) || "/";
        const prefix = path.split("/").pop();
        fs.readDir(dir).then((children) => {
          if (!children) return;
          const matches = children.filter((c) => c.startsWith(prefix));
          if (matches.length === 1) {
            parts[parts.length - 1] = (last.includes("/") ? last.substring(0, last.lastIndexOf("/") + 1) : "") + matches[0];
            setInput(parts.join(" "));
          } else if (matches.length > 1) {
            addLine(matches.join("  "));
          }
        });
      }
    } else if (e.key === "c" && e.ctrlKey) {
      addLine("^C");
      setInput("");
    } else if (e.key === "l" && e.ctrlKey) {
      setLines([]);
    }
  };

  return (
    <div
      className="terminal"
      data-testid="terminal-app"
      onClick={() => inputRef.current?.focus()}
      style={{ fontFamily: "'Fira Code', 'Cascadia Code', 'Courier New', monospace" }}
    >
      <div className="terminal-output" ref={outputRef}>
        {lines.map((line) => (
          <div key={line.id} className="terminal-line" dangerouslySetInnerHTML={{ __html: line.html }} />
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="terminal-input-row">
        <span className="terminal-prompt" dangerouslySetInnerHTML={{ __html: ansiToHtml(prompt) }} />
        <input
          ref={inputRef}
          className="terminal-input"
          value={input}
          onChange={(e) => {
            e.preventDefault();
            setInput(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          autoFocus
          spellCheck={false}
          autoComplete="off"
          data-testid="terminal-input"
          type="text"
        />
      </div>
    </div>
  );
}
