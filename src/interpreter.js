const amap = new Map();

module.exports = async (code, msg, client, args, cmd, db, mentions, r, returnObject) => {
  const data = [];
  const fs = require('fs');
  const parser = require("./functions/parser");
  const { array_move, escapeRegex, check } = require("./models/functions");
  let obj;
  let suppressErr;
  let sections = [];
  let theJid = msg? msg.key.remoteJid : undefined;

  const searched = [];
  function searchFunc(_n, _p) {
    for (const f of _n) {
      const func = _p.filter((filt) => filt == `$${f}`.slice(0, filt.length));

      if (func.length == 1) {
        searched.push(func[0]);
      } else if (func.length > 1) {
        searched.push(func.sort((a, b) => b.length - a.length)[0]);
      }
    }

    return searched;
  }

  const u = {};
  let theFuncs = searchFunc(code.split("$"), parser);

  if (check("$dm", theFuncs)) {
    const findDM = theFuncs.indexOf(
      theFuncs.filter((x) => x.includes("$dm")).join("")
    );
    theFuncs = array_move(theFuncs, findDM, 0);
  }

  for (const func of theFuncs.reverse()) {
    let _iOne = code.split(new RegExp(escapeRegex(func), "gi"));
    _iOne = _iOne[_iOne.length - 1];
    const length = _iOne.split("[").length - 1;
    _iOne = _iOne.split("]").slice(0, length).join("]").replace("[", "");

    data.push({
      name: func,
      inside: _iOne,
    });

    const d = func.replace("$", "").replace("[", "");

    const all = {
      data,
      inside: _iOne,
      msg,
      client,
      code,
      args,
      isError: false,
      cmd,
      unique: false,
      error: (err) => {
        if (!suppressErr) {
          return client.sendMessage(
            msg.key.remoteJid,
            {
              text: `\`\`\`${err.trim()}\`\`\``,
            },
            { quoted: msg }
          );
        }
        return client.sendMessage(
          msg.key.remoteJid,
          {
            text: `\`\`\`${suppressErr.trim().split("{error}").join(err)}\`\`\``,
          },
          { quoted: msg }
        );
      },
      db,
      jid: (n) => {
        if (!n) {
          theJid = msg.key.remoteJid;
        } else {
          theJid = n;
        }
      },
      sections,
    };

    var res = await require(`./functions/all/${d}.js`)(all);

    if (all.unique) {
      if (res.type === "error") {
        suppressErr = res.response;
      } else {
        u[res.type] = res.response;
      }
    }

    code = code.replaceLast(_iOne ? `${func}[${_iOne}]` : func, res);

    if (all.isError) {
      code = "";
      break;
    }
  }

  const c = code.match(/(@[^](?![a-zA-Z]).\d*[$]*)/gm);
  c ? amap.set("mentions", c) : undefined;

  if (amap.get("mentions")) {
    mentions = [];
    for (let i = 0; i < amap.get("mentions").length; i++) {
      if (c[i].match(/^@\d/gm)) {
        const num = c[i].slice(1);
        const [result] = await client.onWhatsApp(num);
        if (result) {
          mentions.push(`${num}@s.whatsapp.net`);
        }
      }
    }
    amap.clear();
  }

  u.image
    ? u.templateButtons
      ? (obj = {
          caption: code.trim().split("\\n").join("\n"),
          footer: u.footer ? u.footer : "",
          templateButtons: u.templateButtons,
          image: { url: u.image },
          mentions: mentions || "",
        })
      : (obj = {
          image: { url: u.image },
          caption: code.trim().split("\\n").join("\n"),
          footer: u.footer ? u.footer : "",
          buttons: u.buttons ? u.buttons : "",
          mentions: mentions || "",
          headerType: 4,
        })
    : u.video
    ? u.templateButtons
      ? (obj = {
          caption: code.trim().split("\\n").join("\n"),
          footer: u.footer ? u.footer : "",
          templateButtons: u.templateButtons,
          video: { url: u.video.url },
          gifPlayback: u.video.playback,
          mentions: mentions || "",
        })
      : (obj = {
          caption: code.trim().split("\\n").join("\n"),
          footer: u.footer ? u.footer : "",
          buttons: u.buttons ? u.buttons : "",
          video: { url: u.video.url },
          gifPlayback: u.video.playback,
          mentions: mentions || "",
        })
    : sections.length !== 0
    ? (obj = {
        text: code.trim().split("\\n").join("\n"),
        buttons: u.buttons ? u.buttons : "",
        footer: u.footer ? u.footer : "",
        mentions: mentions || "",
        buttonText: u.sectionsDisplayText ? u.sectionsDisplayText : "",
        sections: sections ? sections : "",
        headerType: 1,
      })
    : u.audio? u.templateButtons
    ? (obj = {
        audio: { url: u.audio.url },
        mimetype: u.audio.mimetype,
        ptt: u.audio.ptt
      })
    : (obj = {
        audio: { url: u.audio.url },
        mimetype: u.audio.mimetype,
        ptt: u.audio.ptt
      }) : u.document? u.templateButtons
      ? (obj = {
          document: { url: u.document.url },
          mimetype: u.document.mimetype,
          fileName: u.document.filename
        })
      : (obj = {
        document: { url: u.document.url },
        mimetype: u.document.mimetype,
        fileName: u.document.filename
        }) : u.templateButtons
      ? (obj = {
          text: code.trim().split("\\n").join("\n"),
          footer: u.footer ? u.footer : "",
          templateButtons: u.templateButtons,
          mentions: mentions || "",
        })
      : (obj = {
          text: code.trim().split("\\n").join("\n"),
          buttons: u.buttons ? u.buttons : "",
          footer: u.footer ? u.footer : "",
          mentions: mentions || "",
          headerType: 1,
        });

  if (r) {
    return code;
  } else if(returnObject) {
    return obj;
  } else {
    if (check("$sendButton", theFuncs)) {
      const a = JSON.parse(code);
      await client.sendMessage(msg.key.remoteJid, a);
    } else {
      if (typeof theJid === "array" || typeof theJid === "object") {
        for (var i = 0; i < theJid.length; i++) {
          code.trim() === ""
            ? undefined
            : await client.sendMessage(
                theJid[i],
                obj,
                check("$reply", theFuncs)
                  ? { quoted: msg }
                  : undefined
              );
        }
      } else {
        try {
          code.trim() === ""
            ? undefined
            : await client.sendMessage(
                theJid,
                obj,
                check("$reply", theFuncs)
                  ? { quoted: msg }
                  : undefined
              );
        } catch(e) {
          await client.sendMessage(
            theJid,
            { text: `\`\`\`❌ WhatscodeError: Something error in send the result: ${e}\`\`\`` },
            check("$reply", theFuncs)
              ? { quoted: msg }
              : undefined
          )
        }
      }
    }
  }

  if(check("$receivedImage", theFuncs)) {
    if(u.image) {
      if(fs.existsSync("./tmp/receivedImage.png")) {
        fs.unlinkSync("./tmp/receivedImage.png")
      }
    }
  }
};
