export type MobileDeviceNavigator = Pick<Navigator, 'maxTouchPoints' | 'platform' | 'userAgent'> & {
  userAgentData?: {
    mobile?: boolean
  }
}

export const isMobileDevice = (navigatorData: MobileDeviceNavigator): boolean => {
  if (navigatorData.userAgentData?.mobile === true) return true
  if (/Android|iPhone|iPad|iPod|IEMobile|Opera Mini|Mobile/i.test(navigatorData.userAgent)) return true
  return navigatorData.platform === 'MacIntel' && navigatorData.maxTouchPoints > 1
}
