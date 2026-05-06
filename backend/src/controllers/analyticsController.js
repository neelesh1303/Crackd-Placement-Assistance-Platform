//this file is responsible for handling the analytics related operations. it contains a controller function getAnalyticsSummary which retrieves various analytics data from the Experience collection in the database and returns it in a structured format to the frontend. this data includes company counts, round type frequency, yearly trends, and top roles based on the experiences shared by users. the function uses MongoDB aggregation pipelines to perform complex queries and transformations on the data to generate the required analytics summary.

const Experience = require("../models/Experience");

exports.getAnalyticsSummary = async (req, res) => {
  try {
    const companyCounts = await Experience.aggregate([ //ye aggregation pipeline company wise experience counts aur offer rates calculate karta hai. pehle $unwind operator se company field ko unwind karte hain, taki har experience ke liye ek document mile jisme company field ka ek single value ho. fir $group operator se company ke basis par documents ko group karte hain, aur count aur offers ka sum calculate karte hain. uske baad $lookup operator se companies collection se company details ko join karte hain, taki hume company name aur slug mil jaye. fir $project operator se final output format define karte hain, jisme companyId, companyName, slug, count, aur offerRate include hote hain. finally, $sort operator se results ko count ke descending order me sort karte hain, aur $limit operator se top 12 companies tak results limit kar dete hain.
      {
        $group: { //group ka use documents ko company ke basis pe group krne ke liye hota hai. (in mongodb we store data in the form of documents), aur agar hume kisi specific field ke basis par data ko group karna hai to hum $group operator ka use karte hain. 
          _id: "$company",
          count: { $sum: 1 },
          offers: { $sum: { $cond: ["$gotOffer", 1, 0] } }, //ye line ye check karti hai ki gotOffer field true hai ya false. agar true hai to 1 add karegi offers sum me, aur agar false hai to 0 add karegi. isse hume pata chalega ki har company ke liye kitne experiences me offer mila hai, jise hum offer rate calculate karne ke liye use karenge. cond operator ka use karke hum gotOffer field ke value ke basis par condition check karte hain, aur uske accordingly 1 ya 0 add karte hain offers sum me. isse hume accurate offer count milta hai har company ke liye, jise hum offer rate calculate karne ke liye use karenge.
        },
      },
      { //$lookup bolta hai: “Is ID ka matching data dusri table se nikaal ke attach kar do”. foreign key or primary key jaisa hai. yahan hum companies collection se company field ke value (jo ki company ka ObjectId hai) ke basis par matching document nikaal ke attach kar rahe hain. from: me hum specify karte hain ki kis collection se data nikaalna hai, localField me specify karte hain ki current collection me kaunsa field use karna hai join ke liye, foreignField me specify karte hain ki dusri collection me kaunsa field use karna hai join ke liye, aur as: me specify karte hain ki join karke jo data milega usko current document me kis naam se store karna hai.
        $lookup: { 
          from: "companies",
          localField: "_id",
          foreignField: "_id",
          as: "company",
        },
      },
      { $unwind: "$company" }, //$lookup ke baad company field ek array ban jata hai, jisme matching company document hota hai. kyunki har experience ke liye sirf ek company hoti hai, to hum $unwind operator ka use karke is array ko unwind kar dete hain, taki company field me se directly company document ka object mil jaye, aur hume uske name aur slug fields ko access karna easy ho jaye.
      {
        $project: { //ye stage final output format define karta hai. hume companyId, companyName, slug, count, aur offerRate chahiye. companyId ke liye hum company._id use karte hain, companyName ke liye company.name, slug ke liye company.slug, count to wahi count hai jo humne $group stage me calculate kiya tha. offerRate calculate karne ke liye hum offers ko count se divide karke percentage me convert karte hain. agar count 0 hai to offerRate 0 set kar dete hain, taki division by zero error na aaye. $round operator ka use karke hum offerRate ko 1 decimal place tak round kar dete hain. project ka use karke hum output me sirf required fields ko include karte hain, aur _id field ko exclude kar dete hain by setting it to 0.
          _id: 0,
          companyId: "$company._id",
          companyName: "$company.name",
          slug: "$company.slug",
          count: 1,
          offerRate: {
            $round: [
              {
                $multiply: [
                  {
                    $cond: [
                      { $eq: ["$count", 0] },
                      0,
                      { $divide: ["$offers", "$count"] },
                    ],
                  },
                  100,
                ],
              },
              1,
            ],
          },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 12 },
    ]);

    const roundTypeFrequency = await Experience.aggregate([ //ye aggregation pipeline interview round type ke frequency ko calculate karta hai. pehle $unwind operator se rounds array ko unwind karte hain, taki har experience ke liye har round ke liye ek document mile. fir $group operator se rounds.type ke basis par documents ko group karte hain, aur count calculate karte hain ki har round type kitni baar occur hua hai. uske baad $project operator se final output format define karte hain, jisme type aur count fields include hote hain. finally, $sort operator se results ko count ke descending order me sort karte hain, taki sabse common round types pehle dikhai de.
      { $unwind: "$rounds" },
      {
        $group: {
          _id: "$rounds.type",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0, 
          type: "$_id",
          count: 1,
        },
      },
      { $sort: { count: -1 } },
    ]);

    const yearlyTrend = await Experience.aggregate([ //ye aggregation pipeline yearly trend of experiences ko calculate karta hai. pehle $match operator se un documents ko filter karte hain jisme year field null nahi hai, taki hume sirf valid year values ke sath experiences mile. fir $group operator se year ke basis par documents ko group karte hain, aur count calculate karte hain ki har year me kitne experiences share kiye gaye. uske baad $project operator se final output format define karte hain, jisme year aur count fields include hote hain. finally, $sort operator se results ko year ke ascending order me sort karte hain, taki hume yearly trend dekhne me asani ho.
      { $match: { year: { $ne: null } } }, //filters documents where year field is not null
      {
        $group: {
          _id: "$year",
          count: { $sum: 1 }, //calculates the total count of experiences for each year by summing 1 for each document in the group
        },
      },
      {
        $project: {
          _id: 0,
          year: "$_id",
          count: 1, //includes the count field in the output and renames _id to year for better readability. this stage defines the final output format of the aggregation pipeline, where we want to have year and count fields in the result, and we exclude the default _id field by setting it to 0.
        },
      },
      { $sort: { year: 1 } },
    ]);

    const topRoles = await Experience.aggregate([ //ye aggregation pipeline top roles ko calculate karta hai. pehle $match operator se un documents ko filter karte hain jisme role field empty nahi hai, taki hume sirf valid roles ke sath experiences mile. fir $group operator se role ke basis par documents ko group karte hain, aur count calculate karte hain ki har role kitni baar occur hua hai. uske baad $project operator se final output format define karte hain, jisme role aur count fields include hote hain. finally, $sort operator se results ko count ke descending order me sort karte hain, taki sabse common roles pehle dikhai de.
      { $match: { role: { $ne: "" } } },
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          role: "$_id",
          count: 1,
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    res.status(200).json({
      success: true,
      analytics: {
        companyCounts,
        roundTypeFrequency,
        yearlyTrend,
        topRoles,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};