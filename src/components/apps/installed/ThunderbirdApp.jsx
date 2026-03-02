import { useState } from "react";
import { Mail, Send, Trash2, Star, Archive, Reply, ReplyAll, Forward, RefreshCw, Search, Plus, Paperclip, Bold, Italic, List } from "lucide-react";

const FOLDERS = [
  { id: "inbox", label: "Inbox", icon: "📥", count: 3 },
  { id: "sent", label: "Sent", icon: "📤", count: 0 },
  { id: "drafts", label: "Drafts", icon: "📝", count: 1 },
  { id: "starred", label: "Starred", icon: "⭐", count: 2 },
  { id: "spam", label: "Spam", icon: "🚫", count: 5 },
  { id: "trash", label: "Trash", icon: "🗑️", count: 0 },
];

const SAMPLE_EMAILS = [
  { id: 1, folder: "inbox", from: "linux-kernel@vger.kernel.org", fromName: "Linus Torvalds", subject: "Re: [PATCH] net: fix race condition in socket handling", date: "2024-01-15 09:23", body: "On Mon, Jan 15, 2024 at 09:00:00AM +0000, Developer wrote:\n> This patch fixes a race condition in socket handling\n> that could lead to use-after-free.\n\nLooks good to me. Applied to net-next.\n\nThanks,\nLinus", read: false, starred: true, attachments: [] },
  { id: 2, folder: "inbox", from: "security@debian.org", fromName: "Debian Security", subject: "[SECURITY] [DSA 5612-1] chromium security update", date: "2024-01-14 14:45", body: "- -------------------------------------------------------------------------\nDebian Security Advisory DSA-5612-1       security@debian.org\nhttps://www.debian.org/security/                     Moritz Muehlenhoff\nJanuary 14, 2024                          https://www.debian.org/security/faq\n- -------------------------------------------------------------------------\n\nPackage        : chromium\nCVE ID         : CVE-2024-0517 CVE-2024-0518 CVE-2024-0519\n\nSeveral vulnerabilities have been discovered in the Chromium web browser.", read: false, starred: false, attachments: [] },
  { id: 3, folder: "inbox", from: "noreply@github.com", fromName: "GitHub", subject: "[GitHub] A third-party OAuth application has been added to your account", date: "2024-01-13 11:12", body: "Hey user,\n\nA third-party OAuth application (Vercel) was recently authorized to access your account.\n\nIf you did not perform this action, please visit https://github.com/settings/applications to revoke access.\n\nThanks,\nThe GitHub Team", read: true, starred: false, attachments: [] },
  { id: 4, folder: "inbox", from: "newsletter@debian.org", fromName: "Debian Newsletter", subject: "Debian Project News - January 2024", date: "2024-01-12 08:00", body: "Welcome to the Debian Project News!\n\nIn this issue:\n- Debian 12.4 released\n- New packages in Debian unstable\n- Developer news\n- Security updates\n\nRead the full newsletter at https://www.debian.org/News/weekly/", read: true, starred: true, attachments: ["newsletter.pdf"] },
  { id: 5, folder: "sent", from: "user@debian-desktop.local", fromName: "Me", subject: "Re: Meeting tomorrow", date: "2024-01-11 16:30", body: "Hi,\n\nSounds good, I'll be there at 10am.\n\nBest,\nUser", read: true, starred: false, attachments: [] },
  { id: 6, folder: "drafts", from: "user@debian-desktop.local", fromName: "Me", subject: "Project proposal", date: "2024-01-10 14:00", body: "Dear Team,\n\nI wanted to share my thoughts on the upcoming project...", read: true, starred: false, attachments: [] },
];

export default function ThunderbirdApp() {
  const [emails, setEmails] = useState(SAMPLE_EMAILS);
  const [folder, setFolder] = useState("inbox");
  const [selected, setSelected] = useState(null);
  const [composing, setComposing] = useState(false);
  const [compose, setCompose] = useState({ to: "", cc: "", subject: "", body: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [replying, setReplying] = useState(false);

  const folderEmails = emails.filter((e) => {
    const inFolder = e.folder === folder;
    const matchesSearch = !searchQuery || e.subject.toLowerCase().includes(searchQuery.toLowerCase()) || e.fromName.toLowerCase().includes(searchQuery.toLowerCase()) || e.body.toLowerCase().includes(searchQuery.toLowerCase());
    return inFolder && matchesSearch;
  });

  const selectedEmail = emails.find((e) => e.id === selected);

  const markRead = (id) => setEmails((prev) => prev.map((e) => e.id === id ? { ...e, read: true } : e));
  const toggleStar = (id, ev) => { ev.stopPropagation(); setEmails((prev) => prev.map((e) => e.id === id ? { ...e, starred: !e.starred } : e)); };
  const deleteEmail = (id, ev) => { ev?.stopPropagation(); setEmails((prev) => prev.map((e) => e.id === id ? { ...e, folder: "trash" } : e)); if (selected === id) setSelected(null); };
  const archiveEmail = (id) => { setEmails((prev) => prev.map((e) => e.id === id ? { ...e, folder: "archive" } : e)); if (selected === id) setSelected(null); };

  const sendEmail = () => {
    if (!compose.to || !compose.subject) { alert("Please fill in To and Subject fields"); return; }
    const newEmail = { id: Date.now(), folder: "sent", from: "user@debian-desktop.local", fromName: "Me", ...compose, date: new Date().toLocaleString(), read: true, starred: false, attachments: [] };
    setEmails((prev) => [...prev, newEmail]);
    setComposing(false);
    setCompose({ to: "", cc: "", subject: "", body: "" });
  };

  const startReply = () => {
    if (!selectedEmail) return;
    setCompose({ to: selectedEmail.from, cc: "", subject: `Re: ${selectedEmail.subject}`, body: `\n\n--- Original Message ---\nFrom: ${selectedEmail.fromName} <${selectedEmail.from}>\nDate: ${selectedEmail.date}\n\n${selectedEmail.body}` });
    setComposing(true);
  };

  const unreadCount = (folderId) => emails.filter((e) => e.folder === folderId && !e.read).length;

  return (
    <div style={{ display: "flex", height: "100%", background: "#1e1e1e" }} data-testid="thunderbird-app">
      {/* Folder sidebar */}
      <div style={{ width: 160, background: "#252525", borderRight: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", padding: "8px 0" }}>
        <div style={{ padding: "8px 12px", fontSize: "0.7rem", color: "#5e5c64", textTransform: "uppercase", letterSpacing: 1 }}>user@debian-desktop.local</div>
        {FOLDERS.map((f) => (
          <button
            key={f.id}
            onClick={() => { setFolder(f.id); setSelected(null); }}
            style={{
              display: "flex", alignItems: "center", gap: 8, padding: "7px 12px",
              background: folder === f.id ? "rgba(53,132,228,0.15)" : "none",
              border: "none", color: folder === f.id ? "#3584e4" : "#9a9996",
              cursor: "pointer", fontSize: "0.8rem", textAlign: "left",
              borderLeft: folder === f.id ? "3px solid #3584e4" : "3px solid transparent",
            }}
          >
            <span>{f.icon}</span>
            <span style={{ flex: 1 }}>{f.label}</span>
            {unreadCount(f.id) > 0 && (
              <span style={{ background: "#3584e4", color: "white", borderRadius: 10, padding: "1px 6px", fontSize: "0.65rem" }}>{unreadCount(f.id)}</span>
            )}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button
          onClick={() => { setComposing(true); setCompose({ to: "", cc: "", subject: "", body: "" }); }}
          style={{ margin: "8px 12px", padding: "8px 12px", background: "#3584e4", border: "none", borderRadius: 6, color: "white", cursor: "pointer", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: 6 }}
          data-testid="thunderbird-compose"
        ><Plus size={14} />Compose</button>
      </div>

      {/* Email list */}
      <div style={{ width: 260, borderRight: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "8px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.06)", borderRadius: 6, padding: "4px 8px" }}>
            <Search size={12} color="#5e5c64" />
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search emails..." style={{ background: "none", border: "none", color: "white", fontSize: "0.75rem", outline: "none", width: "100%" }} />
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {folderEmails.length === 0 && <div style={{ padding: 16, fontSize: "0.75rem", color: "#5e5c64", textAlign: "center" }}>No emails</div>}
          {folderEmails.map((email) => (
            <div
              key={email.id}
              onClick={() => { setSelected(email.id); markRead(email.id); setComposing(false); }}
              style={{
                padding: "10px 12px", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.04)",
                background: selected === email.id ? "rgba(53,132,228,0.1)" : "transparent",
              }}
              data-testid={`email-${email.id}`}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                {!email.read && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#3584e4", flexShrink: 0 }} />}
                <span style={{ flex: 1, fontSize: "0.8rem", fontWeight: email.read ? 400 : 600, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{email.fromName}</span>
                <button onClick={(e) => toggleStar(email.id, e)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: email.starred ? "#f8e45c" : "#5e5c64" }}><Star size={11} fill={email.starred ? "#f8e45c" : "none"} /></button>
              </div>
              <div style={{ fontSize: "0.75rem", color: email.read ? "#9a9996" : "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 2 }}>{email.subject}</div>
              <div style={{ fontSize: "0.65rem", color: "#5e5c64" }}>{email.date}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Email view / Compose */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {composing ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 16 }}>
            <div style={{ fontWeight: 600, color: "white", marginBottom: 12, fontSize: "0.9rem" }}>New Message</div>
            {[
              { label: "To:", key: "to", placeholder: "recipient@example.com" },
              { label: "Cc:", key: "cc", placeholder: "cc@example.com" },
              { label: "Subject:", key: "subject", placeholder: "Subject" },
            ].map((field) => (
              <div key={field.key} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: "0.75rem", color: "#9a9996", width: 52, textAlign: "right" }}>{field.label}</span>
                <input
                  value={compose[field.key]}
                  onChange={(e) => setCompose((c) => ({ ...c, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, color: "white", padding: "5px 8px", fontSize: "0.8rem", outline: "none" }}
                  data-testid={`compose-${field.key}`}
                />
              </div>
            ))}
            {/* Formatting toolbar */}
            <div style={{ display: "flex", gap: 4, padding: "4px 0", marginBottom: 4 }}>
              {[<Bold size={13} />, <Italic size={13} />, <List size={13} />, <Paperclip size={13} />].map((icon, i) => (
                <button key={i} style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, color: "#9a9996", cursor: "pointer", padding: "3px 6px" }}>{icon}</button>
              ))}
            </div>
            <textarea
              value={compose.body}
              onChange={(e) => setCompose((c) => ({ ...c, body: e.target.value }))}
              placeholder="Write your message..."
              style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "white", padding: "10px 12px", fontSize: "0.85rem", resize: "none", outline: "none", lineHeight: 1.6 }}
              data-testid="compose-body"
            />
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={sendEmail} style={{ padding: "8px 20px", background: "#3584e4", border: "none", borderRadius: 6, color: "white", cursor: "pointer", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: 6 }} data-testid="compose-send"><Send size={14} />Send</button>
              <button onClick={() => setComposing(false)} style={{ padding: "8px 16px", background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 6, color: "#9a9996", cursor: "pointer", fontSize: "0.875rem" }}>Discard</button>
            </div>
          </div>
        ) : selectedEmail ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {/* Email toolbar */}
            <div style={{ display: "flex", gap: 4, padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.08)", flexWrap: "wrap" }}>
              <button onClick={startReply} style={emailBtn}><Reply size={13} />Reply</button>
              <button style={emailBtn}><ReplyAll size={13} />Reply All</button>
              <button style={emailBtn}><Forward size={13} />Forward</button>
              <div style={{ flex: 1 }} />
              <button onClick={() => toggleStar(selectedEmail.id, { stopPropagation: () => {} })} style={{ ...emailBtn, color: selectedEmail.starred ? "#f8e45c" : undefined }}><Star size={13} fill={selectedEmail.starred ? "#f8e45c" : "none"} /></button>
              <button onClick={() => archiveEmail(selectedEmail.id)} style={emailBtn}><Archive size={13} />Archive</button>
              <button onClick={() => deleteEmail(selectedEmail.id)} style={{ ...emailBtn, color: "#e01b24" }}><Trash2 size={13} />Delete</button>
            </div>
            {/* Email content */}
            <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
              <div style={{ fontSize: "1.1rem", fontWeight: 600, color: "white", marginBottom: 12 }}>{selectedEmail.subject}</div>
              <div style={{ display: "flex", gap: 12, marginBottom: 16, padding: 12, background: "rgba(255,255,255,0.04)", borderRadius: 8 }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#3584e4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", color: "white", flexShrink: 0 }}>
                  {selectedEmail.fromName[0]}
                </div>
                <div>
                  <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "white" }}>{selectedEmail.fromName}</div>
                  <div style={{ fontSize: "0.75rem", color: "#9a9996" }}>{selectedEmail.from}</div>
                  <div style={{ fontSize: "0.7rem", color: "#5e5c64" }}>{selectedEmail.date}</div>
                </div>
              </div>
              <div style={{ fontSize: "0.875rem", color: "#eeeeec", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{selectedEmail.body}</div>
              {selectedEmail.attachments.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: "0.75rem", color: "#9a9996", marginBottom: 8 }}>Attachments:</div>
                  {selectedEmail.attachments.map((att) => (
                    <div key={att} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 10px", background: "rgba(255,255,255,0.06)", borderRadius: 6, fontSize: "0.75rem", color: "#9a9996", marginRight: 8 }}>
                      <Paperclip size={12} />{att}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, color: "#5e5c64" }}>
            <Mail size={48} />
            <div>Select an email to read</div>
          </div>
        )}
      </div>
    </div>
  );
}

const emailBtn = {
  display: "flex", alignItems: "center", gap: 4, padding: "4px 10px",
  background: "none", border: "none", color: "#9a9996", cursor: "pointer",
  fontSize: "0.75rem", borderRadius: 4,
};
