import { NotFoundError } from "../errors/AppError";
import { dealerRepository } from "../repositories/dealer.repository";
import { ratingService } from "./rating.service";
import { toDealerSummaryDto } from "../dtos/dealer.dto";
import { env } from "../config/env";

export class BadgeService {
  async getBadgeData(slug: string) {
    const dealer = await dealerRepository.findBySlug(slug);
    if (!dealer || !dealer.hasBadge) {
      throw new NotFoundError("Badge");
    }

    const settings = await ratingService.getSettings();
    const summary = toDealerSummaryDto(dealer, settings);
    const year = dealer.badgeYear ?? new Date().getFullYear();

    return {
      dealerName: dealer.name,
      slug: dealer.slug,
      badgeYear: year,
      combinedRating: summary.combinedRating,
      totalReviews: summary.totalReviews,
      profileUrl: `${env.siteUrl}/dealers/${dealer.slug}`,
      badgeUrl: `${env.siteUrl}/badge/${dealer.slug}`,
      embedCode: `<script src="${env.siteUrl}/api/badge/${dealer.slug}/widget.js"></script>`,
    };
  }

  buildWidgetScript(slug: string, data: Awaited<ReturnType<BadgeService["getBadgeData"]>>) {
    const rating =
      data.combinedRating != null ? data.combinedRating.toFixed(1) : "—";
    const payload = JSON.stringify({
      dealerName: data.dealerName,
      rating,
      year: data.badgeYear,
      profileUrl: data.profileUrl,
      badgeUrl: data.badgeUrl,
    });

    return `(function(){
  var d=${payload};
  var s=document.currentScript;
  var wrap=document.createElement("div");
  wrap.style.cssText="display:inline-block;width:220px;font-family:Inter,Arial,sans-serif;border:1px solid #d0d7e2;border-radius:8px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);background:#fff;";
  var root=document.createElement("a");
  root.href=d.profileUrl;
  root.target="_blank";
  root.rel="noopener noreferrer";
  root.title=d.dealerName+" on AutoSalesReviews";
  root.style.cssText="display:block;text-decoration:none;color:#003087;";
  root.innerHTML='<div style="background:#003087;color:#E8A400;padding:8px 10px;font-size:11px;font-weight:700;letter-spacing:0.04em;text-align:center;">AutoSalesReviews.com</div>'
    +'<div style="padding:12px 10px;text-align:center;">'
    +'<div style="font-size:12px;font-weight:700;line-height:1.3;margin-bottom:6px;">'+escapeHtml(d.dealerName)+'</div>'
    +'<div style="font-size:20px;font-weight:800;color:#E8A400;">★ '+d.rating+'</div>'
    +'<div style="margin-top:6px;font-size:10px;font-weight:700;letter-spacing:0.06em;color:#003087;">EXCELLENCE AWARD '+d.year+'</div>'
    +'</div>';
  var verify=document.createElement("a");
  verify.href=d.badgeUrl;
  verify.target="_blank";
  verify.rel="noopener noreferrer";
  verify.textContent="Verify badge";
  verify.style.cssText="display:block;background:#f8f9fa;color:#003087;text-align:center;font-size:10px;font-weight:700;padding:6px;text-decoration:none;border-top:1px solid #e5e7eb;";
  wrap.appendChild(root);
  wrap.appendChild(verify);
  if(s&&s.parentNode){s.parentNode.insertBefore(wrap,s.nextSibling);}
  function escapeHtml(t){return String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}
})();`;
  }
}

export const badgeService = new BadgeService();
