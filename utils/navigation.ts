type RouterLike = {
  back: () => void;
  replace: (href: any) => void;
  canGoBack?: () => boolean;
};

export function goBackOrHome(router: RouterLike) {
  if (typeof router.canGoBack === 'function' && router.canGoBack()) {
    router.back();
    return;
  }
  router.replace('/');
}
