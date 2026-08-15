import type { Transporter } from "nodemailer";
import nodemailer from "nodemailer";
import { env, isEmailConfigured } from "../config/env";
import {
  detailList,
  escapeHtml,
  paragraph,
  renderBrandedEmail,
  richParagraph,
  statusPill,
} from "./email.templates";

export interface ReviewEmailContext {
  dealerName: string;
  dealerSlug: string;
  authorName: string;
  overallRating: number;
  title: string;
  comment: string;
  reviewerEmail: string;
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (!isEmailConfigured()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.email.host,
      port: env.email.port,
      secure: env.email.port === 465,
      requireTLS: env.email.port === 587,
      auth: {
        user: env.email.user,
        pass: env.email.pass,
      },
    });
  }
  return transporter;
}

async function sendMail(options: {
  to: string | string[];
  subject: string;
  text: string;
  html: string;
}): Promise<void> {
  const transport = getTransporter();
  const recipients = Array.isArray(options.to) ? options.to : [options.to];
  if (!transport) {
    console.warn(
      "[email] skipped (SMTP not configured). Would send:",
      options.subject,
      "→",
      recipients.join(", ")
    );
    return;
  }

  try {
    const info = await transport.sendMail({
      from: env.email.from,
      replyTo: env.email.user,
      to: recipients.join(", "),
      subject: options.subject,
      text: options.text,
      html: options.html,
      headers: {
        "X-Auto-Response-Suppress": "OOF, AutoReply",
      },
    });
    console.info(
      "[email] sent:",
      options.subject,
      "→",
      recipients.join(", "),
      info.messageId ? `(id ${info.messageId})` : ""
    );
  } catch (error) {
    console.error(
      "[email] send failed:",
      options.subject,
      "→",
      recipients.join(", "),
      error
    );
    throw error;
  }
}

function stars(rating: number): string {
  const filled = Math.max(0, Math.min(5, Math.round(rating)));
  return `${"★".repeat(filled)}${"☆".repeat(5 - filled)} (${filled}/5)`;
}

export class EmailService {
  async sendReviewSubmittedConfirmation(ctx: ReviewEmailContext): Promise<void> {
    const subject = `We received your review of ${ctx.dealerName}`;
    const text = [
      `Hi ${ctx.authorName},`,
      "",
      `Thank you for reviewing ${ctx.dealerName} on AutoSalesReviews.`,
      "Your review has been received and is pending approval.",
      "",
      "Most reviews are moderated within 1–2 business days. Once approved, it will appear on the dealer profile.",
      "",
      "— AutoSalesReviews",
    ].join("\n");

    const html = renderBrandedEmail({
      siteUrl: env.siteUrl,
      preheader: `Your review of ${ctx.dealerName} is pending approval.`,
      title: "Review submitted",
      bodyHtml: [
        statusPill("Pending approval", "pending"),
        paragraph(`Hi ${ctx.authorName},`),
        richParagraph(
          `Thank you for reviewing <strong>${escapeHtml(ctx.dealerName)}</strong> on AutoSalesReviews. Your feedback helps shoppers choose trusted dealerships.`
        ),
        paragraph(
          "Our team will review your submission within 1–2 business days. Once approved, it will appear on the dealer profile."
        ),
        detailList([
          { label: "Dealer", value: ctx.dealerName },
          { label: "Rating", value: stars(ctx.overallRating) },
          { label: "Title", value: ctx.title },
        ]),
      ].join(""),
      footerNote:
        "This is a transactional message about your review submission. You do not need to reply.",
    });

    await sendMail({ to: ctx.reviewerEmail, subject, text, html });
  }

  async sendNewReviewAdminNotification(ctx: ReviewEmailContext): Promise<void> {
    const adminUrl = `${env.siteUrl}/admin`;
    const excerpt =
      ctx.comment.length > 200
        ? `${ctx.comment.slice(0, 200)}…`
        : ctx.comment;

    const subject = `New review to moderate · ${ctx.dealerName}`;
    const text = [
      `A new review was submitted for ${ctx.dealerName}.`,
      "",
      `Reviewer: ${ctx.authorName}`,
      `Email: ${ctx.reviewerEmail}`,
      `Rating: ${ctx.overallRating}/5`,
      `Title: ${ctx.title}`,
      `Comment: ${excerpt}`,
      "",
      `Moderate: ${adminUrl}`,
    ].join("\n");

    const html = renderBrandedEmail({
      siteUrl: env.siteUrl,
      preheader: `${ctx.authorName} left a ${ctx.overallRating}/5 review for ${ctx.dealerName}.`,
      title: "New review pending approval",
      bodyHtml: [
        statusPill("Action needed", "alert"),
        richParagraph(
          `A new review was submitted for <strong>${escapeHtml(ctx.dealerName)}</strong>.`
        ),
        detailList([
          { label: "Reviewer", value: ctx.authorName },
          { label: "Email", value: ctx.reviewerEmail },
          { label: "Rating", value: stars(ctx.overallRating) },
          { label: "Title", value: ctx.title },
          { label: "Comment", value: excerpt },
        ]),
      ].join(""),
      cta: { label: "Open admin panel", url: adminUrl },
      footerNote: "Internal moderation alert for AutoSalesReviews administrators.",
    });

    await sendMail({ to: env.email.adminRecipients, subject, text, html });
  }

  async sendReviewApprovedNotification(ctx: ReviewEmailContext): Promise<void> {
    const profileUrl = `${env.siteUrl}/dealers/${ctx.dealerSlug}`;
    const subject = `Your review of ${ctx.dealerName} is live`;
    const text = [
      `Hi ${ctx.authorName},`,
      "",
      `Your review for ${ctx.dealerName} has been approved and is now live on AutoSalesReviews.`,
      "",
      `View it here: ${profileUrl}`,
      "",
      "Thank you for helping shoppers make confident decisions.",
      "",
      "— AutoSalesReviews",
    ].join("\n");

    const html = renderBrandedEmail({
      siteUrl: env.siteUrl,
      preheader: `Your review of ${ctx.dealerName} is now published.`,
      title: "Your review is live",
      bodyHtml: [
        statusPill("Approved", "success"),
        paragraph(`Hi ${ctx.authorName},`),
        richParagraph(
          `Great news — your review for <strong>${escapeHtml(ctx.dealerName)}</strong> has been approved and is now live.`
        ),
        paragraph(
          "Thank you for helping shoppers make confident decisions about where to buy."
        ),
        detailList([
          { label: "Dealer", value: ctx.dealerName },
          { label: "Rating", value: stars(ctx.overallRating) },
          { label: "Title", value: ctx.title },
        ]),
      ].join(""),
      cta: { label: "View dealer profile", url: profileUrl },
      footerNote:
        "This is a transactional message about your review. You do not need to reply.",
    });

    await sendMail({ to: ctx.reviewerEmail, subject, text, html });
  }

  async sendReviewReportNotification(ctx: {
    reviewId: string;
    dealerName: string;
    dealerSlug: string;
    authorName: string;
    title: string;
    comment: string;
    reason: string;
    reporterIp: string;
  }): Promise<void> {
    const adminUrl = `${env.siteUrl}/admin`;
    const excerpt =
      ctx.comment.length > 200
        ? `${ctx.comment.slice(0, 200)}…`
        : ctx.comment;

    const subject = `Review reported · ${ctx.dealerName}`;
    const text = [
      `A review was reported on AutoSalesReviews.`,
      "",
      `Dealer: ${ctx.dealerName}`,
      `Review ID: ${ctx.reviewId}`,
      `Author: ${ctx.authorName}`,
      `Title: ${ctx.title}`,
      `Reason: ${ctx.reason}`,
      `Reporter IP: ${ctx.reporterIp}`,
      `Comment: ${excerpt}`,
      "",
      `Moderate: ${adminUrl}`,
    ].join("\n");

    const html = renderBrandedEmail({
      siteUrl: env.siteUrl,
      preheader: `A review on ${ctx.dealerName} was reported: ${ctx.reason}`,
      title: "Review reported",
      bodyHtml: [
        statusPill("Needs review", "alert"),
        paragraph("A review was reported on AutoSalesReviews and may need moderation."),
        detailList([
          { label: "Dealer", value: ctx.dealerName },
          { label: "Review ID", value: ctx.reviewId },
          { label: "Author", value: ctx.authorName },
          { label: "Title", value: ctx.title },
          { label: "Reason", value: ctx.reason },
          { label: "Reporter IP", value: ctx.reporterIp },
          { label: "Comment", value: excerpt },
        ]),
      ].join(""),
      cta: { label: "Open admin panel", url: adminUrl },
      footerNote: "Internal moderation alert for AutoSalesReviews administrators.",
    });

    await sendMail({ to: env.email.adminRecipients, subject, text, html });
  }

  async sendNewsletterSubscriptionNotification(email: string): Promise<void> {
    const adminUrl = `${env.siteUrl}/admin`;
    const subject = `New newsletter subscriber`;
    const text = [
      `A new visitor subscribed to the AutoSalesReviews newsletter.`,
      "",
      `Email: ${email}`,
      "",
      `Admin panel: ${adminUrl}`,
    ].join("\n");

    const html = renderBrandedEmail({
      siteUrl: env.siteUrl,
      preheader: `${email} subscribed to buying guide emails.`,
      title: "New newsletter subscriber",
      bodyHtml: [
        statusPill("New subscriber", "success"),
        richParagraph(
          `<strong>${escapeHtml(email)}</strong> subscribed to the AutoSalesReviews newsletter.`
        ),
      ].join(""),
      cta: { label: "Open admin panel", url: adminUrl },
      footerNote: "Internal notification for AutoSalesReviews administrators.",
    });

    await sendMail({ to: env.email.adminRecipients, subject, text, html });
  }
}

export const emailService = new EmailService();
