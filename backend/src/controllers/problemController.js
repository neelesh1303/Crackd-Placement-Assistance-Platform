//is controller ka kaam problem related operations ko handle karna hai, jaise ki problem create karna aur problems ko fetch karna. isme hum Problem model ka use karke database me problems ko store aur retrieve karte hain. createProblem function me hum request body se data lete hain, usme addedBy field me current logged in user ka id add karte hain, aur fir Problem.create() method ka use karke new problem document create karte hain. getProblems function me hum query parameters ke basis par filter banate hain, aur fir Problem.find() method ka use karke matching problems ko database se retrieve karte hain, jisme company aur addedBy fields ko populate karke unke details bhi fetch karte hain.

const Problem = require("../models/Problem");
const Company = require("../models/Company");

exports.createProblem = async (req, res) => { //exports ka mtlb hai ki hum createProblem function ko is module se bahar use kar sakte hain, jaise ki routes me.
  try {
    const payload = {
      ...req.body, //mtlb request body me jo bhi data aayega usko spread operator ke through payload object me copy kar diya jayega, taki hum us data ko easily manipulate kar sake aur fir database me store kar sake.
      addedBy: req.user.id,
    };

    const problem = await Problem.create(payload);

    res.status(201).json({
      success: true,
      problem,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getProblems = async (req, res) => {
  try {
    const { company, difficulty, topic, role, q } = req.query; //req.query se hum query parameters ko extract karte hain, jise frontend se URL ke through bheja jata hai. jaise agar frontend se /api/problems?company=google&difficulty=medium par GET request aayegi to req.query me company ki value "google" aur difficulty ki value "medium" hogi. isse hum filter banane ke liye use karenge taki database me se sirf matching problems ko retrieve kar sake.
    const filter = {}; //iska kaam hai ki hum ek empty filter object banayenge, jisme hum query parameters ke basis par conditions add karenge. fir is filter object ko Problem.find() method me pass karenge taki database me se sirf wo problems retrieve ho jaye jo in conditions ko satisfy karti hain.

    if (company) { //agar company query parameter present hai to hum company ke slug ke basis par us company ko database me find karenge, taki hume us company ka ObjectId mil jaye. fir is ObjectId ko filter.company me set karenge, taki jab hum Problem.find() method call kare to wo sirf un problems ko retrieve kare jinka company field is ObjectId ke barabar hai. agar company slug ke basis par koi company nahi milti hai to hum 200 status code ke sath empty problems array return kar denge, taki frontend me "No problems found" message dikhai de.
      const companyDoc = await Company.findOne({ slug: company.toLowerCase() });
      if (!companyDoc) {
        return res.status(200).json({ success: true, count: 0, problems: [] });
      }
      filter.company = companyDoc._id; //companyDoc._id se hume company ke ObjectId mil jata hai, jise hum filter.company me set kar dete hain. isse jab hum Problem.find() method call karenge to wo sirf un problems ko retrieve karega jinka company field is ObjectId ke barabar hai, yani ki wo problems jo is specific company se related hain.
    }

    if (difficulty) {
      filter.difficulty = difficulty;
    }

    if (topic) {
      filter.topic = { $regex: topic, $options: "i" }; //ye filter topic field me case-insensitive search ke liye hai. $regex operator ka use karke hum topic field me se wo documents find karenge jisme topic query parameter ke value ka match hota hai, regardless of case. $options: "i" se ye ensure hota hai ki search case-insensitive ho, yani ki agar topic query parameter me "array" diya gaya hai to wo "Array", "ARRAY", ya "aRrAy" sabhi ko match karega.
    }

    if (role) {
      filter.role = { $regex: role, $options: "i" };
    }

    if (q) { //q query parameter ke basis par hum title aur notes fields me case-insensitive search karenge. $or operator ka use karke hum specify karte hain ki title field me ya notes field me se kisi bhi field me q query parameter ke value ka match hona chahiye. isse user ko ek general search functionality milti hai, jisme wo title ya notes ke basis par problems ko search kar sakta hai.
      filter.$or = [
        { title: { $regex: q, $options: "i" } },
        { notes: { $regex: q, $options: "i" } },
      ];
    }

    const problems = await Problem.find(filter) //is function ka kaam hai ki hum Problem model ke find() method ko call karke database me se problems ko retrieve karte hain, jisme hum filter object ko pass karte hain taki sirf matching problems hi retrieve ho. iske alawa hum populate() method ka use karke company aur addedBy fields ke references ko populate karte hain, taki hume unke details bhi mil jaye. finally, sort({ createdAt: -1 }) se hum problems ko descending order me sort karte hain based on their creation date, taki latest problems pehle dikhai de.
      .populate("company", "name slug")
      .populate("addedBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: problems.length,
      problems,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};