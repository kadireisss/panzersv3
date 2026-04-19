// middleware.js — Edge Middleware: Bot/scanner blocking
export const config = { matcher: ['/((?!api|_next|favicon).*)'] };

const BLOCKED_BOTS = /googlebot|bingbot|yandexbot|baiduspider|facebookexternalhit|twitterbot|rogerbot|linkedinbot|embedly|showyoubot|outbrain|pinterest|slackbot|vkshare|w3cvalidator|semrush|ahrefs|majestic|mj12bot|dotbot|petalbot|bytespider|sogou|exabot|ia_archiver|archive\.org_bot/i;
const SCANNER_AGENTS = /nikto|sqlmap|nmap|masscan|dirbuster|gobuster|wpscan|nuclei|httpx|subfinder|amass|burp|zaproxy|acunetix/i;

export default function middleware(request) {
  const ua = request.headers.get('user-agent') || '';
  if (BLOCKED_BOTS.test(ua) || SCANNER_AGENTS.test(ua)) {
    return new Response('', { status: 403 });
  }
}
