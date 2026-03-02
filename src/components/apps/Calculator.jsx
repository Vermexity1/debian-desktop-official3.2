import { useState, useEffect, useCallback } from "react";
import { Delete, Clock } from "lucide-react";

export default function CalculatorApp() {
  const [display, setDisplay] = useState("0");
  const [expression, setExpression] = useState("");
  const [firstOp, setFirstOp] = useState(null);
  const [operator, setOperator] = useState(null);
  const [waitSecond, setWaitSecond] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [mode, setMode] = useState("basic"); // basic | scientific
  const [memory, setMemory] = useState(0);
  const [conversionMode, setConversionMode] = useState(null);
  const [conversionFrom, setConversionFrom] = useState("m");
  const [conversionTo, setConversionTo] = useState("ft");

  const inputDigit = useCallback((d) => {
    if (waitSecond) {
      setDisplay(String(d));
      setWaitSecond(false);
    } else {
      setDisplay(display === "0" ? String(d) : display + d);
    }
  }, [display, waitSecond]);

  const inputDot = useCallback(() => {
    if (waitSecond) { setDisplay("0."); setWaitSecond(false); return; }
    if (!display.includes(".")) setDisplay(display + ".");
  }, [display, waitSecond]);

  const calc = (a, b, op) => {
    switch (op) {
      case "+": return a + b;
      case "-": return a - b;
      case "*": return a * b;
      case "/": return b !== 0 ? a / b : "Error";
      case "^": return Math.pow(a, b);
      case "%": return a % b;
      default: return b;
    }
  };

  const handleOp = useCallback((op) => {
    const val = parseFloat(display);
    if (firstOp !== null && operator && !waitSecond) {
      const result = calc(firstOp, val, operator);
      setDisplay(String(result));
      setFirstOp(result);
      setExpression(`${result} ${op}`);
    } else {
      setFirstOp(val);
      setExpression(`${val} ${op}`);
    }
    setOperator(op);
    setWaitSecond(true);
  }, [display, firstOp, operator, waitSecond]);

  const handleEquals = useCallback(() => {
    if (firstOp !== null && operator) {
      const val = parseFloat(display);
      const result = calc(firstOp, val, operator);
      const expr = `${firstOp} ${operator} ${val} = ${result}`;
      setHistory((h) => [expr, ...h.slice(0, 19)]);
      setDisplay(String(result));
      setExpression(expr);
      setFirstOp(null);
      setOperator(null);
      setWaitSecond(false);
    }
  }, [display, firstOp, operator]);

  const clear = () => { setDisplay("0"); setFirstOp(null); setOperator(null); setWaitSecond(false); setExpression(""); };
  const backspace = () => setDisplay(display.length > 1 ? display.slice(0, -1) : "0");
  const toggleSign = () => setDisplay(display.startsWith("-") ? display.slice(1) : "-" + display);
  const percent = () => setDisplay(String(parseFloat(display) / 100));



  // Scientific functions
  const applyFn = (fn) => {
    const val = parseFloat(display);
    let result;
    switch (fn) {
      case "sin": result = Math.sin(val * Math.PI / 180); break;
      case "cos": result = Math.cos(val * Math.PI / 180); break;
      case "tan": result = Math.tan(val * Math.PI / 180); break;
      case "sqrt": result = Math.sqrt(val); break;
      case "log": result = Math.log10(val); break;
      case "ln": result = Math.log(val); break;
      case "x2": result = val * val; break;
      case "1/x": result = 1 / val; break;
      case "pi": result = Math.PI; break;
      case "e": result = Math.E; break;
      case "abs": result = Math.abs(val); break;
      case "floor": result = Math.floor(val); break;
      case "ceil": result = Math.ceil(val); break;
      default: result = val;
    }
    setDisplay(String(parseFloat(result.toFixed(10))));
    setWaitSecond(true);
  };

  // Memory functions
  const memStore = () => setMemory(parseFloat(display));
  const memRecall = () => { setDisplay(String(memory)); setWaitSecond(true); };
  const memAdd = () => setMemory(memory + parseFloat(display));
  const memClear = () => setMemory(0);

  // Keyboard support
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.key >= "0" && e.key <= "9") inputDigit(parseInt(e.key));
      else if (e.key === ".") inputDot();
      else if (e.key === "+") handleOp("+");
      else if (e.key === "-") handleOp("-");
      else if (e.key === "*") handleOp("*");
      else if (e.key === "/") { e.preventDefault(); handleOp("/"); }
      else if (e.key === "Enter" || e.key === "=") handleEquals();
      else if (e.key === "Backspace") backspace();
      else if (e.key === "Escape") clear();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [inputDigit, inputDot, handleOp, handleEquals]);

  const basicButtons = [
    { label: "MC", action: memClear, cls: "calc-btn-mem", title: "Memory Clear" },
    { label: "MR", action: memRecall, cls: "calc-btn-mem", title: "Memory Recall" },
    { label: "M+", action: memAdd, cls: "calc-btn-mem", title: "Memory Add" },
    { label: "MS", action: memStore, cls: "calc-btn-mem", title: "Memory Store" },
    { label: "C", action: clear, cls: "calc-btn-clear" },
    { label: "+/-", action: toggleSign, cls: "calc-btn-op" },
    { label: "%", action: percent, cls: "calc-btn-op" },
    { label: "/", action: () => handleOp("/"), cls: "calc-btn-op" },
    { label: "7", action: () => inputDigit(7), cls: "calc-btn-num" },
    { label: "8", action: () => inputDigit(8), cls: "calc-btn-num" },
    { label: "9", action: () => inputDigit(9), cls: "calc-btn-num" },
    { label: "×", action: () => handleOp("*"), cls: "calc-btn-op" },
    { label: "4", action: () => inputDigit(4), cls: "calc-btn-num" },
    { label: "5", action: () => inputDigit(5), cls: "calc-btn-num" },
    { label: "6", action: () => inputDigit(6), cls: "calc-btn-num" },
    { label: "−", action: () => handleOp("-"), cls: "calc-btn-op" },
    { label: "1", action: () => inputDigit(1), cls: "calc-btn-num" },
    { label: "2", action: () => inputDigit(2), cls: "calc-btn-num" },
    { label: "3", action: () => inputDigit(3), cls: "calc-btn-num" },
    { label: "+", action: () => handleOp("+"), cls: "calc-btn-op" },
    { label: "0", action: () => inputDigit(0), cls: "calc-btn-num" },
    { label: ".", action: inputDot, cls: "calc-btn-num" },
    { label: "DEL", action: backspace, cls: "calc-btn-op", icon: true },
    { label: "=", action: handleEquals, cls: "calc-btn-eq" },
  ];

  const sciButtons = [
    { label: "sin", action: () => applyFn("sin"), cls: "calc-btn-sci" },
    { label: "cos", action: () => applyFn("cos"), cls: "calc-btn-sci" },
    { label: "tan", action: () => applyFn("tan"), cls: "calc-btn-sci" },
    { label: "√", action: () => applyFn("sqrt"), cls: "calc-btn-sci" },
    { label: "log", action: () => applyFn("log"), cls: "calc-btn-sci" },
    { label: "ln", action: () => applyFn("ln"), cls: "calc-btn-sci" },
    { label: "x²", action: () => applyFn("x2"), cls: "calc-btn-sci" },
    { label: "1/x", action: () => applyFn("1/x"), cls: "calc-btn-sci" },
    { label: "π", action: () => applyFn("pi"), cls: "calc-btn-sci" },
    { label: "e", action: () => applyFn("e"), cls: "calc-btn-sci" },
    { label: "xⁿ", action: () => handleOp("^"), cls: "calc-btn-sci" },
    { label: "|x|", action: () => applyFn("abs"), cls: "calc-btn-sci" },
  ];

  return (
    <div className="calculator" data-testid="calculator-app">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 8px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display: "flex", gap: 4 }}>
          <button
            onClick={() => { setMode("basic"); setConversionMode(null); }}
            style={{ fontSize: "0.65rem", padding: "2px 8px", borderRadius: 4, background: mode === "basic" && !conversionMode ? "#3584e4" : "transparent", color: mode === "basic" && !conversionMode ? "white" : "#9a9996", border: "none", cursor: "pointer" }}
          >Basic</button>
          <button
            onClick={() => { setMode("scientific"); setConversionMode(null); }}
            style={{ fontSize: "0.65rem", padding: "2px 8px", borderRadius: 4, background: mode === "scientific" && !conversionMode ? "#3584e4" : "transparent", color: mode === "scientific" && !conversionMode ? "white" : "#9a9996", border: "none", cursor: "pointer" }}
          >Scientific</button>
          <button
            onClick={() => setConversionMode(conversionMode ? null : "length")}
            style={{ fontSize: "0.65rem", padding: "2px 8px", borderRadius: 4, background: conversionMode ? "#3584e4" : "transparent", color: conversionMode ? "white" : "#9a9996", border: "none", cursor: "pointer" }}
          >Convert</button>
        </div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          style={{ background: "none", border: "none", color: "#9a9996", cursor: "pointer", padding: 4 }}
          title="History"
        >
          <Clock size={14} />
        </button>
        {memory !== 0 && <span style={{ fontSize: "0.6rem", color: "#3584e4" }}>M={memory}</span>}
      </div>

      {showHistory && (
        <div style={{ maxHeight: 120, overflowY: "auto", background: "#1a1a1a", padding: "4px 8px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          {history.length === 0 ? (
            <div style={{ fontSize: "0.7rem", color: "#5e5c64", textAlign: "center", padding: 8 }}>No history</div>
          ) : (
            history.map((h, i) => (
              <div key={i} style={{ fontSize: "0.7rem", color: "#9a9996", padding: "2px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>{h}</div>
            ))
          )}
        </div>
      )}

      <div className="calc-expression" data-testid="calc-expression">
        {expression || " "}
      </div>
      <div className="calc-display" data-testid="calc-display">
        {display.length > 12 ? parseFloat(display).toExponential(6) : display}
      </div>

      {conversionMode && (
        <div style={{ padding: "8px", background: "#1a1a1a", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", gap: 8, alignItems: "center", fontSize: "0.75rem" }}>
          <select value={conversionFrom} onChange={(e) => setConversionFrom(e.target.value)} style={{ background: "#2a2a2a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, color: "white", padding: "2px 4px" }}>
            <option>m</option><option>ft</option><option>in</option><option>km</option><option>mi</option><option>cm</option><option>mm</option>
          </select>
          <span>=</span>
          <select value={conversionTo} onChange={(e) => setConversionTo(e.target.value)} style={{ background: "#2a2a2a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, color: "white", padding: "2px 4px" }}>
            <option>m</option><option>ft</option><option>in</option><option>km</option><option>mi</option><option>cm</option><option>mm</option>
          </select>
        </div>
      )}

      {mode === "scientific" && !conversionMode && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 3, padding: "4px 8px" }}>
          {sciButtons.map((b) => (
            <button key={b.label} className={`calc-btn ${b.cls}`} onClick={b.action} style={{ fontSize: "0.7rem", padding: "6px 2px" }}>
              {b.label}
            </button>
          ))}
        </div>
      )}

      <div className="calc-grid">
        {basicButtons.map((b) => (
          <button
            key={b.label}
            className={`calc-btn ${b.cls}`}
            onClick={b.action}
            data-testid={`calc-btn-${b.label}`}
            title={b.title}
          >
            {b.icon ? <Delete size={18} /> : b.label}
          </button>
        ))}
      </div>
    </div>
  );
}
