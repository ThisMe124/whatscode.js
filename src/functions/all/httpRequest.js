const axios = require("axios");

module.exports = async (d) => {
  const inside = d.inside;
  if (!inside) {
    d.isError = true;
    return d.error(`❌ WhatscodeError: Usage: $httpRequest[url;method (optional);body (optional);property (optional);headerName:headerValue;headerName:headerValue;... (optional)]`);
  } else {
    const [url, method = "GET", body, proper, ...insideHeaders] = inside.split(";");
    const headers = {
      "User-Agent": `Whatsapp Bot using Whatscode.js (https://npmjs.com/whatscode.js, ${require("../../../package.json").version})`,
    };

    if (!url) {
      d.isError = true;
      return d.error(`❌ WhatscodeError: url required in $httpRequest!`);
    }

    for (let head of insideHeaders) {
      const [headName, ...headValue] = head.split(":");
      headers[headName] = headValue.join(":");
    }

    let da = await axios(url, {
      method: method,
      headers: headers,
      data: body,
    }).catch((err) => {
      d.isError = true;
      return d.error(
        `❌ WhatscodeError: Cannot interact with url. ERR: ${err}`
      );
    });

    var res = da.data;
    var result = proper
      ? eval(`res${["[", "."].includes(proper[0]) ? proper : `.${proper}`}`)
      : res;
    return JSON.stringify(result, null, 2);
  }
};
