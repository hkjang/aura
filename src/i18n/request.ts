import {getRequestConfig} from 'next-intl/server';
 
export default getRequestConfig(async () => {
  // Provide a static locale, fetch a user setting,
  // or read from the URL.
  const locale = 'en'; // For now, we will enhance this
 
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});
