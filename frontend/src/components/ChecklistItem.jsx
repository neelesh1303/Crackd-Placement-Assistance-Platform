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

const ChecklistItem = ({ item, index, onStateChange }) => {
  // 3 states: todo → in-progress → done
  const states = ["todo", "in-progress", "done"];
  const colors = {
    todo: "bg-gray-200 text-gray-800",
    "in-progress": "bg-blue-200 text-blue-800",
    done: "bg-green-200 text-green-800",
  };

  const stateLabels = {
    todo: "📌 Todo",
    "in-progress": "⚡ In Progress",
    done: "✅ Done",
  };

  const handleCycle = () => { // ye function checklist item ke state ko cycle karne ke liye hai. jab user button par click karta hai, to ye function current state ko identify karta hai, aur uske next state ko calculate karke onStateChange callback function ko call karta hai. states array me "todo", "in-progress", aur "done" ke order me states define kiye gaye hain, aur current state ke index ko find karke next state ko determine kiya jata hai. isse user apne checklist item ke status ko easily update kar sakta hai, aur progress ko track kar sakta hai.
    const currentIndex = states.indexOf(item.state); 
    const nextState = states[(currentIndex + 1) % states.length];
    onStateChange(index, nextState);
  };

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition">
      <span className="text-gray-700 font-medium">{item.topic}</span>
      <div className="flex items-center gap-2">
        <a
          href={getGfgTopicLink(item.topic)}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-2 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition"
        >
          Study
        </a>
        <button
          onClick={handleCycle}
          className={`px-4 py-2 rounded-full font-semibold cursor-pointer transition ${colors[item.state]}`}
        >
          {stateLabels[item.state]}
        </button>
      </div>
    </div>
  );
};

export default ChecklistItem;