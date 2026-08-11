const dns = require("dns");

dns.resolveSrv("_mongodb._tcp.cluster0.f8tjequ.mongodb.net", (err, addresses) => {
  if (err) {
    console.error("DNS Error:", err);
  } else {
    console.log(addresses);
  }
});