import { Router, type IRouter } from "express";
import multer from "multer";
import { db, userTable } from "@workspace/db";
import { and, eq, inArray, ne } from "drizzle-orm";
import { auditEvent, requireAdmin } from "../lib/security";
import { inspectImage, type SupportedImageMime } from "../lib/image-validation";
import { isR2Configured, uploadImage } from "../services/cloudflare/r2-storage-admin";
import { sendAdminEmailBlast, verifyAdminEmailBlastUnsubscribeToken } from "../lib/email";

const router: IRouter = Router();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    cb(null, /^image\/(jpeg|png|webp|gif)$/.test(file.mimetype));
  },
});

function isEligibleEmail(email: string) {
  return emailPattern.test(email.trim());
}

type EmailBlastRecipient = {
  id: number;
  name: string;
  email: string;
  subscribed: boolean;
};

async function getRecipients(ids?: number[]): Promise<EmailBlastRecipient[]> {
  const users = await db
    .select({
      id: userTable.id,
      name: userTable.name,
      email: userTable.email,
      subscribed: userTable.emailMarketingEnabled,
    })
    .from(userTable)
    .where(ids?.length
      ? and(ne(userTable.role, "admin"), inArray(userTable.id, ids))
      : ne(userTable.role, "admin"));

  return users
    .map((user) => ({ ...user, email: user.email.trim().toLowerCase() }))
    .filter((user) => isEligibleEmail(user.email))
    .sort((a, b) => a.name.localeCompare(b.name) || a.email.localeCompare(b.email));
}

function validateImageUrl(value: unknown) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || value.length > 2_000) return "Image URL is invalid.";
  if (!value.startsWith("/") && !/^https?:\/\//i.test(value)) {
    return "Image URL must start with https:// or /.";
  }
  return null;
}

router.get("/admin/email-blast/recipients", requireAdmin, async (req, res) => {
  try {
    const recipients = await getRecipients();
    res.json({ recipients });
  } catch (error) {
    req.log.error({ err: error }, "Failed to count email blast recipients");
    res.status(500).json({ error: "Failed to count recipients." });
  }
});

router.post("/admin/email-blast/image", requireAdmin, (req, res) => {
  upload.single("file")(req, res, (error) => {
    if (error) {
      if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
        res.status(400).json({ error: "Image is too large. Maximum size is 5 MB." });
      } else {
        res.status(400).json({ error: error.message || "Image upload failed." });
      }
      return;
    }

    if (!isR2Configured()) {
      res.status(503).json({ error: "Image storage is not configured." });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: "Choose a valid JPG, PNG, WEBP, or GIF image." });
      return;
    }

    const mimeType = req.file.mimetype as SupportedImageMime;
    try {
      inspectImage(req.file.buffer, mimeType);
    } catch (imageError) {
      res.status(400).json({
        error: imageError instanceof Error ? imageError.message : "Invalid image.",
      });
      return;
    }

    const extension = mimeType === "image/jpeg" ? "jpg" : mimeType.replace("image/", "");
    const objectKey = `email-blast-${Date.now()}.${extension}`;
    uploadImage({
      fileName: req.file.originalname,
      fileBuffer: req.file.buffer,
      contentType: mimeType,
      folder: "wed_email_blast",
      objectKey,
      metadata: { uploadedAt: new Date().toISOString(), type: "email-blast" },
    })
      .then((key) => {
        auditEvent(req, "email_blast.image_upload", {});
        res.json({ key, url: `/api/r2?key=${encodeURIComponent(key)}` });
      })
      .catch((uploadError) => {
        req.log.error({ err: uploadError }, "Failed to upload email blast image");
        res.status(500).json({ error: "Failed to upload image." });
      });
  });
});

router.get("/email-blast/unsubscribe", async (req, res) => {
  const token = typeof req.query.token === "string" ? req.query.token : "";
  const payload = token ? verifyAdminEmailBlastUnsubscribeToken(token) : null;
  if (!payload) {
    res.redirect(303, "/unsubscribe?status=invalid");
    return;
  }

  try {
    const [user] = await db
      .select({ id: userTable.id, role: userTable.role })
      .from(userTable)
      .where(eq(userTable.id, payload.userId))
      .limit(1);
    if (!user || user.role === "admin") {
      res.redirect(303, "/unsubscribe?status=invalid");
      return;
    }

    await db
      .update(userTable)
      .set({ emailMarketingEnabled: false })
      .where(eq(userTable.id, user.id));
    res.redirect(303, "/unsubscribe?status=success");
  } catch (error) {
    req.log.error({ err: error }, "Failed to unsubscribe email recipient");
    res.redirect(303, "/unsubscribe?status=error");
  }
});

router.post("/admin/email-blast/send", requireAdmin, async (req, res) => {
  const subject = typeof req.body?.subject === "string" ? req.body.subject.trim() : "";
  const content = typeof req.body?.content === "string" ? req.body.content.trim() : "";
  const imageUrl = typeof req.body?.imageUrl === "string" ? req.body.imageUrl.trim() : "";
  const rawRecipientIds = Array.isArray(req.body?.recipientIds) ? req.body.recipientIds : [];
  const recipientIds = [...new Set(rawRecipientIds)]
    .filter((id): id is number => typeof id === "number" && Number.isInteger(id) && id > 0);

  if (!subject || subject.length > 200) {
    res.status(400).json({ error: "Subject is required and must be 200 characters or fewer." });
    return;
  }
  if (!content || content.length > 10_000) {
    res.status(400).json({ error: "Content is required and must be 10,000 characters or fewer." });
    return;
  }
  const imageError = validateImageUrl(imageUrl);
  if (imageError) {
    res.status(400).json({ error: imageError });
    return;
  }
  if (!recipientIds.length || recipientIds.length > 10_000) {
    res.status(400).json({ error: "Select at least one valid recipient." });
    return;
  }

  try {
    const recipients = await getRecipients(recipientIds);
    const eligibleRecipients = recipients.filter((recipient) => recipient.subscribed);
    if (eligibleRecipients.length !== recipientIds.length) {
      res.status(400).json({ error: "One or more selected recipients are no longer eligible for announcement emails." });
      return;
    }

    let sent = 0;
    let failed = 0;
    for (let index = 0; index < eligibleRecipients.length; index += 5) {
      const batch = eligibleRecipients.slice(index, index + 5);
      const results = await Promise.allSettled(
        batch.map((recipient) => sendAdminEmailBlast({
          userId: recipient.id,
          to: recipient.email,
          subject,
          content,
          imageUrl: imageUrl || null,
        })),
      );
      for (const result of results) {
        if (result.status === "fulfilled") sent += 1;
        else failed += 1;
      }
    }

    auditEvent(req, "email_blast.sent", {
      attempted: eligibleRecipients.length,
      sent,
      failed,
    });
    res.json({ attempted: eligibleRecipients.length, sent, failed });
  } catch (error) {
    req.log.error({ err: error }, "Failed to send email blast");
    res.status(500).json({ error: "Email blast could not be completed." });
  }
});

export default router;