import { useState } from 'react'
import HomeRoundedIcon from '@mui/icons-material/HomeRounded'
import ShareRoundedIcon from '@mui/icons-material/ShareRounded'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded'
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded'
import { siteConfig } from '../config/site'

type SiteTheme = 'dark' | 'light'

type Props = {
  theme: SiteTheme
  onToggleTheme: () => void
}

function Appbar({ theme, onToggleTheme }: Props) {
  const [copied, setCopied] = useState(false)

  const share = async () => {
    const shareData = {
      title: siteConfig.name,
      text: '#コンパス履歴書ジェネレーター でプロフィール画像を作ろう！',
      url: siteConfig.url,
    }
    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`)
        setCopied(true)
        window.setTimeout(() => setCopied(false), 2200)
      }
    } catch {
      // Closing the native share sheet is a normal user action.
    }
  }

  return (
    <header className="appbar" id="top">
      <a className="brand" href="/" aria-label="ページの先頭へ">
        <span className="brand-mark">#</span>
        <span>コンパス履歴書</span>
        <small>GENERATOR V2</small>
      </a>
      <nav aria-label="サイトメニュー">
        <button
          className="site-theme-toggle"
          type="button"
          aria-label={`${theme === 'dark' ? 'ライト' : 'ダーク'}テーマに切り替える`}
          title={`${theme === 'dark' ? 'ライト' : 'ダーク'}テーマに切り替える`}
          onClick={onToggleTheme}
        >
          {theme === 'dark' ? <LightModeRoundedIcon /> : <DarkModeRoundedIcon />}
          <span>{theme === 'dark' ? 'ライト' : 'ダーク'}</span>
        </button>
        <a href={siteConfig.parentSiteUrl} target="_blank" rel="noreferrer" aria-label="ホームサイトを開く">
          <HomeRoundedIcon />
        </a>
        <button type="button" onClick={share} aria-label="このページを共有">
          {copied ? <CheckRoundedIcon /> : <ShareRoundedIcon />}
          <span>{copied ? 'コピー済み' : 'シェア'}</span>
        </button>
      </nav>
    </header>
  )
}

export default Appbar
