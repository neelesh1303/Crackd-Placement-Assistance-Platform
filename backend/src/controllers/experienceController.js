const Experience = require("../models/Experience");
const Company = require("../models/Company");
const User = require("../models/User");

const normalizeSlug = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

//exports filtered experiences to the frontend
exports.getExperiences = async (req, res) => { //getExperiences function ka use placement experiences ko retrieve karne ke liye kiya jata hai. is function me hum query parameters ke through filtering options provide karte hain, jaise company, year, aur role. ye function database se experiences ko filter karke, unke sath company aur user details ko populate karke, aur unhe createdAt ke descending order me sort karke return karta hai. isse frontend me users ko relevant placement experiences dikhaye ja sakte hain based on unke search criteria.
  try {
    const { company, year, role } = req.query; //query parameters se company, year, aur role ko extract kiya jata hai, jisse hum database query me filtering ke liye use karenge. 
    const filter = {}; //filter object banaya jata hai jisme hum dynamically query parameters ke basis par filtering conditions add karenge. agar company, year, ya role query parameters provide kiye gaye hain to unke corresponding conditions filter object me add ki jayengi, jisse database query me use karke relevant experiences ko retrieve kiya ja sake.

    if (company) {
      const companyDoc = await Company.findOne({ slug: company.toLowerCase() }); //agar company query parameter provide kiya gaya hai to pehle Company collection me se us company ko find kiya jata hai jiska slug field company query parameter ke barabar ho.
      if (!companyDoc) {
        return res.status(200).json({ success: true, count: 0, experiences: [] }); 
      }
      filter.company = companyDoc._id;
    }

    if (year) { //agar year query parameter provide kiya gaya hai to filter object me year field ke liye condition add ki jati hai, jisme year ko Number me convert karke store kiya jata hai. isse database query me use karke specified year ke experiences ko retrieve kiya ja sake.
      filter.year = Number(year);
    }

    if (role){
      filter.role = { $regex: role, $options: "i" }; //agar role query parameter provide kiya gaya hai to filter object me role field ke liye condition add ki jati hai, jisme role ko case-insensitive regular expression ke roop me store kiya jata hai. isse database query me use karke specified role ke experiences ko retrieve kiya ja sake, chahe user ne role ka case kuch bhi type kiya ho.
    }

    const experiences = await Experience.find(filter) //
      .populate("company", "name slug")
      .populate("postedBy", "name email isSenior")
      .sort({ createdAt: -1 }); //filter object ke basis par experiences ko database se find kiya jata hai, jisme company aur postedBy fields ko populate karke unke details fetch kiye jate hain. isse hume experience ke sath company ka name aur slug, aur user ka name, email, aur isSenior status mil jata hai. fir un experiences ko createdAt ke descending order me sort kiya jata hai, taki latest experiences pehle dikhai den.

    res.status(200).json({
      success: true,
      count: experiences.length, 
      experiences,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createExperience = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id).select("isSenior");

    const normalizedRounds = await Promise.all(
      (req.body.rounds || []).map((round) => {
        const rawProblems = Array.isArray(round.problemsAsked) ? round.problemsAsked : [];
        const cleanProblems = [...new Set(rawProblems.map((p) => String(p || "").trim()).filter(Boolean))];

        return {
          ...round,
          problemsAsked: cleanProblems,
        };
      })
    );

    const companyInput = String(req.body.company || "").trim();
    let companyId = null;

    if (companyInput) {
      const slug = normalizeSlug(companyInput);
      let companyDoc = slug
        ? await Company.findOne({ slug })
        : null;

      if (!companyDoc) {
        companyDoc = await Company.findOne({
          name: { $regex: `^${companyInput}$`, $options: "i" },
        });
      }

      if (!companyDoc) {
        let finalSlug = slug || `company-${Date.now()}`;
        let suffix = 0;
        while (await Company.exists({ slug: finalSlug })) {
          suffix += 1;
          finalSlug = `${slug || `company-${Date.now()}`}-${suffix}`;
        }
        companyDoc = await Company.create({
          name: companyInput,
          slug: finalSlug,
          visitMonth: String(req.body.visitMonth || "").trim(),
          visitYear: req.body.visitYear ? Number(req.body.visitYear) : null,
          difficulty: "Medium",
        });
      }

      companyId = companyDoc._id;
    }

    const payload = {
      ...req.body,
      company: companyId,
      rounds: normalizedRounds,
      postedBy: req.user.id,
      isSenior: Boolean(currentUser?.isSenior),
    };

    const experience = await Experience.create(payload);
    await experience.populate("company", "slug");

    res.status(201).json({
      success: true,
      experience,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.toggleUpvoteExperience = async (req, res) => {
  try {
    const experience = await Experience.findById(req.params.id); //experience id ke basis par experience document ko database se find kiya jata hai, taki hum us experience ke upvotes array ko check kar sake aur update kar sake. agar experience nahi milta hai to 404 status code ke sath "Experience not found" message return kiya jata hai.
    if (!experience) {
      return res.status(404).json({ message: "Experience not found" });
    }

    const userId = req.user.id;
    const alreadyUpvoted = experience.upvotes.some((id) => id.toString() === userId); //experience ke upvotes array me check kiya jata hai ki kya current user ka id already upvotes me exist karta hai ya nahi. agar exist karta hai to alreadyUpvoted variable true ho jayega, otherwise false. isse hume pata chalega ki user ne pehle se hi is experience ko upvote kiya hai ya nahi, taki hum uske basis par upvote ko toggle kar sake.

    if (alreadyUpvoted) {
      experience.upvotes = experience.upvotes.filter((id) => id.toString() !== userId);
    } else {
      experience.upvotes.push(userId);
    }

    await experience.save();

    res.status(200).json({
      success: true,
      upvotesCount: experience.upvotes.length,
      upvoted: !alreadyUpvoted,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

