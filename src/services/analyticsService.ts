import { MarketingTrackingSettings } from '../types';

declare global {
  interface Window {
    fbq?: any;
    _fbq?: any;
    ttq?: any;
    TiktokAnalyticsObject?: string;
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}

export const DEFAULT_TRACKING_SETTINGS: MarketingTrackingSettings = {
  facebookPixelId: '',
  facebookPixelEnabled: false,
  facebookTestEventCode: '',
  tiktokPixelId: '',
  tiktokPixelEnabled: false,
  gtmContainerId: '',
  gtmEnabled: false,
  ga4MeasurementId: '',
  ga4Enabled: false,
  customHeaderScript: '',
  customFooterScript: '',
  trackPageViews: true,
  trackViewContent: true,
  trackInitiateCheckout: true,
  trackPurchase: true,
  trackContact: true,
  trackRegistration: true,
};

class AnalyticsService {
  private currentSettings: MarketingTrackingSettings = { ...DEFAULT_TRACKING_SETTINGS };
  private initializedPixels: {
    facebook?: string;
    tiktok?: string;
    gtm?: string;
    ga4?: string;
  } = {};

  /**
   * Initializes and synchronizes tracking pixels based on provided configuration.
   */
  public initMarketingPixels(settings: Partial<MarketingTrackingSettings> | null | undefined) {
    if (typeof window === 'undefined') return;

    const merged: MarketingTrackingSettings = {
      ...DEFAULT_TRACKING_SETTINGS,
      ...(settings || {}),
    };

    this.currentSettings = merged;

    // 1. Initialize or update Meta / Facebook Pixel
    this.syncFacebookPixel(merged);

    // 2. Initialize or update TikTok Pixel
    this.syncTikTokPixel(merged);

    // 3. Initialize or update Google Tag Manager (GTM)
    this.syncGTM(merged);

    // 4. Initialize or update Google Analytics 4 (GA4)
    this.syncGA4(merged);

    // 5. Inject custom header & footer scripts if specified
    this.syncCustomScripts(merged);

    console.log('[AnalyticsService] Marketing & Tracking Pixels configured:', {
      Facebook: merged.facebookPixelEnabled ? merged.facebookPixelId || 'None' : 'Disabled',
      TikTok: merged.tiktokPixelEnabled ? merged.tiktokPixelId || 'None' : 'Disabled',
      GTM: merged.gtmEnabled ? merged.gtmContainerId || 'None' : 'Disabled',
      GA4: merged.ga4Enabled ? merged.ga4MeasurementId || 'None' : 'Disabled',
    });
  }

  /**
   * Meta (Facebook) Pixel Synchronization
   */
  private syncFacebookPixel(settings: MarketingTrackingSettings) {
    const cleanId = (settings.facebookPixelId || '').trim();

    if (!settings.facebookPixelEnabled || !cleanId) {
      return;
    }

    if (this.initializedPixels.facebook === cleanId) {
      return;
    }

    try {
      if (!window.fbq) {
        /* eslint-disable */
        (function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
          if (f.fbq) return;
          n = f.fbq = function () {
            n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
          };
          if (!f._fbq) f._fbq = n;
          n.push = n;
          n.loaded = !0;
          n.version = '2.0';
          n.queue = [];
          t = b.createElement(e);
          t.async = !0;
          t.src = v;
          t.id = 'meta-pixel-script';
          s = b.getElementsByTagName(e)[0];
          if (s && s.parentNode) {
            s.parentNode.insertBefore(t, s);
          } else {
            b.head.appendChild(t);
          }
        })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
        /* eslint-enable */
      }

      if (window.fbq) {
        if (settings.facebookTestEventCode) {
          window.fbq('init', cleanId, {}, { test_event_code: settings.facebookTestEventCode });
        } else {
          window.fbq('init', cleanId);
        }
        if (settings.trackPageViews) {
          window.fbq('track', 'PageView');
        }
        this.initializedPixels.facebook = cleanId;
      }
    } catch (err) {
      console.warn('[AnalyticsService] Facebook Pixel setup error:', err);
    }
  }

  /**
   * TikTok Pixel Synchronization
   */
  private syncTikTokPixel(settings: MarketingTrackingSettings) {
    const cleanId = (settings.tiktokPixelId || '').trim();

    if (!settings.tiktokPixelEnabled || !cleanId) {
      return;
    }

    if (this.initializedPixels.tiktok === cleanId) {
      return;
    }

    try {
      if (!window.ttq) {
        /* eslint-disable */
        (function (w: any, d: any, t: any) {
          w.TiktokAnalyticsObject = t;
          var ttq = (w[t] = w[t] || []);
          ttq.methods = [
            'page',
            'track',
            'identify',
            'instances',
            'debug',
            'on',
            'off',
            'once',
            'ready',
            'alias',
            'group',
            'enableCookie',
            'disableCookie',
            'holdConsent',
            'revokeConsent',
            'grantConsent',
          ];
          ttq.setAndDefer = function (t: any, e: any) {
            t[e] = function () {
              t.push([e].concat(Array.prototype.slice.call(arguments, 0)));
            };
          };
          for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
          ttq.instance = function (t: any) {
            for (var e = ttq._i[t] || [], n = 0; n < ttq.methods.length; n++) ttq.setAndDefer(e, ttq.methods[n]);
            return e;
          };
          ttq.load = function (e: any, n: any) {
            var r = 'https://analytics.tiktok.com/i18n/pixel/events.js',
              o = n && n.partner;
            ttq._i = ttq._i || {};
            ttq._i[e] = [];
            ttq._i[e]._u = r;
            ttq._t = ttq._t || {};
            ttq._t[e] = +new Date();
            ttq._o = ttq._o || {};
            ttq._o[e] = n || {};
            var a = document.createElement('script');
            a.type = 'text/javascript';
            a.async = !0;
            a.src = r + '?sdkid=' + e + '&lib=' + t;
            a.id = 'tiktok-pixel-script';
            var c = document.getElementsByTagName('script')[0];
            if (c && c.parentNode) {
              c.parentNode.insertBefore(a, c);
            } else {
              document.head.appendChild(a);
            }
          };
        })(window, document, 'ttq');
        /* eslint-enable */
      }

      if (window.ttq && typeof window.ttq.load === 'function') {
        window.ttq.load(cleanId);
        if (settings.trackPageViews && typeof window.ttq.page === 'function') {
          window.ttq.page();
        }
        this.initializedPixels.tiktok = cleanId;
      }
    } catch (err) {
      console.warn('[AnalyticsService] TikTok Pixel setup error:', err);
    }
  }

  /**
   * Google Tag Manager (GTM) Container Synchronization
   */
  private syncGTM(settings: MarketingTrackingSettings) {
    const cleanId = (settings.gtmContainerId || '').trim();

    if (!settings.gtmEnabled || !cleanId) {
      return;
    }

    if (this.initializedPixels.gtm === cleanId) {
      return;
    }

    try {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        'gtm.start': new Date().getTime(),
        event: 'gtm.js',
      });

      // Avoid injecting duplicate script
      const existingScript = document.getElementById('gtm-script');
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'gtm-script';
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(cleanId)}`;
        document.head.appendChild(script);
      }

      // Noscript iframe in body
      const existingNoscript = document.getElementById('gtm-noscript');
      if (!existingNoscript && document.body) {
        const noscript = document.createElement('noscript');
        noscript.id = 'gtm-noscript';
        noscript.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${encodeURIComponent(cleanId)}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
        document.body.insertAdjacentElement('afterbegin', noscript);
      }

      this.initializedPixels.gtm = cleanId;
    } catch (err) {
      console.warn('[AnalyticsService] GTM setup error:', err);
    }
  }

  /**
   * Google Analytics 4 (GA4 gtag.js) Synchronization
   */
  private syncGA4(settings: MarketingTrackingSettings) {
    const cleanId = (settings.ga4MeasurementId || '').trim();

    if (!settings.ga4Enabled || !cleanId) {
      return;
    }

    if (this.initializedPixels.ga4 === cleanId) {
      return;
    }

    try {
      window.dataLayer = window.dataLayer || [];
      if (!window.gtag) {
        window.gtag = function () {
          window.dataLayer!.push(arguments);
        };
      }

      const existingScript = document.getElementById('ga4-script');
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'ga4-script';
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(cleanId)}`;
        document.head.appendChild(script);
      }

      window.gtag('js', new Date());
      window.gtag('config', cleanId, {
        send_page_view: settings.trackPageViews,
      });

      this.initializedPixels.ga4 = cleanId;
    } catch (err) {
      console.warn('[AnalyticsService] GA4 setup error:', err);
    }
  }

  /**
   * Custom Scripts Injection
   */
  private syncCustomScripts(settings: MarketingTrackingSettings) {
    // Header script
    const existingCustomHeader = document.getElementById('custom-header-tracking-script');
    if (settings.customHeaderScript && settings.customHeaderScript.trim()) {
      if (!existingCustomHeader) {
        const div = document.createElement('div');
        div.id = 'custom-header-tracking-script';
        div.innerHTML = settings.customHeaderScript;
        document.head.appendChild(div);
      }
    }

    // Footer script
    const existingCustomFooter = document.getElementById('custom-footer-tracking-script');
    if (settings.customFooterScript && settings.customFooterScript.trim()) {
      if (!existingCustomFooter && document.body) {
        const div = document.createElement('div');
        div.id = 'custom-footer-tracking-script';
        div.innerHTML = settings.customFooterScript;
        document.body.appendChild(div);
      }
    }
  }

  /**
   * Track Virtual Page Views
   */
  public trackPageView(pageName: string, path: string = window.location.pathname) {
    if (!this.currentSettings.trackPageViews) return;

    try {
      // 1. Meta / Facebook
      if (this.currentSettings.facebookPixelEnabled && window.fbq) {
        window.fbq('track', 'PageView', { page_title: pageName, page_path: path });
      }

      // 2. TikTok
      if (this.currentSettings.tiktokPixelEnabled && window.ttq && typeof window.ttq.page === 'function') {
        window.ttq.page();
      }

      // 3. GA4
      if (this.currentSettings.ga4Enabled && window.gtag) {
        window.gtag('event', 'page_view', {
          page_title: pageName,
          page_location: window.location.href,
          page_path: path,
        });
      }

      // 4. GTM
      if (this.currentSettings.gtmEnabled && window.dataLayer) {
        window.dataLayer.push({
          event: 'virtual_page_view',
          page_title: pageName,
          page_path: path,
        });
      }
    } catch (e) {
      console.warn('[AnalyticsService] PageView track error:', e);
    }
  }

  /**
   * Track Companion / Escort Profile View (ViewContent / view_item)
   */
  public trackViewContent(item: { id: string; name: string; price?: number; category?: string; city?: string }) {
    if (!this.currentSettings.trackViewContent) return;

    const price = Number(item.price) || 0;

    try {
      // Meta / Facebook
      if (this.currentSettings.facebookPixelEnabled && window.fbq) {
        window.fbq('track', 'ViewContent', {
          content_name: item.name,
          content_category: item.category || 'Escort Companion',
          content_ids: [String(item.id)],
          content_type: 'product',
          value: price,
          currency: 'BDT',
        });
      }

      // TikTok
      if (this.currentSettings.tiktokPixelEnabled && window.ttq && typeof window.ttq.track === 'function') {
        window.ttq.track('ViewContent', {
          content_id: String(item.id),
          content_type: 'product',
          content_name: item.name,
          content_category: item.category || 'Escort Companion',
          price: price,
          currency: 'BDT',
        });
      }

      // GA4
      if (this.currentSettings.ga4Enabled && window.gtag) {
        window.gtag('event', 'view_item', {
          currency: 'BDT',
          value: price,
          items: [
            {
              item_id: String(item.id),
              item_name: item.name,
              item_category: item.category || 'Escort Companion',
              price: price,
            },
          ],
        });
      }

      // GTM
      if (this.currentSettings.gtmEnabled && window.dataLayer) {
        window.dataLayer.push({
          event: 'view_item',
          ecommerce: {
            items: [
              {
                item_id: String(item.id),
                item_name: item.name,
                item_category: item.category || 'Escort Companion',
                price: price,
              },
            ],
          },
        });
      }
    } catch (e) {
      console.warn('[AnalyticsService] ViewContent track error:', e);
    }
  }

  /**
   * Track Booking Initiation or Deposit Start (InitiateCheckout / begin_checkout)
   */
  public trackInitiateCheckout(details: { itemName?: string; value?: number; category?: string }) {
    if (!this.currentSettings.trackInitiateCheckout) return;

    const value = Number(details.value) || 0;
    const itemName = details.itemName || 'Booking Advance';

    try {
      // Meta / Facebook
      if (this.currentSettings.facebookPixelEnabled && window.fbq) {
        window.fbq('track', 'InitiateCheckout', {
          content_name: itemName,
          value: value,
          currency: 'BDT',
          num_items: 1,
        });
      }

      // TikTok
      if (this.currentSettings.tiktokPixelEnabled && window.ttq && typeof window.ttq.track === 'function') {
        window.ttq.track('InitiateCheckout', {
          content_name: itemName,
          value: value,
          currency: 'BDT',
        });
      }

      // GA4
      if (this.currentSettings.ga4Enabled && window.gtag) {
        window.gtag('event', 'begin_checkout', {
          currency: 'BDT',
          value: value,
          items: [{ item_name: itemName, price: value }],
        });
      }

      // GTM
      if (this.currentSettings.gtmEnabled && window.dataLayer) {
        window.dataLayer.push({
          event: 'begin_checkout',
          ecommerce: {
            value: value,
            currency: 'BDT',
            items: [{ item_name: itemName, price: value }],
          },
        });
      }
    } catch (e) {
      console.warn('[AnalyticsService] InitiateCheckout track error:', e);
    }
  }

  /**
   * Track Completed Payment or Advance Confirmation (Purchase / CompletePayment)
   */
  public trackPurchase(details: {
    transactionId: string;
    value: number;
    itemName?: string;
    paymentMethod?: string;
  }) {
    if (!this.currentSettings.trackPurchase) return;

    const value = Number(details.value) || 0;
    const itemName = details.itemName || 'Service Booking Deposit';

    try {
      // Meta / Facebook
      if (this.currentSettings.facebookPixelEnabled && window.fbq) {
        window.fbq('track', 'Purchase', {
          value: value,
          currency: 'BDT',
          transaction_id: details.transactionId,
          content_name: itemName,
        });
      }

      // TikTok
      if (this.currentSettings.tiktokPixelEnabled && window.ttq && typeof window.ttq.track === 'function') {
        window.ttq.track('CompletePayment', {
          content_id: details.transactionId,
          content_name: itemName,
          value: value,
          currency: 'BDT',
        });
      }

      // GA4
      if (this.currentSettings.ga4Enabled && window.gtag) {
        window.gtag('event', 'purchase', {
          transaction_id: details.transactionId,
          value: value,
          currency: 'BDT',
          payment_type: details.paymentMethod || 'Mobile Banking',
          items: [{ item_name: itemName, price: value }],
        });
      }

      // GTM
      if (this.currentSettings.gtmEnabled && window.dataLayer) {
        window.dataLayer.push({
          event: 'purchase',
          ecommerce: {
            transaction_id: details.transactionId,
            value: value,
            currency: 'BDT',
            payment_method: details.paymentMethod,
            items: [{ item_name: itemName, price: value }],
          },
        });
      }
    } catch (e) {
      console.warn('[AnalyticsService] Purchase track error:', e);
    }
  }

  /**
   * Track Lead Generation / Registration (Lead / CompleteRegistration)
   */
  public trackLead(details: { formName: string; category?: string; username?: string }) {
    if (!this.currentSettings.trackRegistration) return;

    try {
      // Meta / Facebook
      if (this.currentSettings.facebookPixelEnabled && window.fbq) {
        window.fbq('track', 'Lead', {
          content_name: details.formName,
          content_category: details.category || 'Client Registration',
        });
      }

      // TikTok
      if (this.currentSettings.tiktokPixelEnabled && window.ttq && typeof window.ttq.track === 'function') {
        window.ttq.track('SubmitForm', {
          content_name: details.formName,
        });
      }

      // GA4
      if (this.currentSettings.ga4Enabled && window.gtag) {
        window.gtag('event', 'generate_lead', {
          form_name: details.formName,
          form_category: details.category || 'Registration',
        });
      }

      // GTM
      if (this.currentSettings.gtmEnabled && window.dataLayer) {
        window.dataLayer.push({
          event: 'generate_lead',
          form_name: details.formName,
          form_category: details.category,
        });
      }
    } catch (e) {
      console.warn('[AnalyticsService] Lead track error:', e);
    }
  }

  /**
   * Track Customer Support / Contact Clicks (Telegram, WhatsApp, Helpline, LiveChat)
   */
  public trackContact(channel: 'whatsapp' | 'telegram' | 'helpline' | 'livechat', targetUrl?: string) {
    if (!this.currentSettings.trackContact) return;

    try {
      // Meta / Facebook
      if (this.currentSettings.facebookPixelEnabled && window.fbq) {
        window.fbq('trackCustom', 'ContactInitiated', {
          channel: channel,
          target_url: targetUrl || '',
        });
      }

      // TikTok
      if (this.currentSettings.tiktokPixelEnabled && window.ttq && typeof window.ttq.track === 'function') {
        window.ttq.track('Contact', {
          channel_type: channel,
        });
      }

      // GA4
      if (this.currentSettings.ga4Enabled && window.gtag) {
        window.gtag('event', 'contact_click', {
          contact_channel: channel,
          contact_url: targetUrl || '',
        });
      }

      // GTM
      if (this.currentSettings.gtmEnabled && window.dataLayer) {
        window.dataLayer.push({
          event: 'contact_click',
          contact_channel: channel,
          contact_url: targetUrl,
        });
      }
    } catch (e) {
      console.warn('[AnalyticsService] Contact track error:', e);
    }
  }

  /**
   * Custom Diagnostic / Test Fire Tool
   */
  public fireTestEvents(): { fired: string[]; timestamp: string } {
    const fired: string[] = [];

    if (this.currentSettings.facebookPixelEnabled && window.fbq) {
      window.fbq('trackCustom', 'TestEvent', {
        test_message: 'BodyTouch Ad Tracking Diagnostics Fired Successfully',
        timestamp: new Date().toISOString(),
      });
      fired.push(`Facebook Pixel (${this.currentSettings.facebookPixelId})`);
    }

    if (this.currentSettings.tiktokPixelEnabled && window.ttq && typeof window.ttq.track === 'function') {
      window.ttq.track('ClickButton', {
        button_name: 'Test Diagnostics Event',
      });
      fired.push(`TikTok Pixel (${this.currentSettings.tiktokPixelId})`);
    }

    if (this.currentSettings.ga4Enabled && window.gtag) {
      window.gtag('event', 'test_event', {
        test_source: 'Admin Diagnostics',
      });
      fired.push(`GA4 (${this.currentSettings.ga4MeasurementId})`);
    }

    if (this.currentSettings.gtmEnabled && window.dataLayer) {
      window.dataLayer.push({
        event: 'test_event',
        test_timestamp: new Date().toISOString(),
      });
      fired.push(`GTM Container (${this.currentSettings.gtmContainerId})`);
    }

    return {
      fired,
      timestamp: new Date().toLocaleTimeString(),
    };
  }

  public getCurrentSettings(): MarketingTrackingSettings {
    return { ...this.currentSettings };
  }
}

export const analyticsService = new AnalyticsService();
