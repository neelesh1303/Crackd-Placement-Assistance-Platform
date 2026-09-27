import { useState, useEffect, useRef } from "react";

const CODE_SNIPPETS = [
  {
    title: "binary_search.cpp",
    lang: "cpp",
    topic: "Binary Search",
    lines: [
      "// Crackd AlgoStream: Binary Search (Lower Bound)",
      "int lowerBound(vector<int>& arr, int target) {",
      "    int low = 0, high = arr.size() - 1;",
      "    int ans = arr.size();",
      "    while (low <= high) {",
      "        int mid = low + (high - low) / 2;",
      "        if (arr[mid] >= target) {",
      "            ans = mid; // potential candidate",
      "            high = mid - 1; // search left half",
      "        } else {",
      "            low = mid + 1;  // search right half",
      "        }",
      "    }",
      "    return ans; // Time: O(log N) | Space: O(1)",
      "}",
    ],
  },
  {
    title: "merge_intervals.py",
    lang: "python",
    topic: "Greedy / Intervals",
    lines: [
      "# Crackd AlgoStream: Merge Overlapping Intervals",
      "def mergeIntervals(intervals: list[list[int]]):",
      "    intervals.sort(key=lambda x: x[0])",
      "    merged = []",
      "    for start, end in intervals:",
      "        if not merged or merged[-1][1] < start:",
      "            merged.append([start, end])",
      "        else:",
      "            merged[-1][1] = max(merged[-1][1], end)",
      "    return merged  # Time: O(N log N)",
    ],
  },
  {
    title: "knapsack_dp.ts",
    lang: "typescript",
    topic: "Dynamic Programming",
    lines: [
      "// Crackd AlgoStream: 0/1 Knapsack (Space Optimized)",
      "function knapsack(weights: number[], val: number[], W: number): number {",
      "  const dp = new Array(W + 1).fill(0);",
      "  for (let i = 0; i < weights.length; i++) {",
      "    for (let w = W; w >= weights[i]; w--) {",
      "      dp[w] = Math.max(dp[w], val[i] + dp[w - weights[i]]);",
      "    }",
      "  }",
      "  return dp[W]; // Optimal Substructure",
      "}",
    ],
  },
  {
    title: "sliding_window.go",
    lang: "go",
    topic: "Two Pointers",
    lines: [
      "// Crackd AlgoStream: Longest Substring Without Repeating",
      "func lengthOfLongestSubstring(s string) int {",
      "    lastSeen := make(map[byte]int)",
      "    maxLen, left := 0, 0",
      "    for right := 0; right < len(s); right++ {",
      "        if idx, ok := lastSeen[s[right]]; ok && idx >= left {",
      "            left = idx + 1",
      "        }",
      "        lastSeen[s[right]] = right",
      "        if right-left+1 > maxLen { maxLen = right - left + 1 }",
      "    }",
      "    return maxLen",
      "}",
    ],
  },
];

function highlightSyntax(line) {
  if (line.startsWith("//") || line.startsWith("#")) {
    return <span className="text-emerald-400/80 italic font-mono">{line}</span>;
  }

  // Tokenize line with simple syntax highlight regex
  const parts = line.split(/(\b(?:const|let|var|function|def|int|return|while|if|else|for|in|lambda|vector|map|make|type|class|new)\b|[{}()[\]:,;=<>+*\-/]|\b\d+\b|"[^"]*"|'[^']*')/g);

  return (
    <span className="font-mono">
      {parts.map((token, idx) => {
        if (/^(const|let|var|function|def|int|return|while|if|else|for|in|lambda|type|class|new)$/.test(token)) {
          return <span key={idx} className="text-pink-400 font-semibold">{token}</span>;
        }
        if (/^(vector|map|make|list|number|string|Array|Math)$/.test(token)) {
          return <span key={idx} className="text-cyan-400">{token}</span>;
        }
        if (/^\d+$/.test(token)) {
          return <span key={idx} className="text-amber-300">{token}</span>;
        }
        if (/^["'].*["']$/.test(token)) {
          return <span key={idx} className="text-emerald-300">{token}</span>;
        }
        if (/^[{}()[\]:,;=<>+*\-/]$/.test(token)) {
          return <span key={idx} className="text-slate-400">{token}</span>;
        }
        if (/^[a-zA-Z_]\w*(?=\()/.test(token)) {
          return <span key={idx} className="text-sky-300">{token}</span>;
        }
        return <span key={idx} className="text-slate-200">{token}</span>;
      })}
    </span>
  );
}

function CodingCompanion() {
  const [snippetIdx, setSnippetIdx] = useState(0);
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [displayedLines, setDisplayedLines] = useState([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const codeContainerRef = useRef(null);

  const currentSnippet = CODE_SNIPPETS[snippetIdx];

  // Typing effect engine
  useEffect(() => {
    if (isPaused || isMinimized) return;

    const timer = setTimeout(() => {
      const currentFullLine = currentSnippet.lines[lineIdx];

      if (charIdx < currentFullLine.length) {
        // Typing current line character by character
        const nextCharIdx = charIdx + 1;
        setCharIdx(nextCharIdx);

        setDisplayedLines((prev) => {
          const updated = [...prev];
          updated[lineIdx] = currentFullLine.slice(0, nextCharIdx);
          return updated;
        });
      } else {
        // Finished current line
        if (lineIdx < currentSnippet.lines.length - 1) {
          // Move to next line
          setLineIdx((prev) => prev + 1);
          setCharIdx(0);
          setDisplayedLines((prev) => [...prev, ""]);
        } else {
          // Finished entire snippet: pause briefly, then cycle to next snippet
          setTimeout(() => {
            setSnippetIdx((prev) => (prev + 1) % CODE_SNIPPETS.length);
            setLineIdx(0);
            setCharIdx(0);
            setDisplayedLines([""]);
          }, 2400);
        }
      }
    }, Math.floor(Math.random() * 20) + 22);

    return () => clearTimeout(timer);
  }, [snippetIdx, lineIdx, charIdx, isPaused, isMinimized, currentSnippet]);

  // Auto scroll terminal container upwards as lines appear
  useEffect(() => {
    if (codeContainerRef.current) {
      codeContainerRef.current.scrollTop = codeContainerRef.current.scrollHeight;
    }
  }, [displayedLines, charIdx]);

  return (
    <aside
      aria-label="Live Algorithm Code Stream"
      className="fixed bottom-5 right-5 z-40 select-none font-sans transition-all duration-300"
    >
      {isMinimized ? (
        <button
          onClick={() => setIsMinimized(false)}
          className="group flex items-center gap-3 rounded-full border border-teal-500/40 bg-[#161d1f]/95 px-4 py-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-lg transition-all hover:scale-105 hover:border-teal-400"
          title="Expand Live Coder"
        >
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75"></span>
            <span className="relative inline-flex h-3 w-3 rounded-full bg-teal-500"></span>
          </span>
          <span className="text-lg">💻</span>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-300">
            AlgoStream
          </span>
          <span className="rounded bg-teal-500/20 px-1.5 py-0.5 text-[10px] font-mono text-teal-200">
            {currentSnippet.topic}
          </span>
        </button>
      ) : (
        <div className="w-[340px] sm:w-[380px] overflow-hidden rounded-2xl border border-teal-500/30 bg-[#141b1d]/95 shadow-[0_20px_60px_rgba(0,0,0,0.65)] backdrop-blur-xl transition-all">
          {/* Terminal Window Header */}
          <div className="flex items-center justify-between border-b border-white/10 bg-[#1a2326] px-3.5 py-2.5">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
              </div>
              <span className="ml-2 font-mono text-xs font-semibold text-slate-300">
                {currentSnippet.title}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-teal-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-teal-300">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-400" />
                typing
              </span>

              <button
                type="button"
                onClick={() => setIsPaused(!isPaused)}
                className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-slate-200 text-xs"
                title={isPaused ? "Resume" : "Pause"}
              >
                {isPaused ? "▶" : "⏸"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setSnippetIdx((prev) => (prev + 1) % CODE_SNIPPETS.length);
                  setLineIdx(0);
                  setCharIdx(0);
                  setDisplayedLines([""]);
                }}
                className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-slate-200 text-xs"
                title="Next snippet"
              >
                ⏭
              </button>

              <button
                type="button"
                onClick={() => setIsMinimized(true)}
                className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-slate-200 text-xs"
                title="Minimize"
              >
                —
              </button>
            </div>
          </div>

          {/* Code Viewer Body with Line Numbers and Scrolling Up */}
          <div
            ref={codeContainerRef}
            className="custom-code-scrollbar h-52 overflow-y-auto bg-[#0f1416]/95 p-3 font-mono text-xs leading-5"
          >
            {displayedLines.map((line, idx) => (
              <div key={idx} className="flex gap-3 hover:bg-white/5 px-1 rounded transition-colors">
                <span className="w-5 select-none text-right text-slate-600 font-mono text-[11px]">
                  {idx + 1}
                </span>
                <div className="flex-1 whitespace-pre-wrap break-all">
                  {highlightSyntax(line)}
                  {idx === lineIdx && !isPaused && (
                    <span className="inline-block w-2 h-3.5 bg-teal-400 animate-pulse align-middle ml-0.5" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Footer Bar with Animated Mascot & Info */}
          <div className="flex items-center justify-between border-t border-white/10 bg-[#161e20] px-3.5 py-2 text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <span className="animate-bounce text-sm">👨‍💻</span>
              <span>
                DSA Pattern:{" "}
                <strong className="text-teal-300">{currentSnippet.topic}</strong>
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              Ln {lineIdx + 1}, Col {charIdx + 1}
            </span>
          </div>
        </div>
      )}
    </aside>
  );
}

export default CodingCompanion;
