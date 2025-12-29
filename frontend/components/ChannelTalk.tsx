'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    ChannelIO?: any;
    ChannelIOInitialized?: boolean;
  }
}

export default function ChannelTalk() {
  useEffect(() => {
    // 채널톡 플러그인 키 (환경변수에서 가져오기)
    const pluginKey = process.env.NEXT_PUBLIC_CHANNEL_TALK_PLUGIN_KEY;
    
    if (!pluginKey) {
      console.log('Channel Talk plugin key not configured');
      return;
    }

    // 이미 초기화되어 있으면 스킵
    if (window.ChannelIOInitialized) {
      return;
    }

    // 채널톡 스크립트 로드
    const ch = function() {
      (ch as any).c((arguments as any));
    };
    (ch as any).q = [];
    (ch as any).c = function(args: any) {
      (ch as any).q.push(args);
    };
    window.ChannelIO = ch;

    function loadChannelIO() {
      if (window.ChannelIO?.booted) {
        return;
      }
      const s = document.createElement('script');
      s.type = 'text/javascript';
      s.async = true;
      s.src = 'https://cdn.channel.io/plugin/ch-plugin-web.js';
      s.charset = 'UTF-8';
      const x = document.getElementsByTagName('script')[0];
      if (x && x.parentNode) {
        x.parentNode.insertBefore(s, x);
      }
    }

    if (document.readyState === 'complete') {
      loadChannelIO();
    } else {
      window.addEventListener('load', loadChannelIO);
    }

    // 채널톡 부트
    window.ChannelIO('boot', {
      pluginKey: pluginKey,
      customLauncherSelector: '.channel-talk-launcher',
      hideChannelButtonOnBoot: false,
      language: 'ko',
    });

    window.ChannelIOInitialized = true;

    return () => {
      if (window.ChannelIO) {
        window.ChannelIO('shutdown');
        window.ChannelIOInitialized = false;
      }
    };
  }, []);

  return null;
}
