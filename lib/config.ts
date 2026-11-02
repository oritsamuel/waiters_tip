export const HULUBEJE_AUTH_URL =
  process.env.HULUBEJE_AUTH_URL ||
  process.env.AUTH_URL ||
  'https://v7-hulubeje.cnetcommerce.com/api/auth/login';

export const HULUBEJE_API_URL =
  process.env.HULUBEJE_API_URL ||
  process.env.API_URL ||
  'https://v7-hulubeje.cnetcommerce.com/api/waiter-tips';

export const HULUBEJE_PUBLIC_API_URL =
  process.env.HULUBEJE_PUBLIC_API_URL ||
  `${HULUBEJE_API_URL}/public`;

export const HULUBEJE_API_KEY =
  process.env.HULUBEJE_API_KEY ||
  process.env.API_KEY ||
  '5D5EAFF4-D29A-485B-BDB9-785EF86FFFAE';

export const HULUBEJE_AUTH_TOKEN =
  process.env.HULUBEJE_AUTH_TOKEN ||
  process.env.AUTH_TOKEN ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwOTEyOTE4MzA1IiwianRpIjoiMjAyOERDNzlBN0JFQUM5OEYxNjZBRkMzOUVCMDNFRDlBQjcyMzc3NjkyMUM0ODgzMThFODA3RjA1RjUwRjNFREY4MzI1RUE0ODVCOTVCRDQzN0M0MzgzRjEyMTk4RDY4Q0UzQ0QwMkI2REMyREU0QTlGNDQ4MTYzQ0Y2OTIyNzQiLCJleHAiOjE3OTU4NzA0NDgsImlzcyI6Ikh1bHViZWplIiwiYXVkIjoiSHVsdWJlamUifQ.CttzNP38pO2SJvRgWUS6ICy3a2Zofo211wr98C9NTs0';

export const HULUBEJE_TIP_URL =
  process.env.HULUBEJE_TIP_URL ||
  'https://v7-hulubeje.cnetcommerce.com/api/waiter/tip';

export const DEFAULT_COMPANY_ID =
  process.env.DEFAULT_COMPANY_ID ||
  '50301';

export const DEFAULT_BRANCH_CODE =
  process.env.DEFAULT_BRANCH_CODE ||
  '44496';
