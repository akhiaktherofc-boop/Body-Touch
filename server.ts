import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";

dotenv.config();

function getSmtpConfig() {
  let host = process.env.SMTP_HOST || "smtp.gmail.com";
  let port = parseInt(process.env.SMTP_PORT || "587");
  let secure = process.env.SMTP_SECURE === "true"; 
  let user = process.env.SMTP_USER || "sakilroky@gmail.com";
  let pass = process.env.SMTP_PASS || "ctpgmlskuevxjnld";
  let fromEmail = process.env.SMTP_FROM_EMAIL || "sakilroky@gmail.com";

  try {
    const configPath = path.join(process.cwd(), "smtp-config.json");
    if (fs.existsSync(configPath)) {
      const fileData = JSON.parse(fs.readFileSync(configPath, "utf8"));
      if (fileData.host) host = fileData.host;
      if (fileData.port) port = parseInt(fileData.port);
      if (fileData.secure !== undefined) secure = fileData.secure === true || fileData.secure === "true";
      if (fileData.user) user = fileData.user;
      if (fileData.pass) pass = fileData.pass;
      if (fileData.fromEmail) fromEmail = fileData.fromEmail;
    }
  } catch (err) {
    console.error("Failed to read local smtp-config.json file:", err);
  }

  // Robust validation & sanitization
  if (user) {
    user = user.trim();
  }
  if (!user || !user.includes("@")) {
    console.warn(`[SMTP Warning] Invalid SMTP user "${user}" (no @ found). Falling back to sakilroky@gmail.com.`);
    user = "sakilroky@gmail.com";
  }

  if (pass) {
    pass = pass.replace(/\s+/g, ""); // Strip any spacing if typed with spaces
  } else {
    pass = "ctpgmlskuevxjnld";
  }

  if (fromEmail) {
    fromEmail = fromEmail.trim();
  }
  if (!fromEmail || !fromEmail.includes("@")) {
    fromEmail = user;
  }

  return { host, port, secure, user, pass, fromEmail };
}

async function sendMailWithRetries(transporterConfig: any, mailOptions: any) {
  console.log(`[SMTP Debug] Attempting send to ${mailOptions.to} using host=${transporterConfig.host}, port=${transporterConfig.port}, user=${transporterConfig.auth.user}`);
  
  // Try 1: As-is
  try {
    const transporter = nodemailer.createTransport(transporterConfig);
    const info = await transporter.sendMail(mailOptions);
    console.log(`[SMTP Debug] Try 1 Succeeded! Message ID: ${info.messageId}`);
    return { success: true, info };
  } catch (error: any) {
    console.warn(`[SMTP Debug] Try 1 Failed with error: ${error.message || error}`);
    
    // Try 2: Strip all spaces from the password (just in case they copied Google's spaced view, e.g. "ctpg mlsk uevx jnld" -> "ctpgmlskuevxjnld")
    const cleanedPass = transporterConfig.auth.pass.replace(/\s+/g, "");
    if (cleanedPass !== transporterConfig.auth.pass) {
      try {
        console.log(`[SMTP Debug] Retrying with spaces stripped from Gmail App Password...`);
        const newConfig = {
          ...transporterConfig,
          auth: {
            ...transporterConfig.auth,
            pass: cleanedPass
          }
        };
        const transporter = nodemailer.createTransport(newConfig);
        const info = await transporter.sendMail(mailOptions);
        console.log(`[SMTP Debug] Try 2 (spaces stripped) Succeeded! Message ID: ${info.messageId}`);
        return { success: true, info };
      } catch (err2: any) {
        console.warn(`[SMTP Debug] Try 2 Failed: ${err2.message || err2}`);
      }
    }

    // Try 3: Add spaces back if the password was entered without spaces (e.g. "ctpgmlskuevxjnld" -> "ctpg mlsk uevx jnld")
    const rawPass = transporterConfig.auth.pass;
    if (rawPass.length === 16 && !rawPass.includes(" ")) {
      const spacedPass = rawPass.replace(/(.{4})/g, '$1 ').trim();
      try {
        console.log(`[SMTP Debug] Retrying with spaces added back to Gmail App Password...`);
        const newConfig = {
          ...transporterConfig,
          auth: {
            ...transporterConfig.auth,
            pass: spacedPass
          }
        };
        const transporter = nodemailer.createTransport(newConfig);
        const info = await transporter.sendMail(mailOptions);
        console.log(`[SMTP Debug] Try 3 (spaces added) Succeeded! Message ID: ${info.messageId}`);
        return { success: true, info };
      } catch (err3: any) {
        console.warn(`[SMTP Debug] Try 3 Failed: ${err3.message || err3}`);
      }
    }

    // Try 4: Try with secure: false and rejectUnauthorized: false (sometimes TLS connection cert fails on container environments)
    try {
      console.log(`[SMTP Debug] Retrying with rejectUnauthorized: false and secure: false fallback...`);
      const newConfig = {
        ...transporterConfig,
        secure: false, // Force upgrade TLS start
        tls: {
          rejectUnauthorized: false
        }
      };
      const transporter = nodemailer.createTransport(newConfig);
      const info = await transporter.sendMail(mailOptions);
      console.log(`[SMTP Debug] Try 4 (rejectUnauthorized false, secure false) Succeeded! Message ID: ${info.messageId}`);
      return { success: true, info };
    } catch (err4: any) {
      console.warn(`[SMTP Debug] Try 4 Failed: ${err4.message || err4}`);
    }

    throw error;
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Keep track of active chats and chat histories in memory
  const activeChats: Record<string, {
    username: string;
    fullName: string;
    userLevel: string;
    avatarUrl: string;
    lastMessageTime: number;
    unreadCount: number;
    phone?: string;
  }> = {};

  const chatHistories: Record<string, Array<{
    id: string;
    sender: 'user' | 'admin';
    text: string;
    timestamp: number;
  }>> = {};

  io.on("connection", (socket) => {
    console.log(`[Socket.io Debug] Client connected: ${socket.id}`);

    socket.on("join_room", (data: { username: string; role: 'user' | 'admin'; fullName?: string; userLevel?: string; avatarUrl?: string; phone?: string }) => {
      const { username, role, fullName, userLevel, avatarUrl, phone } = data;
      if (!username) return;

      console.log(`[Socket.io Debug] Socket ${socket.id} joining as ${role} for user: ${username}`);

      if (role === "admin") {
        socket.join("admin_room");
        socket.emit("active_chats_list", Object.values(activeChats));
      } else {
        socket.join(`room_${username}`);
        if (!activeChats[username]) {
          activeChats[username] = {
            username,
            fullName: fullName || username,
            userLevel: userLevel || "FREE",
            avatarUrl: avatarUrl || "",
            lastMessageTime: Date.now(),
            unreadCount: 0,
            phone: phone || ""
          };
        } else {
          activeChats[username].fullName = fullName || activeChats[username].fullName;
          activeChats[username].userLevel = userLevel || activeChats[username].userLevel;
          activeChats[username].avatarUrl = avatarUrl || activeChats[username].avatarUrl;
          if (phone) activeChats[username].phone = phone;
        }
        io.to("admin_room").emit("active_chats_list", Object.values(activeChats));
      }
    });

    socket.on("send_message", (data: { username: string; sender: 'user' | 'admin'; text: string }) => {
      const { username, sender, text } = data;
      if (!username || !text) return;

      console.log(`[Socket.io Debug] Message from ${sender} in chat ${username}: ${text}`);

      const message = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        sender,
        text,
        timestamp: Date.now()
      };

      if (!chatHistories[username]) {
        chatHistories[username] = [];
      }
      chatHistories[username].push(message);

      if (activeChats[username]) {
        activeChats[username].lastMessageTime = Date.now();
        if (sender === "user") {
          activeChats[username].unreadCount += 1;
        }
      }

      io.to(`room_${username}`).emit("receive_message", message);
      io.to("admin_room").emit("receive_message_admin", { username, message });
      io.to("admin_room").emit("active_chats_list", Object.values(activeChats));
    });

    socket.on("get_chat_history", (data: { username: string }) => {
      const { username } = data;
      if (!username) return;
      socket.emit("chat_history", {
        username,
        history: chatHistories[username] || []
      });
    });

    socket.on("mark_as_read", (data: { username: string }) => {
      const { username } = data;
      if (!username) return;
      if (activeChats[username]) {
        activeChats[username].unreadCount = 0;
        io.to("admin_room").emit("active_chats_list", Object.values(activeChats));
      }
    });

    socket.on("disconnect", () => {
      console.log(`[Socket.io Debug] Client disconnected: ${socket.id}`);
    });
  });

  app.use(express.json());

  // API Route to save SMTP settings locally on server
  app.post("/api/save-smtp-settings", (req, res) => {
    try {
      const { host, port, user, pass, secure, fromEmail } = req.body;
      const configPath = path.join(process.cwd(), "smtp-config.json");
      const configData = {
        host: host || "smtp.gmail.com",
        port: port || "587",
        user: user || "",
        pass: pass || "",
        secure: secure === true || secure === "true",
        fromEmail: fromEmail || user || ""
      };
      fs.writeFileSync(configPath, JSON.stringify(configData, null, 2), "utf8");
      console.log("SMTP Configuration saved successfully to local file.");
      return res.status(200).json({ success: true, message: "SMTP configuration saved locally." });
    } catch (err: any) {
      console.error("Failed to save SMTP configuration locally:", err);
      return res.status(500).json({ error: err.message || "Failed to save configuration." });
    }
  });

  // API Route to get SMTP settings from server
  app.get("/api/get-smtp-settings", (req, res) => {
    try {
      const config = getSmtpConfig();
      return res.status(200).json(config);
    } catch (err: any) {
      console.error("Failed to get SMTP configuration:", err);
      return res.status(500).json({ error: err.message || "Failed to get configuration." });
    }
  });

  // API Route to send verification email (OTP) via Nodemailer
  app.post("/api/send-otp-email", async (req, res) => {
    const { email, username, code } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }

    const emailBody = `Hello ${username || 'User'},\n\nYour security OTP verification code is: ${code}\n\nThis code is valid for 15 minutes. Please do not share it with anyone.`;
    
    try {
      const { host, port, secure, user, pass, fromEmail } = getSmtpConfig();

      if (!user || !pass) {
        return res.status(400).json({ 
          error: "SMTP is not configured. Please supply SMTP_USER and SMTP_PASS." 
        });
      }

      const transporterConfig = {
        host,
        port,
        secure,
        auth: {
          user,
          pass,
        },
      };

      const mailOptions = {
        from: `"BODY TOUCH Security" <${fromEmail}>`,
        to: email,
        subject: "🔐 [BODY TOUCH] Security Verification Code (ভেরিফিকেশন কোড)",
        text: emailBody,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #1e293b; border-radius: 16px; background-color: #020716; color: #ffffff;">
            <div style="text-align: center; border-bottom: 1px solid #1e293b; padding-bottom: 20px; margin-bottom: 25px;">
              <h2 style="color: #06b6d4; margin: 0; font-size: 24px; letter-spacing: 1px;">BODY TOUCH</h2>
              <span style="font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #64748b; font-weight: bold;">Security Portal</span>
            </div>
            <div style="padding: 10px 0;">
              <p style="font-size: 15px; color: #cbd5e1; margin-bottom: 15px;">Hello <strong style="color: #06b6d4;">${username}</strong>,</p>
              <p style="font-size: 14px; color: #cbd5e1; line-height: 1.6; margin-bottom: 25px;">
                Please use the secure verification code below to authorize your login/registration:
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <span style="display: inline-block; font-family: 'Courier New', monospace; font-size: 32px; font-weight: bold; color: #10b981; letter-spacing: 5px; background-color: #030d24; padding: 15px 35px; border-radius: 10px; border: 1px solid #10b981; box-shadow: 0 0 15px rgba(16, 185, 129, 0.1);">
                  ${code}
                </span>
              </div>
              
              <p style="font-size: 12px; color: #f43f5e; line-height: 1.6; margin-top: 25px;">
                <strong>সতর্কতা:</strong> এই ওটিপি কোডটি শুধুমাত্র ১৫ মিনিটের জন্য কার্যকর থাকবে। আপনার ওটিপি কোড বা পাসওয়ার্ড অন্য কারও সাথে শেয়ার করবেন না।
              </p>
            </div>
            <div style="text-align: center; border-top: 1px solid #1e293b; padding-top: 20px; margin-top: 25px; font-size: 11px; color: #64748b; line-height: 1.5;">
              <p>This is an automated security transmission. Please do not reply directly to this email.</p>
              <p style="margin-top: 5px;">&copy; 2026 BODY TOUCH Portal. All rights reserved.</p>
            </div>
          </div>
        `,
      };

      await sendMailWithRetries(transporterConfig, mailOptions);
      return res.status(200).json({ success: true, mocked: false });
    } catch (error: any) {
      console.error("Error sending email via Nodemailer:", error);
      return res.status(500).json({ error: error.message || "Failed to send email." });
    }
  });

  // API Route to send custom notifications via Nodemailer
  app.post("/api/send-custom-email", async (req, res) => {
    const { toEmail, subject, bodyText } = req.body;

    if (!toEmail) {
      return res.status(400).json({ error: "Destination email (toEmail) is required." });
    }

    try {
      const { host, port, secure, user, pass, fromEmail } = getSmtpConfig();

      if (!user || !pass) {
        return res.status(400).json({ 
          error: "SMTP is not configured. Please supply SMTP_USER and SMTP_PASS." 
        });
      }

      const transporterConfig = {
        host,
        port,
        secure,
        auth: {
          user,
          pass,
        },
      };

      // Format plain text body into structured HTML line breaks
      const htmlBody = (bodyText || "")
        .replace(/\r\n/g, "<br>")
        .replace(/\n/g, "<br>")
        .replace(/--- SERVICE RECORD INQUIRY ---/gi, `<strong style="color: #06b6d4; display: block; border-bottom: 1px solid #1e293b; padding-bottom: 5px; margin-top: 20px; margin-bottom: 10px; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Service Record Inquiry</strong>`)
        .replace(/--- TRANSACTION LEDGER ---/gi, `<strong style="color: #06b6d4; display: block; border-bottom: 1px solid #1e293b; padding-bottom: 5px; margin-top: 20px; margin-bottom: 10px; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Transaction Ledger</strong>`)
        .replace(/--- WITHDRAWAL RECORD ---/gi, `<strong style="color: #06b6d4; display: block; border-bottom: 1px solid #1e293b; padding-bottom: 5px; margin-top: 20px; margin-bottom: 10px; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Withdrawal Record</strong>`);

      const mailOptions = {
        from: `"BODY TOUCH Concierge" <${fromEmail}>`,
        to: toEmail,
        subject: subject || "🔔 [BODY TOUCH] Notification Update",
        text: bodyText || "",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #1e293b; border-radius: 16px; background-color: #020716; color: #ffffff;">
            <div style="text-align: center; border-bottom: 1px solid #1e293b; padding-bottom: 20px; margin-bottom: 25px;">
              <h2 style="color: #06b6d4; margin: 0; font-size: 24px; letter-spacing: 1px;">BODY TOUCH</h2>
              <span style="font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #64748b; font-weight: bold;">Concierge Hub & Notifications</span>
            </div>
            <div style="padding: 10px 0;">
              <div style="font-size: 14px; color: #cbd5e1; line-height: 1.6; margin-bottom: 25px;">
                ${htmlBody}
              </div>
            </div>
            <div style="text-align: center; border-top: 1px solid #1e293b; padding-top: 20px; margin-top: 25px; font-size: 11px; color: #64748b; line-height: 1.5;">
              <p>This is a secure, automated notification dispatched on behalf of BODY TOUCH VIP service logistics.</p>
              <p style="margin-top: 5px;">&copy; 2026 BODY TOUCH Operations. All rights reserved.</p>
            </div>
          </div>
        `,
      };

      await sendMailWithRetries(transporterConfig, mailOptions);
      return res.status(200).json({ success: true, mocked: false });
    } catch (error: any) {
      console.error("Error sending custom email via Nodemailer:", error);
      return res.status(500).json({ error: error.message || "Failed to send email." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT} with Socket.io enabled`);
  });
}

startServer();
