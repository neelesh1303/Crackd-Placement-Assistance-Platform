import React from "react";

const TOPIC_GFG_LINKS = {
  Arrays: "https://www.geeksforgeeks.org/array-data-structure-guide/",
  Strings: "https://www.geeksforgeeks.org/string-data-structure/",
  Hashing: "https://www.geeksforgeeks.org/hashing-data-structure/",
  "Sliding Window": "https://www.geeksforgeeks.org/window-sliding-technique/",
  "Two Pointers": "https://www.geeksforgeeks.org/two-pointers-technique/",
  Stack: "https://www.geeksforgeeks.org/stack-data-structure/",
  Queue: "https://www.geeksforgeeks.org/queue-data-structure/",
  "Linked List": "https://www.geeksforgeeks.org/data-structures/linked-list/",
  "Binary Search": "https://www.geeksforgeeks.org/binary-search/",
  Recursion: "https://www.geeksforgeeks.org/introduction-to-recursion-2/",
  Backtracking: "https://www.geeksforgeeks.org/backtracking-algorithms/",
  Trees: "https://www.geeksforgeeks.org/binary-tree-data-structure/",
  "Binary Search Tree": "https://www.geeksforgeeks.org/binary-search-tree-data-structure/",
  Heaps: "https://www.geeksforgeeks.org/heap-data-structure/",
  Graphs: "https://www.geeksforgeeks.org/graph-data-structure-and-algorithms/",
  "BFS & DFS": "https://www.geeksforgeeks.org/breadth-first-search-or-bfs-for-a-graph/",
  "Dynamic Programming": "https://www.geeksforgeeks.org/dynamic-programming/",
  Greedy: "https://www.geeksforgeeks.org/greedy-algorithms/",
  "Bit Manipulation": "https://www.geeksforgeeks.org/bitwise-algorithms/",
  "Math & Number Theory": "https://www.geeksforgeeks.org/maths/number-theory/",
  "OOP Concepts": "https://www.geeksforgeeks.org/object-oriented-programming-oops-concept-in-java/",
  DBMS: "https://www.geeksforgeeks.org/dbms/",
  "SQL Queries": "https://www.geeksforgeeks.org/sql/sql-tutorial/",
  "Operating Systems": "https://www.geeksforgeeks.org/operating-systems/",
  "Computer Networks": "https://www.geeksforgeeks.org/computer-network-tutorials/",
  "System Design Basics": "https://www.geeksforgeeks.org/system-design-tutorial/",
  "LLD Basics": "https://www.geeksforgeeks.org/low-level-design-lld/",
  "Process & Threads": "https://www.geeksforgeeks.org/difference-between-process-and-thread/",
  "Memory Management": "https://www.geeksforgeeks.org/memory-management-in-operating-system/",
  "TCP/IP & HTTP": "https://www.geeksforgeeks.org/tcp-ip-model/",
};

const getGfgTopicLink = (topic) => {
  if (TOPIC_GFG_LINKS[topic]) return TOPIC_GFG_LINKS[topic];
  return `https://www.google.com/search?q=${encodeURIComponent(`site:geeksforgeeks.org ${topic}`)}`;
};

// 3 states: todo → in-progress → done
const states = ["todo", "in-progress", "done"];

const stateLabels = {
  todo: "to do",
  "in-progress": "on it",
  done: "done",
};

const stateTags = {
  todo: "tag tag-ghost",
  "in-progress": "tag tag-hi",
  done: "tag tag-green",
};

const ChecklistItem = ({ item, index, onStateChange }) => {
  // ye function checklist item ke state ko cycle karta hai: todo → in-progress → done → todo
  const handleCycle = () => {
    const currentIndex = states.indexOf(item.state);
    const nextState = states[(currentIndex + 1) % states.length];
    onStateChange(index, nextState);
  };

  return (
    <div className="check-row" data-state={item.state}>
      <button
        type="button"
        onClick={handleCycle}
        className="check-box"
        data-state={item.state}
        aria-label={`${item.topic}: ${stateLabels[item.state] || item.state}. Click to change.`}
      >
        {item.state === "done" ? "✓" : ""}
      </button>
      <span className="check-topic">{item.topic}</span>
      <button type="button" onClick={handleCycle} className={`${stateTags[item.state] || "tag"} hidden cursor-pointer sm:inline-flex`}>
        {stateLabels[item.state] || item.state}
      </button>
      <a
        href={getGfgTopicLink(item.topic)}
        target="_blank"
        rel="noopener noreferrer"
        className="link-ink shrink-0 text-sm"
      >
        Study ↗
      </a>
    </div>
  );
};

export default ChecklistItem;
