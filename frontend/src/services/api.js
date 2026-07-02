import axios from "axios";

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL || ""}/api`, // Backend URL ko env se lo; deployment me localhost hard-code nahi rahega.
});

api.interceptors.request.use( //axios middleware to add Authorization header with token for every request. jab bhi koi request bheji jayegi, to ye interceptor us request ko intercept karega, aur usme Authorization header add kar dega, jisme token hoga. isse hume har request me manually token add karne ki zarurat nahi padegi.
  (config) => {
    const token = localStorage.getItem("token"); //Browser ke localStorage se JWT token le rahe ho
    if (token) {
      config.headers.Authorization = "Bearer " + token;
    }
    return config; //Modified request ko aage bhej diya
  },
  (error) => Promise.reject(error)
);

//Ye middleware check karta hai token valid hai ya nahi

export default api;

/*
1. Request start hoti hai
2. Interceptor run hota hai
3. localStorage se token uthta hai
4. Header me attach hota hai
5. Final request banti hai:

GET /api/users
Authorization: Bearer xyz123

6. Backend ko request milti hai
7. Backend token verify karta hai
8. Response bhejta hai
*/