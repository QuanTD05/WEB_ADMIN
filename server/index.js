const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const PushNotifications = require('@pusher/push-notifications-server');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// TODO: Điền Beams instance + secret
const beamsClient = new PushNotifications({
  instanceId: process.env.BEAMS_INSTANCE_ID || 'c8828f59-ad54-4d42-8f0a-5e46a2b7ed7b',
  secretKey: process.env.BEAMS_SECRET_KEY || '92A3090EA8ECE0E0857C95BDABD705E59F0F2FDA2A98570424000255D10DC2C7',
});

/**
 * POST /publish
 * body: { toUserId, fromUserId, fromName, message, chatId }
 *  - toUserId/fromUserId là email đã sanitize (không còn . # $ [ ])
 */
app.post('/publish', async (req, res) => {
  try {
    const { toUserId, fromUserId, fromName, message, chatId } = req.body;
    if (!toUserId || !fromUserId || !fromName || !message || !chatId) {
      return res.status(400).json({ error: 'Thiếu tham số' });
    }

    const toInterest = `user-${toUserId}`;
    const deepLink = `myapp://chat?chatId=${encodeURIComponent(chatId)}&peerId=${encodeURIComponent(fromUserId)}&peerName=${encodeURIComponent(fromName)}`;

    const result = await beamsClient.publishToInterests([toInterest], {
      android: {
        notification: {
          title: fromName,
          body: message,
          deep_link: deepLink,
          // channel_id: "chat_messages", // nếu bạn đã tạo channel
        },
        data: { chatId, fromUserId, fromName, message }
      },
      web: {
        notification: { title: fromName, body: message, deep_link: deepLink }
      }
    });

    res.json({ ok: true, result });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Publish failed', detail: String(e) });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log('Beams publish server listening on ' + PORT));
