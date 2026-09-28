const PDFDocument = require("pdfkit");

// ---------- Layout constants ----------
const COLORS = {
  primary: "#1e3a5f",
  accent: "#2f6fab",
  text: "#222222",
  muted: "#666666",
  border: "#c8d0da",
  light: "#f2f5f9",
};
const MARGIN = 50;
const FETCH_TIMEOUT_MS = 8000;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB safety cap

// ---------- Small helpers ----------
const shortId = (complaint) =>
  `UCMS-${String(complaint._id).slice(-6).toUpperCase()}`;

const fmtDate = (d) => {
  if (!d) return "N/A";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "N/A";
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const fmtPercent = (v) =>
  typeof v === "number" ? `${Math.round(v * 100)}%` : "N/A";

const routingLabel = (src) =>
  ({
    ai: "Automatically routed by AI",
    "ai-low-confidence": "Routed by AI (low confidence, flagged for review)",
    manual: "Manually reassigned by staff",
  }[src] || "N/A");

/**
 * Downloads a Cloudinary image and returns a Buffer PDFKit can embed
 * (PDFKit only supports JPEG and PNG). Returns null on ANY failure so
 * the PDF is still generated without the image.
 */
const fetchImageBuffer = async (url) => {
  if (!url || typeof url !== "string" || !/^https?:\/\//i.test(url)) {
    return null; // old local "/uploads/..." paths are skipped safely
  }
  try {
    // Ask Cloudinary to deliver a JPEG, max 1200px wide (works for webp/png/etc.)
    const finalUrl = url.includes("/upload/")
      ? url.replace("/upload/", "/upload/f_jpg,w_1200/")
      : url;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(finalUrl, { signal: controller.signal });
    clearTimeout(timer);

    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length === 0 || buf.length > MAX_IMAGE_BYTES) return null;
    return buf;
  } catch (err) {
    return null;
  }
};

// ---------- Drawing helpers ----------
const contentWidth = (doc) => doc.page.width - MARGIN * 2;

const ensureSpace = (doc, needed) => {
  if (doc.y + needed > doc.page.height - MARGIN - 30) doc.addPage();
};

const drawHeader = (doc, subtitle) => {
  const w = doc.page.width;
  doc.rect(0, 0, w, 90).fill(COLORS.primary);
  doc
    .fillColor("#ffffff")
    .font("Helvetica-Bold")
    .fontSize(17)
    .text("UNIVERSITY COMPLAINT MANAGEMENT SYSTEM", MARGIN, 26, {
      width: w - MARGIN * 2,
      align: "center",
    });
  doc
    .font("Helvetica")
    .fontSize(11)
    .text(subtitle, MARGIN, 52, { width: w - MARGIN * 2, align: "center" });
  doc.fillColor(COLORS.text);
  doc.y = 110;
  doc.x = MARGIN;
};

const sectionHeading = (doc, title) => {
  ensureSpace(doc, 50);
  doc.moveDown(0.6);
  const y = doc.y;
  doc.rect(MARGIN, y, contentWidth(doc), 20).fill(COLORS.light);
  doc
    .fillColor(COLORS.primary)
    .font("Helvetica-Bold")
    .fontSize(11)
    .text(title.toUpperCase(), MARGIN + 8, y + 5, { lineBreak: false });
  doc.fillColor(COLORS.text).font("Helvetica").fontSize(10);
  doc.x = MARGIN;
  doc.y = y + 28;
};

/** Two-column "Label: value" rows drawn inside a bordered table. */
const keyValueTable = (doc, rows) => {
  const labelW = 150;
  const valueW = contentWidth(doc) - labelW;
  rows.forEach(([label, value]) => {
    const text = value === undefined || value === null || value === "" ? "N/A" : String(value);
    doc.font("Helvetica").fontSize(10);
    const h = Math.max(
      doc.heightOfString(text, { width: valueW - 12 }),
      doc.heightOfString(label, { width: labelW - 12 })
    ) + 10;
    ensureSpace(doc, h);
    const y = doc.y;
    doc.rect(MARGIN, y, labelW, h).fillAndStroke(COLORS.light, COLORS.border);
    doc.rect(MARGIN + labelW, y, valueW, h).stroke(COLORS.border);
    doc
      .fillColor(COLORS.primary)
      .font("Helvetica-Bold")
      .text(label, MARGIN + 6, y + 5, { width: labelW - 12 });
    doc
      .fillColor(COLORS.text)
      .font("Helvetica")
      .text(text, MARGIN + labelW + 6, y + 5, { width: valueW - 12 });
    doc.x = MARGIN;
    doc.y = y + h;
  });
  doc.moveDown(0.3);
};

const paragraphBlock = (doc, label, text) => {
  ensureSpace(doc, 40);
  doc.fillColor(COLORS.primary).font("Helvetica-Bold").fontSize(10).text(label, MARGIN, doc.y);
  doc.moveDown(0.2);
  doc
    .fillColor(COLORS.text)
    .font("Helvetica")
    .fontSize(10)
    .text(text && text.trim() ? text : "N/A", MARGIN, doc.y, {
      width: contentWidth(doc),
      align: "left",
    });
  doc.moveDown(0.6);
};

const addFootersAndPageNumbers = (doc, footerText) => {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    const y = doc.page.height - 40;
    doc
      .moveTo(MARGIN, y - 6)
      .lineTo(doc.page.width - MARGIN, y - 6)
      .strokeColor(COLORS.border)
      .stroke();
    // Zero the bottom margin so writing in the footer zone never
    // triggers an automatic extra page.
    const oldBottom = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(COLORS.muted)
      .text(footerText, MARGIN, y, {
        width: contentWidth(doc) / 1.5,
        align: "left",
        lineBreak: false,
      })
      .text(`Page ${i - range.start + 1} of ${range.count}`, MARGIN, y, {
        width: contentWidth(doc),
        align: "right",
        lineBreak: false,
      });
    doc.page.margins.bottom = oldBottom;
  }
};

/** Runs the drawing callback and resolves with the finished PDF Buffer. */
const buildPdf = (draw, info) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: MARGIN,
      bufferPages: true,
      info,
    });
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    Promise.resolve(draw(doc))
      .then(() => doc.end())
      .catch(reject);
  });

// ---------- Public: single complaint PDF ----------
/**
 * @param complaint  Mongoose doc (or lean object) with submittedBy,
 *                   assignedTo and history.changedBy already populated.
 * @param viewerRole "student" | "faculty" | "hod" | "admin_office" | "provost" | "vc"
 * @returns Promise<Buffer>
 */
const generateComplaintPdf = async (complaint, viewerRole) => {
  const isSubmitterView = viewerRole === "student" || viewerRole === "faculty";
  const imageBuffer = await fetchImageBuffer(complaint.image);
  const id = shortId(complaint);

  return buildPdf(
    (doc) => {
      drawHeader(doc, "COMPLAINT REPORT");

      // Summary
      sectionHeading(doc, "Complaint Summary");
      keyValueTable(doc, [
        ["Complaint ID", id],
        ["Date Submitted", fmtDate(complaint.createdAt)],
        ["Current Status", complaint.status],
        ["Department", complaint.department],
        ["Priority", complaint.priority],
      ]);

      // Complainant
      const u = complaint.submittedBy;
      if (u && typeof u === "object") {
        sectionHeading(doc, "Complainant Information");
        const rows = [
          ["Name", u.name],
          ["Role", u.role],
        ];
        if (!isSubmitterView) {
          rows.push(["Email", u.email]);
          if (u.rollNumber) rows.push(["Roll Number", u.rollNumber]);
        } else if (u.rollNumber) {
          rows.push(["Roll Number", u.rollNumber]);
        }
        keyValueTable(doc, rows);
      }

      // Details
      sectionHeading(doc, "Complaint Details");
      paragraphBlock(doc, "Title", complaint.title);
      paragraphBlock(doc, "Original Complaint", complaint.originalText);
      if (complaint.correctedText && complaint.correctedText !== complaint.originalText) {
        paragraphBlock(doc, "Corrected Complaint (AI spelling correction)", complaint.correctedText);
      }

      // AI classification
      sectionHeading(doc, "AI Classification");
      const aiRows = [
        ["Predicted Department", complaint.department],
        ["Confidence", fmtPercent(complaint.aiConfidence)],
        ["Priority", complaint.priority],
      ];
      if (!isSubmitterView) {
        aiRows.push(["Routing", routingLabel(complaint.routingSource)]);
        aiRows.push(["Escalated", complaint.isEscalated ? "Yes" : "No"]);
      }
      keyValueTable(doc, aiRows);

      // Image
      if (imageBuffer) {
        sectionHeading(doc, "Attached Image");
        try {
          const maxW = contentWidth(doc);
          const maxH = 300;
          const img = doc.openImage(imageBuffer);
          const scale = Math.min(maxW / img.width, maxH / img.height, 1);
          const w = img.width * scale;
          const h = img.height * scale;
          ensureSpace(doc, h + 10);
          const y = doc.y;
          doc.image(imageBuffer, MARGIN, y, { width: w, height: h });
          doc.rect(MARGIN, y, w, h).stroke(COLORS.border);
          doc.x = MARGIN;
          doc.y = y + h + 10;
        } catch (e) {
          doc.font("Helvetica-Oblique").fillColor(COLORS.muted).text("Image could not be displayed.", MARGIN, doc.y);
          doc.font("Helvetica").fillColor(COLORS.text);
        }
      } else if (complaint.image) {
        sectionHeading(doc, "Attached Image");
        doc.font("Helvetica-Oblique").fillColor(COLORS.muted).text("An image was attached but is currently unavailable.", MARGIN, doc.y);
        doc.font("Helvetica").fillColor(COLORS.text);
      }

      // History
      sectionHeading(doc, isSubmitterView ? "Complaint History" : "Complaint History & Staff Actions");
      const history = Array.isArray(complaint.history) ? complaint.history : [];
      if (history.length === 0) {
        doc.text("No history recorded.", MARGIN, doc.y);
      }
      history.forEach((h) => {
        const by = h.changedBy && typeof h.changedBy === "object" ? h.changedBy : null;
        const actor = isSubmitterView ? "" : by ? `${by.name} (${by.role})` : "";
        const lines = [`${h.status}  -  ${fmtDate(h.changedAt)}`];
        if (actor) lines.push(`By: ${actor}`);
        if (h.note) lines.push(`Note: ${h.note}`);
        const text = lines.join("\n");
        doc.font("Helvetica").fontSize(10);
        const hgt = doc.heightOfString(text, { width: contentWidth(doc) - 24 });
        ensureSpace(doc, hgt + 12);
        const y = doc.y;
        doc.circle(MARGIN + 6, y + 6, 3.5).fill(COLORS.accent);
        doc.fillColor(COLORS.text).text(text, MARGIN + 20, y, { width: contentWidth(doc) - 24 });
        doc.x = MARGIN;
        doc.y = Math.max(doc.y, y + 14) + 6;
      });

      // Resolution
      if (complaint.resolutionNote || complaint.status === "Resolved") {
        sectionHeading(doc, "Resolution");
        const resolvedEntry = [...history].reverse().find((h) => h.status === "Resolved");
        keyValueTable(doc, [
          ["Resolved On", resolvedEntry ? fmtDate(resolvedEntry.changedAt) : "N/A"],
        ]);
        paragraphBlock(doc, "Resolution Note", complaint.resolutionNote);
      }

      addFootersAndPageNumbers(doc, `Generated by UCMS on ${fmtDate(new Date())}  |  ${id}`);
    },
    { Title: `UCMS Complaint ${id}`, Author: "UCMS" }
  );
};

module.exports = { generateComplaintPdf, shortId };