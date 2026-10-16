// Old *.pages.dev address: permanent redirect to the canonical domain.
// (A _redirects rule can't be host-specific, and would loop on the new host.)
export async function onRequest({ request, next }) {
  const url = new URL(request.url);
  if (url.hostname === 'yearwheel.pages.dev') {
    return Response.redirect('https://yearwheel.lipu.dev' + url.pathname + url.search, 301);
  }
  return next();
}
