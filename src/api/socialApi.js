import axiosInstance from './axios'

// Instagram
export const getInstagramAnalyticsApi    = (period)  => axiosInstance.get('/social/instagram', { params: { period } })
export const updateInstagramCaptionApi   = (mediaId, caption) => axiosInstance.patch(`/social/instagram/${mediaId}/caption`, { caption })

// Meta Ads
export const getMetaAdsAnalyticsApi      = (preset)  => axiosInstance.get('/social/meta', { params: { preset } })

// Website (GA4)
export const getWebsiteAnalyticsApi      = (range)   => axiosInstance.get('/social/website', { params: { range } })
