module.exports = async (d) => {
  const split = d.code.split("$inviteCode").length - 1;
  const after = d.code.split("$inviteCode")[split];

  if (after.startsWith("[")) {
    const inside = after.split("[")[1].split("]")[0];

    const r = await d.client.groupInviteCode(inside);
    if (!r) {
      d.isError = true;
      return d.client.sendMessage(
        d.msg.key.remoteJid,
        { text: `\`\`\`❌ [whatscode.js] | invalid groups jid!\`\`\`` },
        { quoted: d.msg }
      );
    }

    return r;
  } else {
    if (d.msg.key.remoteJid.endsWith("@g.us")) {
      const code = await d.client.groupInviteCode(d.msg.key.remoteJid);
      return code;
    } else {
      d.isError = true;
      return d.client.sendMessage(
        d.msg.key.remoteJid,
        {
          text: `\`\`\`❌ [whatscode.js] | The $inviteCode functions only can be used in groups!\`\`\``,
        },
        { quoted: d.msg }
      );
    }
  }
};
