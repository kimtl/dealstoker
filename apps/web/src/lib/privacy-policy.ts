import type { Locale } from "@/lib/i18n/locale";

/** Bump this whenever the policy text below changes. */
export const PRIVACY_LAST_UPDATED = "2026-10-07";

const GOOGLE_PARTNER_SITES = "https://policies.google.com/technologies/partner-sites";
const GOOGLE_PRIVACY = "https://policies.google.com/privacy";
const GOOGLE_AD_CENTER = "https://myadcenter.google.com/";
const ABOUT_ADS_CHOICES = "https://optout.aboutads.info/";
const NAI_OPT_OUT = "https://optout.networkadvertising.org/";
const AMAZON_PRIVACY =
  "https://www.amazon.com/gp/help/customer/display.html?nodeId=GX7NJQ4ZB8MHFRNJ";

const en = `
DealStoker ({domain}) is a small, independent website. You can read everything on it without an account, and we never ask for your name, address, or payment details. This policy explains what we collect when you visit, which cookies we and Google use, and the choices you have.

## What we collect

**Page views.** When a page loads, our own analytics records the page address, the page you came from (referrer), your browser's user-agent string, the time, a random visitor ID and session ID (see Cookies below), and a hashed version of your IP address. We store the hash, not the IP address itself.

**Clicks to Amazon.** When you follow one of our links to Amazon.com, we record which product it was, the time, the referrer, your user-agent string, the session ID, the hashed IP address, and any campaign tags in the link (such as \`utm_source\`). We use this to count clicks and to filter out bots and repeated clicks.

**Messages you send us.** If you email us, we receive your email address and whatever you write, and we use them only to reply.

**Server logs.** The companies that host the site may keep standard technical logs (such as IP address, requested URL, time, and browser) for security and troubleshooting.

We do not collect payment information. Purchases happen on Amazon.com, not on DealStoker.

## How we use it

- To see which pages, guides, and products are useful, and to build lists such as "Top views".
- To keep statistics honest by filtering out bots and duplicate clicks.
- To keep the site secure and working.
- To measure how well our own ads work (see Google below).
- To answer messages you send us.

We do not use this information to work out who you are, and we do not sell personal information for money.

## Cookies

Cookies are small files your browser stores for a website. DealStoker sets these first-party cookies:

| Cookie | What it is for | How long it lasts |
| --- | --- | --- |
| \`ds_vid\` | Random visitor ID for our page-view statistics | 1 year |
| \`ds_sid\` | Random session ID for statistics and duplicate-click filtering | 30 minutes |
| \`ds_locale\` | Remembers your language (English or Korean) | 1 year |

Google may also set cookies on our pages, as described in the next section. You can block or delete cookies in your browser settings. The site still works without them; it just forgets your language choice.

## Google advertising services

**Google Ads.** We advertise DealStoker through Google Ads and load the Google Ads tag (gtag.js) on our pages. It uses cookies so Google can tell us whether people who clicked our ads went on to use the site (conversion measurement), and, where enabled in our Google Ads account, to show our ads to people who have visited before (remarketing).

**Google AdSense.** We may show ads served by Google AdSense on DealStoker. When we do:

- Third-party vendors, including Google, use cookies to serve ads based on your prior visits to this website or other websites.
- Google's use of advertising cookies enables it and its partners to serve ads to you based on your visit to this site and/or other sites on the Internet.
- You can opt out of personalized advertising in [Google's My Ad Center](${GOOGLE_AD_CENTER}). You can also opt out of some third-party vendors' use of cookies for personalized advertising at [aboutads.info](${ABOUT_ADS_CHOICES}) and through the [Network Advertising Initiative](${NAI_OPT_OUT}).

If you opt out, you will still see ads; they just won't be based on your interests.

To learn how Google uses information from sites like ours, see [How Google uses information from sites or apps that use our services](${GOOGLE_PARTNER_SITES}) and [Google's Privacy Policy](${GOOGLE_PRIVACY}).

## Amazon

DealStoker is a participant in the Amazon Services LLC Associates Program. When you follow a link to Amazon.com, Amazon may use cookies to know that you came from us so it can pay us a referral fee; this never changes your price. Once you are on Amazon.com, [Amazon's Privacy Notice](${AMAZON_PRIVACY}) applies to what you do there.

## Your choices

- **Cookies:** block or delete cookies in your browser, or use a private window.
- **Personalized ads:** use [My Ad Center](${GOOGLE_AD_CENTER}), [aboutads.info](${ABOUT_ADS_CHOICES}), or the [NAI opt-out](${NAI_OPT_OUT}). Blocking third-party cookies in your browser also stops most ad personalization.
- **Questions or requests:** email [privacy@{domain}](mailto:privacy@{domain}). Our records are tied to random IDs rather than names, so we may not always be able to find data that belongs to you, but we will do what we reasonably can.

## US state privacy rights

Depending on where you live (for example California, Colorado, Connecticut, Virginia, or Texas), you may have the right to know what personal information we hold about you, to access, correct, or delete it, and to opt out of its "sale" or "sharing" for targeted advertising.

We do not sell personal information for money. However, the Google advertising cookies described above may count as "sharing" or "targeted advertising" under some of these laws. You can opt out of that at any time using the controls in "Your choices". To make any other request, email [privacy@{domain}](mailto:privacy@{domain}). We will not treat you differently for using these rights.

## How long we keep information

We keep page-view and click records while they help us understand how the site is used over time, and delete them when they no longer serve that purpose. We keep emails only as long as we need them to deal with your message.

## Security

We protect the site with HTTPS and keep our admin tools behind a login. No website can promise perfect security, but we work to keep what we hold safe.

## Children

DealStoker is meant for adults shopping on Amazon.com. It is not directed at children under 13, and we do not knowingly collect personal information from them. If you think a child has sent us personal information, email us and we will delete it.

## Visitors outside the United States

DealStoker is built for shoppers in the United States. Our service providers may process information in the United States or other countries where they operate.

## Changes to this policy

When we change this policy, we update the date at the top of this page. If a change is significant, we will also point it out on the site.

## Contact

Privacy questions or requests: [privacy@{domain}](mailto:privacy@{domain}). Anything else: [hello@{domain}](mailto:hello@{domain}) or the [contact page](/contact).
`;

const ko = `
DealStoker({domain})는 작은 독립 웹사이트입니다. 계정 없이 모든 내용을 볼 수 있고, 이름·주소·결제 정보를 요청하지 않습니다. 이 방침은 방문 시 무엇을 수집하는지, 저희와 Google이 어떤 쿠키를 쓰는지, 그리고 어떤 선택을 하실 수 있는지 설명합니다. 한국어 번역과 영어 원문의 내용이 다를 경우 영어 원문이 우선합니다.

## 수집하는 정보

**페이지 조회.** 페이지가 열리면 자체 분석 시스템이 페이지 주소, 이전 페이지(리퍼러), 브라우저의 사용자 에이전트 문자열, 시각, 무작위 방문자 ID와 세션 ID(아래 쿠키 참고), 그리고 IP 주소의 해시값을 기록합니다. IP 주소 자체가 아니라 해시값만 저장합니다.

**Amazon으로 이동하는 클릭.** 저희 링크를 통해 Amazon.com으로 이동하면 어떤 상품인지, 시각, 리퍼러, 사용자 에이전트, 세션 ID, IP 해시값, 링크에 포함된 캠페인 태그(\`utm_source\` 등)를 기록합니다. 클릭 수를 세고 봇과 중복 클릭을 걸러내는 데 사용합니다.

**보내 주신 메시지.** 이메일을 보내시면 이메일 주소와 내용을 받게 되며, 답장하는 데에만 사용합니다.

**서버 로그.** 사이트를 호스팅하는 업체가 보안과 문제 해결을 위해 표준 기술 로그(IP 주소, 요청한 URL, 시각, 브라우저 등)를 보관할 수 있습니다.

결제 정보는 수집하지 않습니다. 구매는 DealStoker가 아니라 Amazon.com에서 이루어집니다.

## 이용 목적

- 어떤 페이지, 가이드, 상품이 유용한지 파악하고 "인기 조회" 같은 목록을 만들기 위해
- 봇과 중복 클릭을 걸러 통계를 정확하게 유지하기 위해
- 사이트를 안전하고 정상적으로 운영하기 위해
- 저희 광고의 성과를 측정하기 위해(아래 Google 항목 참고)
- 보내 주신 메시지에 답하기 위해

이 정보로 방문자가 누구인지 알아내려 하지 않으며, 개인정보를 돈을 받고 판매하지 않습니다.

## 쿠키

쿠키는 브라우저가 웹사이트를 위해 저장하는 작은 파일입니다. DealStoker는 다음 자체 쿠키를 사용합니다.

| 쿠키 | 용도 | 보관 기간 |
| --- | --- | --- |
| \`ds_vid\` | 페이지 조회 통계용 무작위 방문자 ID | 1년 |
| \`ds_sid\` | 통계와 중복 클릭 필터링용 무작위 세션 ID | 30분 |
| \`ds_locale\` | 선택한 언어(영어/한국어) 기억 | 1년 |

다음 항목에서 설명하듯 Google도 저희 페이지에서 쿠키를 설정할 수 있습니다. 브라우저 설정에서 쿠키를 차단하거나 삭제할 수 있으며, 그래도 사이트는 정상적으로 동작합니다. 언어 선택만 기억하지 못합니다.

## Google 광고 서비스

**Google Ads.** 저희는 Google Ads로 DealStoker를 광고하며, 페이지에 Google Ads 태그(gtag.js)를 불러옵니다. 이 태그는 쿠키를 사용해 광고를 클릭한 사람이 사이트를 이용했는지 Google이 측정할 수 있게 하고(전환 측정), Google Ads 계정에서 설정한 경우 이전 방문자에게 저희 광고를 보여 줍니다(리마케팅).

**Google AdSense.** DealStoker에 Google AdSense 광고를 게재할 수 있습니다. 이 경우:

- Google을 포함한 제3자 공급업체는 쿠키를 사용해 사용자가 이 웹사이트나 다른 웹사이트를 이전에 방문한 기록을 바탕으로 광고를 게재합니다.
- Google은 광고 쿠키를 사용해, Google과 파트너가 이 사이트 및/또는 인터넷의 다른 사이트 방문 기록을 바탕으로 사용자에게 광고를 게재할 수 있습니다.
- [Google 내 광고 센터](${GOOGLE_AD_CENTER})에서 맞춤 광고를 해제할 수 있습니다. [aboutads.info](${ABOUT_ADS_CHOICES})와 [NAI(Network Advertising Initiative)](${NAI_OPT_OUT})에서도 일부 제3자 공급업체의 맞춤 광고용 쿠키 사용을 해제할 수 있습니다.

해제하더라도 광고는 계속 표시되며, 관심사에 기반하지 않을 뿐입니다.

Google이 이런 사이트의 정보를 어떻게 사용하는지는 [Google 서비스를 사용하는 사이트나 앱의 정보를 Google이 사용하는 방법](${GOOGLE_PARTNER_SITES})과 [Google 개인정보처리방침](${GOOGLE_PRIVACY})에서 확인하실 수 있습니다.

## Amazon

DealStoker는 Amazon Services LLC Associates Program 참여자입니다. 링크를 통해 Amazon.com으로 이동하면 Amazon은 저희를 거쳐 왔다는 것을 알기 위해 쿠키를 사용할 수 있으며, 이를 근거로 저희에게 소개 수수료를 지급합니다. 이로 인해 가격이 달라지지는 않습니다. Amazon.com에서의 활동에는 [Amazon 개인정보 고지](${AMAZON_PRIVACY})가 적용됩니다.

## 선택할 수 있는 것

- **쿠키:** 브라우저에서 쿠키를 차단·삭제하거나 시크릿 창을 사용하세요.
- **맞춤 광고:** [내 광고 센터](${GOOGLE_AD_CENTER}), [aboutads.info](${ABOUT_ADS_CHOICES}), [NAI 해제 페이지](${NAI_OPT_OUT})를 이용하세요. 브라우저에서 제3자 쿠키를 차단해도 대부분의 맞춤 광고가 중단됩니다.
- **문의와 요청:** [privacy@{domain}](mailto:privacy@{domain})로 이메일을 보내 주세요. 저희 기록은 이름이 아닌 무작위 ID에 연결되어 있어 본인의 데이터를 항상 찾을 수 있는 것은 아니지만, 합리적인 범위에서 최선을 다하겠습니다.

## 미국 주별 개인정보 권리

거주하는 주(예: 캘리포니아, 콜로라도, 코네티컷, 버지니아, 텍사스)에 따라 저희가 보유한 개인정보를 알 권리, 열람·정정·삭제할 권리, 그리고 맞춤형 광고를 위한 "판매" 또는 "공유"를 거부할 권리가 있을 수 있습니다.

저희는 개인정보를 돈을 받고 판매하지 않습니다. 다만 위에서 설명한 Google 광고 쿠키는 일부 주 법률에서 "공유" 또는 "맞춤형 광고"로 볼 수 있습니다. "선택할 수 있는 것"의 방법으로 언제든 거부하실 수 있습니다. 그 밖의 요청은 [privacy@{domain}](mailto:privacy@{domain})로 보내 주세요. 권리를 행사했다는 이유로 불이익을 주지 않습니다.

## 보관 기간

페이지 조회와 클릭 기록은 시간에 따른 사이트 이용 흐름을 이해하는 데 도움이 되는 동안 보관하고, 더 이상 필요하지 않으면 삭제합니다. 이메일은 문의를 처리하는 데 필요한 기간만 보관합니다.

## 보안

사이트는 HTTPS로 보호되며, 관리 도구는 로그인 뒤에 있습니다. 어떤 웹사이트도 완벽한 보안을 약속할 수는 없지만, 보유한 정보를 안전하게 지키기 위해 노력합니다.

## 아동

DealStoker는 Amazon.com에서 쇼핑하는 성인을 위한 사이트입니다. 만 13세 미만 아동을 대상으로 하지 않으며, 아동의 개인정보를 알면서 수집하지 않습니다. 아동이 개인정보를 보냈다고 생각되면 이메일로 알려 주세요. 삭제하겠습니다.

## 미국 외 방문자

DealStoker는 미국 쇼핑객을 위해 만들어졌습니다. 서비스 제공업체는 미국이나 그들이 운영하는 다른 국가에서 정보를 처리할 수 있습니다.

## 방침 변경

방침을 변경하면 이 페이지 상단의 날짜를 갱신합니다. 중요한 변경이라면 사이트에서도 알려 드리겠습니다.

## 연락처

개인정보 관련 문의·요청: [privacy@{domain}](mailto:privacy@{domain}). 그 밖의 문의: [hello@{domain}](mailto:hello@{domain}) 또는 [문의 페이지](/contact).
`;

/** Policy body as Markdown for the given locale; `{domain}` is filled in by the caller. */
export function privacyPolicyMarkdown(locale: Locale): string {
  return (locale === "ko" ? ko : en).trim();
}
