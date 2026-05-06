// //ResponsiveContainer component is a wrapper component provided by Recharts that makes the chart responsive to the size of its container. It automatically adjusts the width and height of the chart based on the available space, ensuring that the chart looks good on different screen sizes and devices. 

// import { useEffect, useState } from "react";
// import { // Recharts is a popular React charting library that provides a set of components for creating various types of charts and visualizations. It is built on top of D3.js and offers a simple and intuitive API for integrating charts into React applications. With Recharts, you can easily create responsive and customizable charts such as bar charts, line charts, pie charts, and more, making it a great choice for data visualization in React projects.
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   Tooltip,
//   CartesianGrid,
//   ResponsiveContainer,
//   PieChart,
//   Pie,
//   Cell,
//   LineChart,
//   Line,
//   Legend,
// } from "recharts";
// import api from "../services/api";

// const PIE_COLORS = ["#4f46e5", "#06b6d4", "#16a34a", "#f59e0b", "#ef4444", "#9333ea"];

// function PatternAnalyzer() {
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [analytics, setAnalytics] = useState({
//     companyCounts: [],
//     roundTypeFrequency: [],
//     yearlyTrend: [],
//     topRoles: [],
//   });

//   useEffect(() => {
//     const load = async () => {
//       try {
//         setLoading(true);
//         setError("");
//         const res = await api.get("/analytics/summary");
//         setAnalytics(res.data.analytics || {});
//       } catch (err) {
//         setError(err.response?.data?.message || "Failed to load analytics");
//       } finally {
//         setLoading(false);
//       }
//     };

//     load(); //jab component mount hota hai to load function call karenge, taki analytics data fetch ho jaye. load function me hum API call karenge /analytics/summary endpoint ko, aur response me jo analytics data aayega usse setAnalytics me set kar denge. agar API call me error aata hai to usse setError me set kar denge, taki user ko pata chale ki analytics load nahi ho pa raha. finally block me loading false kar denge, taki user ko pata chale ki loading complete ho chuka hai, chahe successful ho ya error aaye.
//   }, []);

//   //BarChart component is used to create a bar chart visualization. data prop me analytics.companyCounts array pass karte hain, jisme har object me companyName aur count fields hote hain. agar analytics.companyCounts undefined hai to empty array pass karenge, taki chart render ho jaye bina error ke.

//   return (
//     <div className="min-h-screen bg-slate-50 px-4 py-8">
//       <div className="mx-auto max-w-7xl">
//         <h1 className="mb-2 text-3xl font-bold text-slate-900">Pattern Analyzer</h1>
//         <p className="mb-6 text-slate-600">
//           Company trends, round patterns, offer rates, and yearly movement.
//         </p>

//         {error && <p className="mb-4 rounded bg-red-50 p-3 text-red-700">{error}</p>}
//         {loading && <p className="text-slate-600">Loading analytics...</p>}

//         {!loading && !error && (
//           <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
//             <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
//               <h2 className="mb-3 text-lg font-semibold text-slate-900">
//                 Experience Count by Company
//               </h2>
//               <div className="h-80">
//                 <ResponsiveContainer width="100%" height="100%"> 
//                   <BarChart data={analytics.companyCounts || []}> 
//                     <CartesianGrid strokeDasharray="3 3" />
//                     <XAxis //XAxis component is used to define the x-axis of the bar chart. dataKey prop me "companyName" specify karte hain, taki x-axis pe company names dikhai de. tick prop me fontSize 12 set karte hain, taki x-axis ke labels thode chhote aur readable ho jaye. interval={0} se ensure karte hain ki har company name label dikhai de, chahe kitni bhi companies ho. angle={-20} se x-axis ke labels ko thoda tilt kar dete hain, taki agar company names long hain to wo overlap na karein aur easily readable ho jaye. textAnchor="end" se labels ko end me align kar dete hain, taki tilted labels ke saath better alignment ho.
//                       dataKey="companyName"
//                       tick={{ fontSize: 12 }}
//                       interval={0}
//                       angle={-20}
//                       textAnchor="end"
//                       height={70}
//                     />
//                     <YAxis /> 
//                     <Tooltip />
//                     <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]} />
//                   </BarChart>
//                 </ResponsiveContainer>
//               </div>
//             </div>

//             <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
//               <h2 className="mb-3 text-lg font-semibold text-slate-900">
//                 Round Type Frequency
//               </h2>
//               <div className="h-80">
//                 <ResponsiveContainer width="100%" height="100%">
//                   <PieChart>
//                     <Pie
//                       data={analytics.roundTypeFrequency || []}
//                       dataKey="count"
//                       nameKey="type"
//                       cx="50%"
//                       cy="50%"
//                       outerRadius={110}
//                       label
//                     >
//                       {(analytics.roundTypeFrequency || []).map((entry, index) => (
//                         <Cell //Cell component is used to customize the appearance of each slice of the pie chart. dataKey="count" se specify karte hain ki pie slices ka size count field ke basis pe hoga. nameKey="type" se specify karte hain ki har slice ka name type field se aayega. cx aur cy props se pie chart ke center ko define karte hain, yahan "50%" set karne se pie chart container ke center me align ho jata hai. outerRadius prop se pie chart ka size define karte hain, yahan 110 pixels set kiya gaya hai. label prop se ensure karte hain ki har slice pe uska label dikhai de. Cell component ke andar fill prop me PIE_COLORS array se color assign karte hain, jisme index % PIE_COLORS.length karke ensure karte hain ki colors repeat ho jayein agar slices ki sankhya colors se zyada ho.
//                           key={entry.type}
//                           fill={PIE_COLORS[index % PIE_COLORS.length]}
//                         />
//                       ))}
//                     </Pie>
//                     <Tooltip />
//                     <Legend />
//                   </PieChart>
//                 </ResponsiveContainer>
//               </div>
//             </div>

//             <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
//               <h2 className="mb-3 text-lg font-semibold text-slate-900">
//                 Offer Rate by Company
//               </h2>
//               <div className="h-80">
//                 <ResponsiveContainer width="100%" height="100%">
//                   <BarChart data={analytics.companyCounts || []}>
//                     <CartesianGrid strokeDasharray="3 3" />
//                     <XAxis
//                       dataKey="companyName"
//                       tick={{ fontSize: 12 }}
//                       interval={0}
//                       angle={-20}
//                       textAnchor="end"
//                       height={70}
//                     />
//                     <YAxis domain={[0, 100]} />
//                     <Tooltip />
//                     <Bar dataKey="offerRate" fill="#16a34a" radius={[6, 6, 0, 0]} />
//                   </BarChart>
//                 </ResponsiveContainer>
//               </div>
//             </div>

//             <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
//               <h2 className="mb-3 text-lg font-semibold text-slate-900">
//                 Yearly Experience Trend
//               </h2>
//               <div className="h-80">
//                 <ResponsiveContainer width="100%" height="100%">
//                   <LineChart data={analytics.yearlyTrend || []}>
//                     <CartesianGrid strokeDasharray="3 3" />
//                     <XAxis dataKey="year" />
//                     <YAxis />
//                     <Tooltip />
//                     <Line
//                       type="monotone"
//                       dataKey="count"
//                       stroke="#06b6d4"
//                       strokeWidth={3}
//                       dot={{ r: 4 }}
//                     />
//                   </LineChart>
//                 </ResponsiveContainer>
//               </div>
//             </div>

//             <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-2">
//               <h2 className="mb-3 text-lg font-semibold text-slate-900">
//                 Top Roles
//               </h2>
//               <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5">
//                 {(analytics.topRoles || []).map((item) => (
//                   <div
//                     key={item.role}
//                     className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-800"
//                   >
//                     <span className="font-semibold">{item.role}</span>
//                     <span className="ml-2 rounded bg-slate-200 px-2 py-0.5 text-xs">
//                       {item.count}
//                     </span>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// export default PatternAnalyzer;