import 'dotenv/config';

export async function DiscordRequest(endpoint, options = {}) {
  const url = 'https://discord.com/api/v10/' + endpoint;

  const maxRetries = 5;
  const baseDelay = 1000; // ms

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  if (options.body) options.body = JSON.stringify(options.body);

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'User-Agent': 'DiscordBot (https://github.com/discord/discord-example-app, 1.0.0)',
      },
      ...options,
    });

    if (res.ok) return res;

    let data = null;
    try {
      data = await res.json();
    } catch (e) {
      // ignore
    }

    if (res.status === 429) {
      const retryAfter = (data && data.retry_after) ? data.retry_after * 1000 : null;
      const headerRetry = res.headers && res.headers.get ? res.headers.get('retry-after') : null;
      const headerRetryMs = headerRetry ? parseFloat(headerRetry) * 1000 : null;
      const waitMs = retryAfter || headerRetryMs || (baseDelay * Math.pow(2, attempt));
      const jitter = Math.floor(Math.random() * 1000);
      const totalWait = Math.ceil(waitMs + jitter);
      console.warn(`Discord 429 on ${endpoint}, retrying after ${totalWait}ms (attempt ${attempt + 1})`);
      await sleep(totalWait);
      continue;
    }

    if (res.status >= 500 && res.status < 600) {
      const waitMs = baseDelay * Math.pow(2, attempt);
      const jitter = Math.floor(Math.random() * 1000);
      const totalWait = Math.ceil(waitMs + jitter);
      console.warn(`Discord ${res.status} on ${endpoint}, retrying after ${totalWait}ms (attempt ${attempt + 1})`);
      await sleep(totalWait);
      continue;
    }

    if (data) {
      console.error(`Discord API error (${res.status}) on ${endpoint}:`, data);
      throw new Error(JSON.stringify(data));
    }
    throw new Error(`Discord API error: ${res.status}`);
  }

  throw new Error(`Failed to ${options && options.method ? options.method : 'request'} ${endpoint} after ${maxRetries} retries`);
}

export async function InstallGlobalCommands(appId, commands) {
  const endpoint = `applications/${appId}/commands`;
  try {
    await DiscordRequest(endpoint, { method: 'PUT', body: commands });
  } catch (err) {
    console.error(err);
    throw err;
  }
}

// Install commands either globally or to a specific guild when GUILD_ID is set
export async function InstallCommands(appId, commands) {
  const guildId = process.env.GUILD_ID;
  if (guildId) {
    const endpoint = `applications/${appId}/guilds/${guildId}/commands`;
    try {
      await DiscordRequest(endpoint, { method: 'PUT', body: commands });
      console.log(`Installed ${commands.length} commands to guild ${guildId}`);
    } catch (err) {
      console.error(err);
      throw err;
    }
  } else {
    // fallback to global
    return InstallGlobalCommands(appId, commands);
  }
}

export function getRandomEmoji() {
  const emojiList = ['','','','','','','','','','','','','',''];
  return emojiList[Math.floor(Math.random() * emojiList.length)];
}

export function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
