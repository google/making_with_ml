# Building an AI-Powered Discord Moderator Bot with the Perspective API
Want a deep dive on this project? Read the [blog](https://daleonai.com/build-your-own-ai-moderator-bot-for-discord-with-the-perspective-api).

This code in this repo lets you build your own moderator bot for 
[Discord](discordapp.com). Using the [Perspective API](perspectiveapi.com),
it analyzes messages sent by users in a Discord channel and checks for
insults, toxicity, spam, incoherence, and fliration. The bot assigns users
emoji flags when they send messages that fall into these different categories:

![](https://storage.googleapis.com/blogstuff/discord_emojis.png-04-13-2020_1)

When a user sends too many toxic messages, the bot kicks them from the Discord channel.

![](https://storage.googleapis.com/blogstuff/discord_ban.png-04-13-2020_0)

To run this bot yourself, you'll need a [Google Cloud account](https://cloud.google.com/) and a Discord developer account (both are free).

Let's get started.

1. Download the [Making with ML repo](https://github.com/dalequark/making_with_ml):

`git clone git@github.com:dalequark/making_with_ml.git`

then:

`cd discord_moderator`

2. Create a (Google Cloud account)(https://cloud.google.com) if you don't already have one. Create
a new GCP project.

2. In your new project, enable the [Perspective Comment Analyzer API](https://console.cloud.google.com/apis/api/commentanalyzer.googleapis.com/overview).

3. Next, in the Google Cloud console left hand menu, click API & Services -> Credentials. On that screen, click "+ Create Credentials" -> "API key". Copy that service account key.

![](https://storage.googleapis.com/blogstuff/api_credentials.png-04-13-2020_1)
![](gs://blogstuff/generate_api_key.png-04-13-2020_0)

4. On your computer, in the folder `discord_moderator`, you should see a `.env_template` file. 
Make a copy of thtat file:

`cp .env_template .env`

5. In the new `.env` file, fill in the `PERSPECTIVE_API_KEY` field with the API key you copied above.

6. Now you should be able to use the Perspective API to analyze traits like toxicity, spam,
incoherence, and more. To understand how tot use that API, take a look at 
`making_with_ml/discord_moderator/perspective.js`. In that file, you'll see all of the
attributes the API supports:

```// Some supported attributes
// attributes = ["TOXICITY", "SEVERE_TOXICITY", "IDENTITY_ATTACK", "INSULT",
// "PROFANITY", "THREAT", "SEXUALLY_EXPLICIT", "FLIRTATION", "SPAM",
// "ATTACK_ON_AUTHOR", "ATTACK_ON_COMMENTER", "INCOHERENT",
// "INFLAMMATORY", "OBSCENE", "SPAM", "UNSUBSTANTIAL"];
```

You can configure which attributes the API calls for and adjust their thresholds
(how "confident" the model must be in an attribute in order to report it) in the
`attributeThrehsolds` object:

```
// Set your own thresholds for when to trigger a response
const attributeThresholds = {
  'INSULT': 0.75,
  'TOXICITY': 0.75,
  'SPAM': 0.75,
  'INCOHERENT': 0.75,
  'FLIRTATION': 0.75,
};
```

7. Now let's set up our Discord bot. First, create [Discord Developer account](https://discordapp.com/developers) and log in to the Developer Portal. On the top right hand corner of the screen, click "New Application." Give your app a name and description.

![](https://storage.googleapis.com/blogstuff/discord_new_app.png-04-13-2020_0)

8. Click in to your new Discord app and select "Bot" from the left hand menu. Select "Add Bot." Give your new Bot a username and upload a cute or intimidating user icon. On the Bot page, under `Token`, click "Copy" to copy your developer token to your clipboard.

9. Paste the Bot developer token you copied in the last step into your `.env` file:

`DISCORD_TOKEN="YOUR TOKEN HERE"`

10. Now you should be able to run your Discord bot from the command line. In the folder, `makcing_with_ml/discord_moderator`, run:

`node discord.js`

It should print `I am ready!` to your terminal.

11. Now, open the Discord App and create a new Server which you'll use just for Bot development. To add your Bot to the server, go to the Discord Developer Portal and select `OAuth` from the left side bar:

![](https://storage.googleapis.com/blogstuff/oauth.png-04-13-2020_0)

On the OAuth page, under "Scopes," check the box next to "Bot." Then scroll down and select the permissions "Kick Members," "Send TTS Messages," and "Add Reactions."

![](https://storage.googleapis.com/blogstuff/oauth_discord_checklist.png-04-13-2020_1)

This should generate a https link in the "Scopes" section that you can copy and open in your browser. It should look something like:

`https://discordapp.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=4164&scope=bot`

Opening this link in your browser will give you the ability to add your new bot to your test server, which you should do now.

12. Voila! Your moderator bot is running. In the Discord server where you added your bot, try typing
phrases that will be recognized as toxic (i.e. "You stink"). The Bot should react with a 🧨 emoji 
for toxic phrases and a 👊 emoji for insults. You can configure these reactions in the `discord.js` file:

```
// Set your emoji "awards" here
const emojiMap = {
  'FLIRTATION': '💋',
  'TOXICITY': '🧨',
  'INSULT': '👊',
  'INCOHERENT': '🤪',
  'SPAM': '🐟',
};
```

If you write more than 4 toxic messages, you'll automatically get kicked from the Discord channel.
To modify this threshold, modify `KICK_THRESHOLD` in your `.env` file.

13. Your Discord Bot should run successfully on your local computer now. As a next step, try hosting it with a Cloud service, like [App Engine](https://cloud.google.com/appengine).


