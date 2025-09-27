import 'dotenv/config';
const url = `https://discord.com/api/v10/applications/${process.env.APP_ID}/commands`;
(async ()=>{
  try {
    const res = await fetch(url, { headers: { Authorization: `Bot ${process.env.DISCORD_TOKEN}`, 'Content-Type': 'application/json' } });
    console.log('status', res.status);
    const data = await res.json();
    console.log('commandsCount', Array.isArray(data) ? data.length : JSON.stringify(data));
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('error', err);
  }
})();
