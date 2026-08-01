import type { Transporter } from "nodemailer";
import nodemailer from "nodemailer";
import { env, isEmailConfigured } from "../config/env";

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
      auth: {
        user: env.email.user,
        pass: env.email.pass,
      },
    });
  }
  return transporter;
}

async function sendMail(options: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<void> {
  const transport = getTransporter();
  if (!transport) {
    if (!env.isProduction) {
      console.info("[email:dev]", options.subject, "→", options.to);
      console.info(options.text);
    }
    return;
  }

  await transport.sendMail({
    from: env.email.from,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  });
}

export class EmailService {
  async sendReviewSubmittedConfirmation(ctx: ReviewEmailContext): Promise<void> {
    const subject = `Your review for ${ctx.dealerName} has been submitted`;
    const text = [
      `Hi ${ctx.authorName},`,
      "",
      `Thank you for reviewing ${ctx.dealerName}. Your review has been received and is pending approval.`,
      "",
      `Most reviews are reviewed within 1–2 business days. Once approved, it will appear on the dealer profile.`,
      "",
      "— AutoSalesReviews",
    ].join("\n");

    const html = `
      <p>Hi ${escapeHtml(ctx.authorName)},</p>
      <p>Thank you for reviewing <strong>${escapeHtml(ctx.dealerName)}</strong>. Your review has been received and is <strong>pending approval</strong>.</p>
      <p>Most reviews are reviewed within 1–2 business days. Once approved, it will appear on the dealer profile.</p>
      <p>— AutoSalesReviews</p>
    `;

    await sendMail({ to: ctx.reviewerEmail, subject, text, html });
  }

  async sendNewReviewAdminNotification(ctx: ReviewEmailContext): Promise<void> {
    const adminUrl = `${env.siteUrl}/admin`;
    const excerpt =
      ctx.comment.length > 200
        ? `${ctx.comment.slice(0, 200)}…`
        : ctx.comment;

    const subject = `New review pending approval for ${ctx.dealerName}`;
    const text = [
      `A new review was submitted for ${ctx.dealerName}.`,
      "",
      `Reviewer: ${ctx.authorName}`,
      `Rating: ${ctx.overallRating}/5`,
      `Title: ${ctx.title}`,
      `Comment: ${excerpt}`,
      "",
      `Moderate: ${adminUrl}`,
    ].join("\n");

    const html = `
      <p>A new review was submitted for <strong>${escapeHtml(ctx.dealerName)}</strong>.</p>
      <ul>
        <li><strong>Reviewer:</strong> ${escapeHtml(ctx.authorName)}</li>
        <li><strong>Rating:</strong> ${ctx.overallRating}/5</li>
        <li><strong>Title:</strong> ${escapeHtml(ctx.title)}</li>
        <li><strong>Comment:</strong> ${escapeHtml(excerpt)}</li>
      </ul>
      <p><a href="${adminUrl}">Open admin panel</a></p>
    `;

    await sendMail({ to: env.email.adminTo, subject, text, html });
  }

  async sendReviewApprovedNotification(ctx: ReviewEmailContext): Promise<void> {
    const profileUrl = `${env.siteUrl}/dealers/${ctx.dealerSlug}`;
    const subject = `Your review for ${ctx.dealerName} is now live`;
    const text = [
      `Hi ${ctx.authorName},`,
      "",
      `Great news — your review for ${ctx.dealerName} has been approved and is now live.`,
      "",
      `View it here: ${profileUrl}`,
      "",
      "Thank you for helping shoppers make confident decisions.",
      "",
      "— AutoSalesReviews",
    ].join("\n");

    const html = `
      <p>Hi ${escapeHtml(ctx.authorName)},</p>
      <p>Great news — your review for <strong>${escapeHtml(ctx.dealerName)}</strong> has been approved and is now live.</p>
      <p><a href="${profileUrl}">View the dealer profile</a></p>
      <p>Thank you for helping shoppers make confident decisions.</p>
      <p>— AutoSalesReviews</p>
    `;

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

    const subject = `Review reported: ${ctx.dealerName}`;
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

    const html = `
      <p>A review was reported on AutoSalesReviews.</p>
      <ul>
        <li><strong>Dealer:</strong> ${escapeHtml(ctx.dealerName)}</li>
        <li><strong>Review ID:</strong> ${escapeHtml(ctx.reviewId)}</li>
        <li><strong>Author:</strong> ${escapeHtml(ctx.authorName)}</li>
        <li><strong>Title:</strong> ${escapeHtml(ctx.title)}</li>
        <li><strong>Reason:</strong> ${escapeHtml(ctx.reason)}</li>
        <li><strong>Reporter IP:</strong> ${escapeHtml(ctx.reporterIp)}</li>
        <li><strong>Comment:</strong> ${escapeHtml(excerpt)}</li>
      </ul>
      <p><a href="${adminUrl}">Open admin panel</a></p>
    `;

    await sendMail({ to: env.email.adminTo, subject, text, html });
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export const emailService = new EmailService();
