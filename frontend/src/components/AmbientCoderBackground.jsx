import { useMemo } from "react";

const CODE_BLOCK_1 = `
#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    int lowerBound(vector<int>& nums, int target) {
        int low = 0, high = nums.size() - 1;
        int ans = nums.size();
        while (low <= high) {
            int mid = low + (high - low) / 2;
            if (nums[mid] >= target) {
                ans = mid;
                high = mid - 1;
            } else {
                low = mid + 1;
            }
        }
        return ans;
    }

    vector<vector<int>> mergeIntervals(vector<vector<int>>& intervals) {
        if (intervals.empty()) return {};
        sort(intervals.begin(), intervals.end());
        vector<vector<int>> merged = {intervals[0]};
        for (int i = 1; i < intervals.size(); i++) {
            if (intervals[i][0] <= merged.back()[1]) {
                merged.back()[1] = max(merged.back()[1], intervals[i][1]);
            } else {
                merged.push_back(intervals[i]);
            }
        }
        return merged;
    }

    int maxProfit(vector<int>& prices) {
        int minPrice = 1e9, maxProfit = 0;
        for (int p : prices) {
            minPrice = min(minPrice, p);
            maxProfit = max(maxProfit, p - minPrice);
        }
        return maxProfit;
    }
};
`;

const CODE_BLOCK_2 = `
import collections
import heapq

def dijkstra(graph, start, n):
    dist = {i: float('inf') for i in range(n)}
    dist[start] = 0
    pq = [(0, start)]
    while pq:
        d, u = heapq.heappop(pq)
        if d > dist[u]:
            continue
        for v, w in graph.get(u, []):
            if dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
                heapq.heappush(pq, (dist[v], v))
    return dist

def longestSubstring(s: str) -> int:
    last = {}
    left = 0
    ans = 0
    for right, ch in enumerate(s):
        if ch in last and last[ch] >= left:
            left = last[ch] + 1
        last[ch] = right
        ans = max(ans, right - left + 1)
    return ans

def knapsack(weights, values, capacity):
    dp = [0] * (capacity + 1)
    for w, v in zip(weights, values):
        for cap in range(capacity, w - 1, -1):
            dp[cap] = max(dp[cap], dp[cap - w] + v)
    return dp[capacity]
`;

const CODE_BLOCK_3 = `
interface TreeNode {
  val: number;
  left: TreeNode | null;
  right: TreeNode | null;
}

function lowestCommonAncestor(root: TreeNode | null, p: number, q: number): TreeNode | null {
  if (!root || root.val === p || root.val === q) return root;
  const left = lowestCommonAncestor(root.left, p, q);
  const right = lowestCommonAncestor(root.right, p, q);
  if (left && right) return root;
  return left || right;
}

function topologicalSort(numCourses: number, prerequisites: number[][]): number[] {
  const inDegree = new Array(numCourses).fill(0);
  const adj = Array.from({ length: numCourses }, () => [] as number[]);
  for (const [dest, src] of prerequisites) {
    adj[src].push(dest);
    inDegree[dest]++;
  }
  const queue: number[] = [];
  for (let i = 0; i < numCourses; i++) {
    if (inDegree[i] === 0) queue.push(i);
  }
  const order: number[] = [];
  while (queue.length > 0) {
    const node = queue.shift()!;
    order.push(node);
    for (const next of adj[node]) {
      inDegree[next]--;
      if (inDegree[next] === 0) queue.push(next);
    }
  }
  return order.length === numCourses ? order : [];
}
`;

function AmbientCoderBackground() {
  const doubleBlock1 = useMemo(() => `${CODE_BLOCK_1}\n${CODE_BLOCK_1}\n${CODE_BLOCK_1}`, []);
  const doubleBlock2 = useMemo(() => `${CODE_BLOCK_2}\n${CODE_BLOCK_2}\n${CODE_BLOCK_2}`, []);
  const doubleBlock3 = useMemo(() => `${CODE_BLOCK_3}\n${CODE_BLOCK_3}\n${CODE_BLOCK_3}`, []);

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* 1. Base Dark Midnight Backdrop */}
      <div className="absolute inset-0 bg-[#101517]" />

      {/* 2. Anime Coder Desk Art Backdrop */}
      <div
        className="absolute inset-0 bg-cover bg-center md:bg-right opacity-45 mix-blend-screen scale-105 filter blur-[0.5px]"
        style={{
          backgroundImage: `url('/images/anime_coder_bg.jpg')`,
        }}
      />

      {/* 3. Deep Dark Overlay & Vignette Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#101416] via-[#101416]/80 to-[#12181a]/85" />
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-[#101416]/50 to-[#0c1011]" />

      {/* 4. Ambient Cyan/Teal Glowing Lights */}
      <div className="absolute top-1/4 right-1/4 w-[32rem] h-[32rem] rounded-full bg-cyan-500/15 filter blur-[120px] animate-pulse" />
      <div className="absolute bottom-12 right-12 w-96 h-96 rounded-full bg-teal-500/12 filter blur-[100px]" />
      <div className="absolute top-12 left-12 w-80 h-80 rounded-full bg-indigo-500/10 filter blur-[90px]" />

      {/* 5. Infinite Code Stream Columns Scrolling Upwards Constantly */}
      <div className="absolute inset-0 flex justify-between md:justify-end gap-8 md:gap-14 px-4 md:pr-12 opacity-[0.22] overflow-hidden mask-fade-gradient">
        {/* Left column on wider screens */}
        <div className="hidden xl:block w-72 overflow-hidden text-[10px] font-mono leading-4 text-cyan-300">
          <div className="animate-code-scroll-up-fast whitespace-pre">
            {doubleBlock1}
          </div>
        </div>

        {/* Center column */}
        <div className="hidden md:block w-80 overflow-hidden text-[11px] font-mono leading-4 text-teal-300">
          <div className="animate-code-scroll-up-medium whitespace-pre">
            {doubleBlock2}
          </div>
        </div>

        {/* Right column */}
        <div className="w-80 md:w-96 overflow-hidden text-[10.5px] font-mono leading-4 text-sky-400">
          <div className="animate-code-scroll-up-slow whitespace-pre">
            {doubleBlock3}
          </div>
        </div>
      </div>

      {/* 6. Subtle Cyber Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] opacity-35" />
    </div>
  );
}

export default AmbientCoderBackground;
